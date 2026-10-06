import { createElement as h } from 'react'
import { wrapFieldsWithMeta } from 'tinacms'

// Campo de cor em rgba. O seletor de cor do Tina grava sempre opacidade 1,
// por isso este componente junta: seletor de cor + opacidade + caixa de texto.

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

export const CorRgba = wrapFieldsWithMeta(({ input }: any) => {
  const atual = parseRgba(input.value) ?? { r: 0, g: 0, b: 0, a: 1 }
  const mudar = (parte: Partial<Rgba>) => input.onChange(toRgba({ ...atual, ...parte }))
  const quadrado = { width: 36, height: 36, borderRadius: 6, flexShrink: 0 }

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
})
