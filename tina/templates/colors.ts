import type { Template } from 'tinacms'
import { claroEscuro, descricao, nomeUnico, rgba, slug } from '../campos'

// Cores com versão clara e escura, pela ordem do formulário: chave do JSON → etiqueta.
// O scripts/gerar.mjs tem a mesma lista em PARES.
export const PARES: [string, string][] = [
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

// Uma configuração nova começa sem cores: herda todas da base (a primeira da lista) até quem edita definir as suas.
const novaConfiguracao = { name: '', custom: [] }

// A base tem de ter todas as cores, com as duas versões (as outras herdam dela).
// Corre sobre a lista inteira, para apanhar a base mesmo que os submenus das cores nunca tenham sido abertos
// (por exemplo, depois de apagar ou mover a primeira configuração).
const baseCompleta = (lista?: any[]) => {
  if (!lista?.length) return 'Tem de haver pelo menos uma configuração'
  const falta = PARES.filter(([k]) => !lista[0]?.[k]?.light || !lista[0]?.[k]?.dark).map(([, label]) => label)
  if (falta.length) return `A primeira configuração ("${lista[0]?.name ?? ''}") é a base e tem de ter todas as cores. Falta: ${falta.join(', ')}`
}

export const colors: Template = {
  name: 'colors',
  label: 'Cores',
  fields: [
    descricao(
      'Configurações de cores (uma por marca ou produto). Cada cor tem uma versão para o tema claro e outra para o tema escuro. ' +
        'A primeira configuração da lista é a base: tem todas as cores e é a que se usa por omissão. ' +
        'Nas outras, só é preciso definir as cores que mudam: as que ficam vazias herdam as da base, ' +
        'por isso mudar uma cor da base muda-a também em todas as configurações que a herdam. ' +
        'Formato rgba: o último valor é a opacidade (0 = transparente, 1 = opaca). ' +
        'Como usar no código: Guia: Cores, no menu.',
    ),
    {
      name: 'configurations',
      label: 'Configurações',
      description:
        'Acrescenta ou remove configurações. A primeira é a base. O nome dá origem às variáveis CSS ' +
        'e ao valor de data-config (ex.: "Tema Natal" → --color--tema-natal--h1 e data-config="tema-natal"). ' +
        'Não pode haver duas com o mesmo nome. Mudar o nome obriga as apps a mudar também.',
      type: 'object',
      list: true,
      ui: {
        itemProps: (item) =>
          item?.name ? { label: `${item.name}  (--color--${slug(item.name)}--…)` } : { label: 'Nova configuração' },
        defaultItem: novaConfiguracao,
        validate: baseCompleta,
      },
      fields: [
        nomeUnico('configurations', 'Já existe uma configuração com este nome'),
        ...PARES.map(([k, label]) => claroEscuro(k, label)),
        {
          name: 'custom',
          label: 'Cores personalizadas',
          description:
            'Acrescenta ou remove cores desta configuração. O nome dá origem à variável CSS ' +
            '(ex.: "Azul Marca" → --color--nome-da-configuração--custom-azul-marca). ' +
            'Ao contrário das outras cores, não se herdam: só existem na configuração onde são criadas.',
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
