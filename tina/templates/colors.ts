import type { Template } from 'tinacms'
import { claroEscuro, descricao, nomeUnico, rgba, slug } from '../campos'

// Cores com versão clara e escura, pela ordem do formulário: chave do JSON → etiqueta.
// O scripts/gerar.mjs tem a mesma lista em PARES.
const PARES: [string, string][] = [
  ['background', 'Fundo'],
  ['text', 'Texto'],
  ['h1', 'Título H1'],
  ['h2', 'Título H2'],
  ['h3', 'Título H3'],
  ['h4', 'Título H4'],
  ['h5', 'Título H5'],
  ['primary', 'Cor principal'],
  ['secondary', 'Cor secundária'],
  ['tertiary', 'Cor terciária'],
  ['separator', 'Separadores'],
]

// Valores com que começa uma configuração nova: todas as cores ficam preenchidas
// (o gerador precisa delas) e quem edita só muda o que quiser.
const corDoTexto = { light: 'rgba(17, 24, 39, 1)', dark: 'rgba(243, 244, 246, 1)' }
const novaConfiguracao = {
  name: '',
  background: { light: 'rgba(255, 255, 255, 1)', dark: 'rgba(17, 24, 39, 1)' },
  ...Object.fromEntries(['text', 'h1', 'h2', 'h3', 'h4', 'h5', 'primary', 'secondary', 'tertiary'].map((k) => [k, { ...corDoTexto }])),
  separator: { light: 'rgba(17, 24, 39, 0.12)', dark: 'rgba(255, 255, 255, 0.12)' },
  custom: [],
}

export const colors: Template = {
  name: 'colors',
  label: 'Cores',
  fields: [
    descricao(
      'Configurações de cores. Cada configuração tem um nome próprio e um conjunto completo de cores, ' +
        'e cada cor tem uma versão para o tema claro e outra para o tema escuro. ' +
        'Formato rgba: o último valor é a opacidade (0 = transparente, 1 = opaca).',
    ),
    {
      name: 'configurations',
      label: 'Configurações',
      description:
        'Acrescenta ou remove configurações. O nome dá origem às variáveis CSS ' +
        '(ex.: "Tema Natal" → --color--tema-natal--h1). Não pode haver duas com o mesmo nome.',
      type: 'object',
      list: true,
      ui: {
        itemProps: (item) =>
          item?.name ? { label: `${item.name}  (--color--${slug(item.name)}--…)` } : { label: 'Nova configuração' },
        defaultItem: novaConfiguracao,
      },
      fields: [
        nomeUnico('configurations', 'Já existe uma configuração com este nome'),
        ...PARES.map(([k, label]) => claroEscuro(k, label)),
        {
          name: 'custom',
          label: 'Cores personalizadas',
          description:
            'Acrescenta ou remove cores desta configuração. O nome dá origem à variável CSS ' +
            '(ex.: "Azul Marca" → --color--nome-da-configuração--custom-azul-marca).',
          type: 'object',
          list: true,
          ui: {
            // Na lista: "Nome (--…-custom-variável) — descrição", para se perceber para que serve cada cor.
            // O itemProps não conhece a configuração, por isso o início da variável aparece como "…".
            itemProps: (item) => {
              if (!item?.name) return { label: 'Nova cor' }
              const nota = item.description ? ` — ${item.description}` : ''
              return { label: `${item.name}  (--color--…--custom-${slug(item.name)})${nota}` }
            },
            defaultItem: { name: '', color: 'rgba(0, 0, 0, 1)' },
          },
          fields: [
            nomeUnico('custom', 'Já existe uma cor com este nome nesta configuração'),
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
    },
  ],
}
