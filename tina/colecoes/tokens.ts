import type { Collection } from 'tinacms'
import { colors } from '../templates/colors'

// Tokens de design partilhados por todas as libs (para já, só as cores).
// Ficheiros fixos: cada um indica o tipo em "_template".
export const tokens: Collection = {
  name: 'tokens',
  label: 'Tokens',
  path: 'conteudo/tokens',
  format: 'json',
  templates: [colors],
  ui: {
    // Só se podem alterar as propriedades: sem criar, apagar, mudar o nome ou criar pastas.
    allowedActions: { create: false, delete: false, createFolder: false, createNestedFolder: false },
  },
}
