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

// Ficheiros livres: o utilizador cria e apaga ficheiros, e em cada um
// acrescenta ou remove elementos { type, content, language }.
export const elementos: Collection = {
  name: 'elementos',
  label: 'Elementos',
  path: 'conteudo/elementos',
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
    descricao('Lista de elementos. Cada elemento tem um tipo e um conteúdo (ambos em texto) e um idioma.'),
    {
      name: 'items',
      label: 'Elementos',
      type: 'object',
      list: true,
      ui: {
        // Na lista: "[idioma] tipo — início do conteúdo" (sem prefixo quando é "default")
        itemProps: (item) => {
          const idioma = item?.language && item.language !== 'default' ? `[${item.language}] ` : ''
          const tipo = item?.type || 'Sem tipo'
          const texto = item?.content ? ` — ${String(item.content).slice(0, 60)}` : ''
          return { label: `${idioma}${tipo}${texto}` }
        },
        defaultItem: { type: '', content: '', language: 'default' },
      },
      fields: [
        { name: 'type', label: 'Tipo', type: 'string' },
        { name: 'content', label: 'Conteúdo', type: 'string', ui: { component: 'textarea' } },
        { name: 'language', label: 'Idioma', type: 'string', required: true, options: IDIOMAS },
      ],
    },
  ],
}
