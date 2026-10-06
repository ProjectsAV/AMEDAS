import type { Collection } from 'tinacms'
import { mainButton } from '../templates/mainButton'
import { navButton } from '../templates/navButton'
import { secondaryButton } from '../templates/secondaryButton'

// Uma só coleção com 3 ficheiros fixos (um por tipo de botão).
// Cada ficheiro indica o tipo em "_template", e o formulário mostra os campos desse tipo.
export const button: Collection = {
  name: 'button',
  label: 'Botões',
  path: 'conteudo/button',
  format: 'json',
  templates: [mainButton, secondaryButton, navButton],
  ui: {
    // Só se podem alterar as propriedades: sem criar, apagar, mudar o nome ou criar pastas.
    allowedActions: { create: false, delete: false, createFolder: false, createNestedFolder: false },
  },
}
