import { createElement as h, useState } from 'react'
import { wrapFieldsWithMeta } from 'tinacms'

// Campo de cor em rgba. O seletor de cor do Tina grava sempre opacidade 1,
// por isso este componente junta: seletor de cor + opacidade + caixa de texto.
// CorHerdavel é a variante dos pares claro/escuro, que podem ficar vazios para herdar da base.

type Rgba = { r: number; g: number; b: number; a: number }

const RGBA = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+|1\.0+)\s*\)$/

export function parseRgba(valor?: string | null): Rgba | null {
  const m = valor?.trim().match(RGBA)
  if (!m) return null
  const [r, g, b] = [m[1], m[2], m[3]].map(Number)
  if ([r, g, b].some((n) => n > 255)) return null
  return { r, g, b, a: Number(m[4]) }
}

const toRgba = ({ r, g, b, a }: Rgba) => `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`
const toHex = ({ r, g, b }: Rgba) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
const fromHex = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
})

// Fundo aos quadrados, para se ver a transparência na pré-visualização.
const xadrez = 'repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 50% / 12px 12px'

const quadrado = { width: 36, height: 36, borderRadius: 6, flexShrink: 0 }

const editor = (input: any, foco?: (ativo: boolean) => void) => {
  const atual = parseRgba(input.value) ?? { r: 0, g: 0, b: 0, a: 1 }
  const mudar = (parte: Partial<Rgba>) => input.onChange(toRgba({ ...atual, ...parte }))

  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 10 } },
    h('span', {
      title: 'Pré-visualização',
      style: {
        ...quadrado,
        border: '1px solid #d1d5db',
        background: `linear-gradient(${toRgba(atual)}, ${toRgba(atual)}), ${xadrez}`,
      },
    }),
    h('input', {
      type: 'color',
      title: 'Escolher cor',
      value: toHex(atual),
      onChange: (e: any) => mudar(fromHex(e.target.value)),
      style: { ...quadrado, padding: 0, border: 'none', background: 'none', cursor: 'pointer' },
    }),
    h(
      'label',
      { style: { display: 'flex', flexDirection: 'column', fontSize: 11, color: '#6b7280', flexShrink: 0 } },
      `Opacidade ${Math.round(atual.a * 100)}%`,
      h('input', {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: atual.a,
        onChange: (e: any) => mudar({ a: Number(e.target.value) }),
        style: { width: 110 },
      }),
    ),
    h('input', {
      type: 'text',
      value: input.value ?? '',
      placeholder: 'rgba(0, 0, 0, 1)',
      onChange: (e: any) => input.onChange(e.target.value),
      onFocus: () => foco?.(true),
      onBlur: () => foco?.(false),
      style: {
        flex: 1,
        minWidth: 0,
        padding: '8px 10px',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 13,
      },
    }),
  )
}

export const CorRgba = wrapFieldsWithMeta(({ input }: any) => editor(input))

const botao = {
  alignSelf: 'flex-start',
  padding: '4px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#fff',
  fontSize: 12,
  color: '#374151',
  cursor: 'pointer',
}

// Pares claro/escuro de uma lista (ex.: "configurations.1.h1.light"). O primeiro item é a base e tem a cor sempre definida.
// Nos outros, a cor vazia mostra a da base; os botões definem ou apagam as duas metades do par ao mesmo tempo.
// Enquanto a caixa de texto tem o foco, o editor fica visível mesmo vazio, para se poder reescrever o valor.
export const CorHerdavel = wrapFieldsWithMeta(({ input, form }: any) => {
  const [aEscrever, setAEscrever] = useState(false)
  const caminho = String(input.name).split('.')
  const i = caminho.length - 3
  const par = caminho.slice(0, -1).join('.')
  const naBase = (...resto: string[]) =>
    [...caminho.slice(0, i), '0', ...resto].reduce((o: any, k) => o?.[k], form?.getState().values)
  const base = { light: naBase(caminho[i + 1], 'light'), dark: naBase(caminho[i + 1], 'dark') }
  const nomeBase = naBase('name') || 'configuração base'

  if (caminho[i] === '0') return editor(input)
  if (input.value || aEscrever)
    return h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
      editor(input, setAEscrever),
      h(
        'button',
        {
          type: 'button',
          style: botao,
          title: 'Apaga a versão clara e a escura desta cor',
          onClick: () => (form.change(`${par}.light`, ''), form.change(`${par}.dark`, '')),
        },
        `↺ Herdar de "${nomeBase}"`,
      ),
    )

  const herdada = parseRgba(base[caminho.at(-1) as 'light' | 'dark'])
  const cor = herdada ? toRgba(herdada) : 'transparent'
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
    h('span', {
      title: 'Cor herdada',
      style: { ...quadrado, border: '2px dashed #9ca3af', background: `linear-gradient(${cor}, ${cor}), ${xadrez}` },
    }),
    h(
      'span',
      { style: { minWidth: 160, fontSize: 13, color: '#6b7280' } },
      `Herdada de "${nomeBase}"`,
      h('br'),
      h('code', { style: { fontSize: 12 } }, herdada ? toRgba(herdada) : '—'),
    ),
    h(
      'button',
      {
        type: 'button',
        style: botao,
        title: 'Começa com as cores da base, na versão clara e na escura',
        onClick: () => (
          form.change(`${par}.light`, base.light || 'rgba(0, 0, 0, 1)'),
          form.change(`${par}.dark`, base.dark || 'rgba(0, 0, 0, 1)')
        ),
      },
      '✎ Definir cor própria',
    ),
  )
})
