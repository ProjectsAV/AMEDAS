import type { Template } from 'tinacms'
import { descricao, px, tamanhos } from '../campos'

export const secondaryButton: Template = {
  name: 'secondaryButton',
  label: 'Botão secundário',
  fields: [
    descricao(
      'Botão secundário: usado em ações alternativas ao lado do principal (ex.: Cancelar, Voltar). ' +
        'As cores são definidas em Tokens → Cores.',
    ),
    ...tamanhos,
    px('radius', 'Arredondamento', 0, 40),
    px('borderWidth', 'Espessura da borda', 0, 8),
  ],
}
