import type { Template } from 'tinacms'
import { descricao, nomeUnico, px, slug } from '../campos'

export const text: Template = {
  name: 'text',
  label: 'Texto',
  fields: [
    descricao('Tamanhos do texto do site, em px. Os títulos e o texto corrido aceitam valores entre 1 e 450.'),
    px('h1Size', 'Título H1', 1, 450),
    px('h2Size', 'Título H2', 1, 450),
    px('h3Size', 'Título H3', 1, 450),
    px('h4Size', 'Título H4', 1, 450),
    px('paragraphSize', 'Parágrafos', 1, 450),
    px('mainContentSize', 'Conteúdo principal', 1, 450),
    {
      name: 'customSizes',
      label: 'Tamanhos personalizados',
      description:
        'Acrescenta ou remove tamanhos. O nome dá origem à variável CSS (ex.: "Legenda Pequena" → --font-size-custom-legenda-pequena).',
      type: 'object',
      list: true,
      ui: {
        // Na lista: "Nome (--variável) — 24px — descrição", para se perceber para que serve cada tamanho.
        itemProps: (item) => {
          if (!item?.name) return { label: 'Novo tamanho' }
          const tamanho = item.size != null ? ` — ${item.size}px` : ''
          const nota = item.description ? ` — ${item.description}` : ''
          return { label: `${item.name}  (--font-size-custom-${slug(item.name)})${tamanho}${nota}` }
        },
        defaultItem: { name: '', size: 16 },
      },
      fields: [
        nomeUnico('customSizes', 'Já existe um tamanho com este nome'),
        px('size', 'Tamanho', 0, 450),
        {
          name: 'description',
          label: 'Descrição (opcional)',
          description: 'Só para orientação de quem edita (ex.: "Para as legendas das imagens"). Não vai para o CSS.',
          type: 'string',
          ui: { component: 'textarea' },
        },
      ],
    },
  ],
}
