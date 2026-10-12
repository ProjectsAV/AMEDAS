import type { Collection } from 'tinacms'
import { descricao, nomeFicheiro } from '../campos'

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
// elementos { title, contents[] }, cada um com um conteúdo por idioma { content, language }.
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
      'Lista de elementos. Cada elemento tem um título e uma lista de conteúdos, um por idioma (não pode haver dois conteúdos com o mesmo idioma).',
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
        defaultItem: { title: '', contents: [{ content: '', language: 'default' }] },
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
            // Na lista: "[idioma] início do conteúdo"
            itemProps: (item) => {
              const idioma = item?.language ? `[${item.language}] ` : ''
              const texto = item?.content ? String(item.content).slice(0, 60) : 'Sem conteúdo'
              return { label: `${idioma}${texto}` }
            },
            defaultItem: { content: '', language: 'default' },
          },
          fields: [
            { name: 'language', label: 'Idioma', type: 'string', required: true, options: IDIOMAS, ui: { validate: idiomaUnico } },
            { name: 'content', label: 'Conteúdo', type: 'string', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
  ],
}
