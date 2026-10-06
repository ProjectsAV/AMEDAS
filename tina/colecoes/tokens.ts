import type { Collection } from 'tinacms'
import { colors } from '../templates/colors'
import { text } from '../templates/text'

// Tokens de design partilhados por todas as libs: cores e tamanhos de texto.
// Ficheiros fixos: cada um indica o tipo em "_template".
export const tokens: Collection = {
  name: 'tokens',
  label: 'Tokens',
  path: 'conteudo/tokens',
  format: 'json',
  templates: [colors, text],
  ui: {
    // Só se podem alterar as propriedades: sem criar, apagar, mudar o nome ou criar pastas.
    allowedActions: { create: false, delete: false, createFolder: false, createNestedFolder: false },
  },
}
