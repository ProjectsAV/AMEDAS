import type { Template } from 'tinacms'
import { descricao, px, tamanhos } from '../campos'

export const mainButton: Template = {
  name: 'mainButton',
  label: 'Botão principal',
  fields: [
    descricao(
      'Botão principal: usado na ação mais importante de cada ecrã (ex.: Guardar, Enviar, Comprar). ' +
        'As cores são definidas em Tokens → Cores.',
    ),
    ...tamanhos,
    px('radius', 'Arredondamento', 0, 40),
    px('borderWidth', 'Espessura da borda', 0, 8),
  ],
}
