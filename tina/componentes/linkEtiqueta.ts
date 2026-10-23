import { createElement as h, useEffect, useState } from 'react'
import { wrapFieldsWithMeta } from 'tinacms'
import { PAGES, slug } from '../campos'

// Link fixo de uma etiqueta, calculado como no scripts/gerar.mjs: tag/<slug(nome)>.<extensão do ficheiro>.
// Só mostra: não grava nada no JSON.

/** Extensão em minúsculas de um caminho ou URL ("/uploads/Logo.SVG" → "svg"), ou "" se não tiver. */
export const extensao = (caminho?: string) => {
  const nome = (caminho ?? '').split(/[?#]/)[0].split('/').pop() ?? ''
  const i = nome.lastIndexOf('.')
  return i > 0 ? nome.slice(i + 1).toLowerCase() : ''
}

/** Nome do ficheiro de um caminho ou URL ("/uploads/favicons/a.png" → "a.png"). */
export const nomeDoFicheiro = (caminho?: string) => (caminho ?? '').split(/[?#]/)[0].split('/').pop() ?? ''

const caixa = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#f9fafb',
  fontSize: 13,
}

// Campo "link" de um item de items[] (ex.: "items.2.link"): lê o name e o file do mesmo item.
// Subscreve o formulário, para atualizar enquanto se escreve o nome ou se escolhe outro ficheiro.
export const LinkEtiqueta = wrapFieldsWithMeta(({ input, form }: any) => {
  const item = String(input.name).split('.').slice(0, -1)
  const ler = () => item.reduce((o: any, k) => o?.[k], form?.getState().values) ?? {}
  const [valores, setValores] = useState(ler)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => form?.subscribe(() => setValores(ler()), { values: true }), [form, input.name])

  const s = slug(valores.name ?? '')
  const ext = extensao(valores.file)
  if (!s || !ext)
    return h('div', { style: { ...caixa, color: '#6b7280' } }, 'Escreve o nome e escolhe o ficheiro para ver o link.')

  const url = `${PAGES}/tag/${s}.${ext}`
  return h(
    'div',
    { style: caixa },
    h('code', { style: { flex: 1, overflowWrap: 'anywhere', color: '#111827' } }, url),
    h(
      'button',
      {
        type: 'button',
        onClick: () => navigator.clipboard?.writeText(url).then(() => (setCopiado(true), setTimeout(() => setCopiado(false), 1500))),
        style: { padding: '3px 9px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' },
      },
      copiado ? 'Copiado' : 'Copiar',
    ),
  )
})
