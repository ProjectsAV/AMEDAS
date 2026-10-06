import type { Template } from 'tinacms'
import { claroEscuro, descricao, nomeUnico, rgba, slug } from '../campos'

export const colors: Template = {
  name: 'colors',
  label: 'Cores',
  fields: [
    descricao(
      'Cores do site. Cada cor tem uma versão para o tema claro e outra para o tema escuro. ' +
        'Formato rgba: o último valor é a opacidade (0 = transparente, 1 = opaca).',
    ),
    claroEscuro('background', 'Fundo'),
    claroEscuro('text', 'Texto'),
    claroEscuro('h1', 'Título H1'),
    claroEscuro('h2', 'Título H2'),
    claroEscuro('h3', 'Título H3'),
    claroEscuro('h4', 'Título H4'),
    claroEscuro('h5', 'Título H5'),
    claroEscuro('primary', 'Cor principal'),
    claroEscuro('secondary', 'Cor secundária'),
    claroEscuro('tertiary', 'Cor terciária'),
    claroEscuro('separator', 'Separadores'),
    {
      name: 'custom',
      label: 'Cores personalizadas',
      description: 'Acrescenta ou remove cores. O nome dá origem à variável CSS (ex.: "Azul Marca" → --color-custom-azul-marca).',
      type: 'object',
      list: true,
      ui: {
        // Na lista: "Nome (--variável) — descrição", para se perceber para que serve cada cor.
        itemProps: (item) => {
          if (!item?.name) return { label: 'Nova cor' }
          const nota = item.description ? ` — ${item.description}` : ''
          return { label: `${item.name}  (--color-custom-${slug(item.name)})${nota}` }
        },
        defaultItem: { name: '', color: 'rgba(0, 0, 0, 1)' },
      },
      fields: [
        nomeUnico('custom', 'Já existe uma cor com este nome'),
        rgba('color', 'Cor'),
        {
          name: 'description',
          label: 'Descrição (opcional)',
          description: 'Só para orientação de quem edita (ex.: "Esta cor é para a nav do mobile"). Não vai para o CSS.',
          type: 'string',
          ui: { component: 'textarea' },
        },
      ],
    },
  ],
}
