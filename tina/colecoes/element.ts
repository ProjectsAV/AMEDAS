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

// Tipos de bloco de um elemento. Cada tipo só pode aparecer uma vez por elemento, por isso o máximo de blocos é o número de tipos.
// O scripts/gerar.mjs tem a mesma lista em TIPOS_BLOCO: têm de ficar iguais.
const TIPOS = [
  { value: 'title', label: 'Título (title)' },
  { value: 'text', label: 'Texto (text)' },
  { value: 'eyebrow', label: 'Antetítulo (eyebrow)' },
]

// Blocos de um elemento: pelo menos um, todos com tipo e sem tipos repetidos.
const blocosValidos = (value?: any[]) => {
  const tipos = (value ?? []).map((b) => b?.type)
  if (!tipos.length) return 'Acrescenta pelo menos um bloco'
  if (tipos.some((t) => !t)) return 'Escolhe o tipo de cada bloco'
  return tipos.some((t, i) => tipos.indexOf(t) !== i) ? 'Cada tipo só pode aparecer uma vez neste elemento' : undefined
}

// Idioma de um elemento: obrigatório e sem repetir o par nome + idioma no mesmo ficheiro
// (o mesmo nome em dois idiomas são duas versões do mesmo texto).
// Os irmãos encontram-se pelo caminho do campo ("items.2.language" → "items").
const idiomaUnico = (value?: string, todos?: any, meta?: { name?: string }) => {
  if (!value) return 'Escolhe um idioma'
  const caminho = meta?.name ? meta.name.split('.').slice(0, -2) : ['items']
  const irmaos = caminho.reduce((o: any, k) => o?.[k], todos) ?? []
  const este = meta?.name ? caminho.concat(meta.name.split('.').slice(-2, -1)).reduce((o: any, k) => o?.[k], todos) : undefined
  const nome = (este?.name ?? '').trim()
  const iguais = irmaos.filter((c: any) => c?.language === value && (c?.name ?? '').trim() === nome).length
  return iguais > 1 ? 'Já existe um elemento com este nome neste idioma' : undefined
}

// Ficheiros livres: o utilizador cria e apaga ficheiros, e em cada um acrescenta ou remove
// elementos { name, language, contents[] }. Os blocos { type, content } partilham o idioma do elemento.
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
      'Lista de elementos. Cada elemento tem um nome, um idioma e de 1 a 3 blocos (título, texto e antetítulo). ' +
        'Para ter o mesmo texto noutro idioma, cria outro elemento com o mesmo nome e o outro idioma.',
    ),
    {
      name: 'items',
      label: 'Elementos',
      type: 'object',
      list: true,
      ui: {
        // Na lista: "nome [pt]"
        itemProps: (item) => {
          const nome = item?.name || 'Sem nome'
          return { label: item?.language ? `${nome} [${item.language}]` : nome }
        },
        defaultItem: { name: '', language: 'default', contents: [{ type: 'text', content: '' }] },
      },
      fields: [
        {
          name: 'name',
          label: 'Nome',
          type: 'string',
          required: true,
          ui: { validate: (value?: string) => (value?.trim() ? undefined : 'Escreve um nome') },
        },
        { name: 'language', label: 'Idioma', type: 'string', required: true, options: IDIOMAS, ui: { validate: idiomaUnico } },
        {
          name: 'contents',
          label: 'Conteúdos',
          description: 'De 1 a 3 blocos, um de cada tipo, todos no idioma escolhido acima.',
          type: 'object',
          list: true,
          // O componente mostra os blocos lado a lado (tipo e conteúdo); os campos abaixo definem a forma do JSON.
          ui: { component: blocos(TIPOS), validate: blocosValidos },
          fields: [
            { name: 'type', label: 'Tipo', type: 'string', options: TIPOS },
            { name: 'content', label: 'Conteúdo', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
  ],
}
