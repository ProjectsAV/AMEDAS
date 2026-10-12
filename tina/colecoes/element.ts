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

// Tipos de bloco de um conteúdo. Cada tipo só pode aparecer uma vez por idioma, por isso o máximo de blocos é o número de tipos.
// O scripts/gerar.mjs tem a mesma lista em TIPOS_BLOCO: têm de ficar iguais.
const TIPOS = [
  { value: 'title', label: 'Título (title)' },
  { value: 'text', label: 'Texto (text)' },
  { value: 'eyebrow', label: 'Antetítulo (eyebrow)' },
]

// Blocos de um conteúdo: pelo menos um, todos com tipo e sem tipos repetidos.
const blocosValidos = (value?: any[]) => {
  const tipos = (value ?? []).map((b) => b?.type)
  if (!tipos.length) return 'Acrescenta pelo menos um bloco'
  if (tipos.some((t) => !t)) return 'Escolhe o tipo de cada bloco'
  return tipos.some((t, i) => tipos.indexOf(t) !== i) ? 'Cada tipo só pode aparecer uma vez neste idioma' : undefined
}

// Idioma de um conteúdo: obrigatório e sem repetir dentro do mesmo elemento.
// Os irmãos encontram-se pelo caminho do campo ("items.0.contents.2.language" → "items.0.contents").
const idiomaUnico = (value?: string, todos?: any, meta?: { name?: string }) => {
  if (!value) return 'Escolhe um idioma'
  const caminho = meta?.name ? meta.name.split('.').slice(0, -2) : []
  const irmaos = caminho.reduce((o: any, k) => o?.[k], todos) ?? []
  const iguais = irmaos.filter((c: any) => c?.language === value).length
  return iguais > 1 ? 'Este idioma já existe neste elemento' : undefined
}

// Ficheiros livres: o utilizador cria e apaga ficheiros, e em cada um acrescenta ou remove
// elementos { title, contents[] }, cada um com um conteúdo por idioma { language, blocks[] }.
// Os blocos { type, content } partilham o idioma do conteúdo onde estão.
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
      'Lista de elementos. Cada elemento tem um título e uma lista de conteúdos, um por idioma (não pode haver dois conteúdos com o mesmo idioma). ' +
        'Cada conteúdo tem de 1 a 3 blocos (título, texto e antetítulo), todos no idioma do conteúdo.',
    ),
    {
      name: 'items',
      label: 'Elementos',
      type: 'object',
      list: true,
      ui: {
        // Na lista: "título (pt, en)"
        itemProps: (item) => {
          const titulo = item?.title || 'Sem título'
          const idiomas = (item?.contents ?? []).map((c: any) => c?.language).filter(Boolean)
          return { label: idiomas.length ? `${titulo} (${idiomas.join(', ')})` : titulo }
        },
        defaultItem: { title: '', contents: [{ language: 'default', blocks: [{ type: 'text', content: '' }] }] },
      },
      fields: [
        { name: 'title', label: 'Título', type: 'string' },
        {
          name: 'contents',
          label: 'Conteúdos',
          description: 'Um conteúdo por idioma. Não pode haver dois com o mesmo idioma.',
          type: 'object',
          list: true,
          ui: {
            // Na lista: "[idioma] início do primeiro bloco com texto"
            itemProps: (item) => {
              const idioma = item?.language ? `[${item.language}] ` : ''
              const primeiro = (item?.blocks ?? []).find((b: any) => b?.content)?.content
              const texto = primeiro ? String(primeiro).slice(0, 60) : 'Sem conteúdo'
              return { label: `${idioma}${texto}` }
            },
            defaultItem: { language: 'default', blocks: [{ type: 'text', content: '' }] },
          },
          fields: [
            { name: 'language', label: 'Idioma', type: 'string', required: true, options: IDIOMAS, ui: { validate: idiomaUnico } },
            {
              name: 'blocks',
              label: 'Blocos',
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
    },
  ],
}
