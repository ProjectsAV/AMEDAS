import type { Template } from 'tinacms'
import { descricao, px, tamanhos } from '../campos'

export const navButton: Template = {
  name: 'navButton',
  label: 'Botão de navegação',
  fields: [
    descricao(
      'Botão de navegação: usado nos menus para mudar de página. O sublinhado marca a página ativa. ' +
        'As cores são definidas em Tokens → Cores.',
    ),
    ...tamanhos,
    px('indicatorHeight', 'Espessura do sublinhado', 0, 8),
    { name: 'icon', label: 'Ícone (opcional)', type: 'image' },
  ],
}
