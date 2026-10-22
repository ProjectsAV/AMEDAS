import type { Collection } from 'tinacms'
import { descricao, nomeFicheiro } from '../campos'
import { blocos } from '../componentes/blocos'

// Idiomas de um elemento. "default" = sem idioma específico (serve para todos).
export const IDIOMAS = [
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

// Tipos de bloco de texto. Os que não estão em REPETIVEIS só podem aparecer uma vez em cada idioma e em cada grupo.
// O scripts/gerar.mjs tem as mesmas listas em TIPOS_BLOCO e REPETIVEIS: têm de ficar iguais.
export const TIPOS = [
  { value: 'title', label: 'Título (title)' },
  { value: 'text', label: 'Texto (text)' },
  { value: 'eyebrow', label: 'Antetítulo (eyebrow)' },
  { value: 'subtitle', label: 'Subtítulo (subtitle)' },
  { value: 'item', label: 'Item de lista (item)' },
  { value: 'quote', label: 'Citação (quote)' },
]
export const REPETIVEIS = ['item']

// Tipo dos blocos que juntam outros blocos relacionados (ex.: uma pergunta e a resposta), em "contents".
// Pode repetir-se, mas só no primeiro nível: um grupo não tem grupos. O scripts/gerar.mjs tem o mesmo valor em GRUPO.
export const GRUPO = 'group'

// Blocos de um idioma (comGrupos) ou de um grupo: pelo menos um, todos com tipo, sem repetir os tipos
// que não estão em REPETIVEIS; os grupos são validados da mesma forma. Devolve a mensagem de erro, ou undefined.
const blocosValidos = (blocos: any[], comGrupos: boolean): string | undefined => {
  if (!blocos.length) return comGrupos ? 'Cada idioma tem de ter pelo menos um bloco' : 'Cada grupo tem de ter pelo menos um bloco'
  if (blocos.some((b) => !b?.type)) return 'Escolhe o tipo de cada bloco'
  const tipos = blocos.map((b) => b.type)
  if (tipos.some((t, i) => !REPETIVEIS.includes(t) && t !== GRUPO && tipos.indexOf(t) !== i))
    return 'Cada tipo (exceto o item de lista) só pode aparecer uma vez em cada idioma e em cada grupo'
  for (const b of blocos.filter((b) => b.type === GRUPO)) {
    if (!comGrupos) return 'Um grupo não pode ter outros grupos'
    const erro = blocosValidos(b.contents ?? [], false)
    if (erro) return erro
  }
  return undefined
}

// Idiomas de um elemento (campo contentBlock): pelo menos um, cada um com idioma, sem repetir idiomas e com blocos válidos.
const idiomasValidos = (value?: any[]) => {
  const lista = value ?? []
  if (!lista.length) return 'Acrescenta pelo menos um idioma'
  if (lista.some((c) => !c?.language)) return 'Escolhe o idioma de cada secção'
  const idiomas = lista.map((c) => c.language)
  if (idiomas.some((l, i) => idiomas.indexOf(l) !== i)) return 'Cada idioma só pode aparecer uma vez neste elemento'
  for (const c of lista) {
    const erro = blocosValidos(c.contents ?? [], true)
    if (erro) return erro
  }
  return undefined
}

// Campos de um bloco de texto { type, content }.
const camposTexto = (tipos: { value: string; label: string }[]) => [
  { name: 'type', label: 'Tipo', type: 'string' as const, options: tipos },
  { name: 'content', label: 'Conteúdo', type: 'string' as const, ui: { component: 'textarea' } },
]

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
// elementos { name, contentBlock[] }: um contentBlock { language, contents[] } por idioma, com os blocos { type, content }
// e os grupos { type: 'group', contents[] }.
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
        'um subtítulo, um texto, um antetítulo, uma citação e vários itens de lista. Para conteúdos relacionados ' +
        '(ex.: perguntas e respostas), acrescenta grupos: cada grupo tem os seus blocos. ' +
        'Para ter o mesmo texto noutro idioma, acrescenta outro idioma ao elemento.',
    ),
    {
      name: 'items',
      label: 'Elementos',
      type: 'object',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.name || 'Sem nome' }),
        defaultItem: { name: '', contentBlock: [{ language: 'default', contents: [{ type: 'text', content: '' }] }] },
      },
      fields: [
        { name: 'name', label: 'Nome', type: 'string', required: true, ui: { validate: nomeValido } },
        {
          name: 'contentBlock',
          label: 'Conteúdos',
          description: 'Um ou mais idiomas, cada um com pelo menos um bloco. Os itens de lista podem repetir-se; os outros tipos, um de cada em cada grupo.',
          type: 'object',
          list: true,
          // O componente mostra uma secção por idioma (blocos e pré-visualização);
          // os campos abaixo definem a forma do JSON.
          ui: { component: blocos(TIPOS, IDIOMAS, REPETIVEIS, GRUPO), validate: idiomasValidos },
          fields: [
            { name: 'language', label: 'Idioma', type: 'string', options: IDIOMAS },
            {
              name: 'contents',
              label: 'Blocos',
              type: 'object',
              list: true,
              fields: [
                ...camposTexto([...TIPOS, { value: GRUPO, label: 'Grupo (group)' }]),
                // Só nos blocos do tipo "group". Um nível só: o Tina não aceita schemas recursivos.
                { name: 'contents', label: 'Blocos do grupo', type: 'object', list: true, fields: camposTexto(TIPOS) },
              ],
            },
          ],
        },
      ],
    },
  ],
}
