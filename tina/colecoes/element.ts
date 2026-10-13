import type { Collection } from 'tinacms'
import { descricao, nomeFicheiro } from '../campos'
import { blocos } from '../componentes/blocos'

// Idiomas de um elemento. "default" = sem idioma específico (serve para todos).
const IDIOMAS = [
  { value: 'default', label: 'Predefinido (todos os idiomas)' },
  { value: 'en', label: 'Inglês (en)' },
  { value: 'pt', label: 'Português (pt)' },
  { value: 'es', label: 'Espanhol (es)' },
  { value: 'fr', label: 'Francês (fr)' },
  { value: 'it', label: 'Italiano (it)' },
  { value: 'de', label: 'Alemão (de)' },
  { value: 'sv', label: 'Sueco (sv)' },
  { value: 'ru', label: 'Russo (ru)' },
  { value: 'pl', label: 'Polaco (pl)' },
  { value: 'no', label: 'Norueguês (no)' },
  { value: 'ja', label: 'Japonês (ja)' },
]

// Tipos de bloco. Num elemento, cada tipo só pode aparecer uma vez por idioma.
// O scripts/gerar.mjs tem a mesma lista em TIPOS_BLOCO: têm de ficar iguais.
const TIPOS = [
  { value: 'title', label: 'Título (title)' },
  { value: 'text', label: 'Texto (text)' },
  { value: 'eyebrow', label: 'Antetítulo (eyebrow)' },
]

// Blocos de um elemento: pelo menos um, todos com idioma e tipo, e sem repetir o par idioma + tipo.
const blocosValidos = (value?: any[]) => {
  const lista = value ?? []
  if (!lista.length) return 'Acrescenta pelo menos um bloco'
  if (lista.some((b) => !b?.language)) return 'Escolhe o idioma de cada bloco'
  if (lista.some((b) => !b?.type)) return 'Escolhe o tipo de cada bloco'
  const pares = lista.map((b) => `${b.language}\n${b.type}`)
  return pares.some((p, i) => pares.indexOf(p) !== i) ? 'Cada tipo só pode aparecer uma vez em cada idioma' : undefined
}

// Nome de um elemento: obrigatório e único no ficheiro (comparado sem espaços nas pontas).
// Os irmãos encontram-se pelo caminho do campo ("items.2.name" → "items").
const nomeValido = (value?: string, todos?: any, meta?: { name?: string }) => {
  const nome = value?.trim()
  if (!nome) return 'Escreve um nome'
  const caminho = meta?.name ? meta.name.split('.').slice(0, -2) : ['items']
  const irmaos = caminho.reduce((o: any, k) => o?.[k], todos) ?? []
  const iguais = irmaos.filter((c: any) => (c?.name ?? '').trim() === nome).length
  return iguais > 1 ? 'Já existe um elemento com este nome' : undefined
}

// Ficheiros livres: o utilizador cria e apaga ficheiros, e em cada um acrescenta ou remove
// elementos { name, contents[] }. Cada bloco { language, type, content } tem o seu idioma.
export const element: Collection = {
  name: 'element',
  label: 'Elementos',
  path: 'conteudo/element',
  format: 'json',
  ui: {
    // Pode criar e apagar ficheiros; pastas não, para manter tudo ao mesmo nível.
    allowedActions: { create: true, delete: true, createFolder: false, createNestedFolder: false },
    // Nome do ficheiro sem pastas nem acentos: "Página Inicial" → "Pagina-Inicial". Também se aplica ao Rename.
    // A descrição é HTML (ver AGENTS.md, ponto 10).
    filename: {
      showFirst: true,
      parse: nomeFicheiro,
      description:
        'Nome do ficheiro, único. Pode ter letras maiúsculas e minúsculas, números, - e _.<br>' +
        'Os espaços e a / passam a - e os acentos são retirados. Ex.: Pagina-Inicial, menu_topo',
    },
  },
  fields: [
    descricao(
      'Lista de elementos. Cada elemento tem um nome e uma secção por idioma. Em cada idioma pode haver um título, ' +
        'um texto e um antetítulo. Para ter o mesmo texto noutro idioma, acrescenta outro idioma ao elemento.',
    ),
    {
      name: 'items',
      label: 'Elementos',
      type: 'object',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.name || 'Sem nome' }),
        defaultItem: { name: '', contents: [{ language: 'default', type: 'text', content: '' }] },
      },
      fields: [
        { name: 'name', label: 'Nome', type: 'string', required: true, ui: { validate: nomeValido } },
        {
          name: 'contents',
          label: 'Conteúdos',
          description: 'Um ou mais idiomas, cada um com 1 a 3 blocos (título, texto e antetítulo, um de cada).',
          type: 'object',
          list: true,
          // O componente agrupa os blocos numa secção por idioma (blocos e pré-visualização);
          // os campos abaixo definem a forma do JSON, que continua plana.
          ui: { component: blocos(TIPOS, IDIOMAS), validate: blocosValidos },
          fields: [
            { name: 'language', label: 'Idioma', type: 'string', options: IDIOMAS },
            { name: 'type', label: 'Tipo', type: 'string', options: TIPOS },
            { name: 'content', label: 'Conteúdo', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
  ],
}
