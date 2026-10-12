import { createElement as h } from 'react'
import { wrapFieldsWithMeta } from 'tinacms'

// Lista de blocos { type, content } de um conteúdo, um por linha: tipo à esquerda e texto à direita.
// O Tina abre cada item de uma lista num formulário à parte; este componente mostra-os todos de uma vez.
// Mínimo 1 bloco e no máximo um por tipo: o botão de apagar desativa-se com 1 e o de acrescentar quando não há tipos livres.
// À direita, um cartão de pré-visualização, numa moldura de janela, mostra os blocos à medida que se escrevem.

type Opcao = { value: string; label: string }
type Bloco = { type?: string; content?: string }

const caixa = {
  padding: '8px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 14,
  background: '#fff',
}

const botao = (ativo: boolean) => ({
  padding: '6px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#fff',
  fontSize: 13,
  color: '#374151',
  cursor: ativo ? 'pointer' : 'not-allowed',
  opacity: ativo ? 1 : 0.4,
})

// Aspeto de cada tipo no cartão, pela ordem em que aparecem (antetítulo, título, texto), seja qual for a ordem dos blocos.
// Um tipo novo que não esteja aqui aparece no fim, como texto.
const ESTILOS: Record<string, object> = {
  eyebrow: { fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ec4815' },
  title: { fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: '#111827' },
  text: { fontSize: 15, lineHeight: 1.5, color: '#374151' },
}

const cartao = (lista: Bloco[], tipos: Opcao[]) => {
  const ordem = [...Object.keys(ESTILOS), ...tipos.map((t) => t.value).filter((t) => !ESTILOS[t])]
  const linhas = ordem.flatMap((tipo) => {
    const bloco = lista.find((b) => b?.type === tipo)
    if (!bloco) return []
    // Bloco ainda vazio: mostra o nome do tipo a cinzento, para se ver onde vai ficar.
    const nome = (tipos.find((t) => t.value === tipo)?.label ?? tipo).replace(/\s*\(.*\)$/, '')
    const vazio = !bloco.content?.trim()
    return h(
      'div',
      {
        key: tipo,
        style: {
          ...(ESTILOS[tipo] ?? ESTILOS.text),
          margin: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          ...(vazio && { color: '#d1d5db', fontStyle: 'italic' }),
        },
      },
      vazio ? nome : bloco.content,
    )
  })

  // Moldura de janela (barra escura + fundo ponteado) para o cartão não parecer parte do formulário.
  const ponto = (cor: string) => h('span', { key: cor, style: { width: 10, height: 10, borderRadius: '50%', background: cor } })

  return h(
    'div',
    {
      style: {
        border: '1px solid #d1d5db',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.08)',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          background: '#1f2937',
          color: '#e5e7eb',
          fontSize: 12,
        },
      },
      h('span', { style: { display: 'flex', gap: 6 } }, ponto('#f87171'), ponto('#fbbf24'), ponto('#34d399')),
      h('span', { style: { flex: 1, textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em' } }, 'Pré-visualização'),
      h(
        'span',
        { style: { display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af' } },
        h('span', { style: { width: 6, height: 6, borderRadius: '50%', background: '#34d399' } }),
        'ao vivo',
      ),
    ),
    h(
      'div',
      {
        style: {
          padding: '36px 24px',
          background: 'radial-gradient(#d1d5db 1px, transparent 1px) 0 0 / 16px 16px, #f9fafb',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 520,
            margin: '0 auto',
            padding: 28,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 12px 32px rgba(17, 24, 39, 0.14)',
          },
        },
        ...(linhas.length ? linhas : [h('div', { key: 'vazio', style: { color: '#9ca3af', fontSize: 14 } }, 'Sem blocos')]),
      ),
    ),
    h(
      'div',
      { style: { padding: '8px 14px', background: '#fff', borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: 12 } },
      'Só para orientação: nas páginas, o aspeto final depende de quem usa este conteúdo.',
    ),
  )
}

export const blocos = (tipos: Opcao[]) =>
  wrapFieldsWithMeta(({ input }: any) => {
    const lista: Bloco[] = Array.isArray(input.value) ? input.value : []
    const usados = lista.map((b) => b?.type)
    const livres = tipos.filter((t) => !usados.includes(t.value))
    const mudar = (i: number, parte: Bloco) => input.onChange(lista.map((b, j) => (j === i ? { ...b, ...parte } : b)))
    const apagar = (i: number) => input.onChange(lista.filter((_, j) => j !== i))
    const acrescentar = () => input.onChange([...lista, { type: livres[0].value, content: '' }])

    const linha = (b: Bloco, i: number) =>
      h(
        'div',
        {
          key: i,
          style: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 },
        },
        h(
          'select',
          {
            title: 'Tipo',
            value: b?.type ?? '',
            onChange: (e: any) => mudar(i, { type: e.target.value }),
            style: { ...caixa, width: 200, flexShrink: 0 },
          },
          !b?.type && h('option', { value: '' }, 'Escolhe o tipo'),
          // Um tipo já usado noutro bloco aparece desativado.
          ...tipos.map((t) =>
            h('option', { key: t.value, value: t.value, disabled: t.value !== b?.type && usados.includes(t.value) }, t.label),
          ),
        ),
        h('textarea', {
          title: 'Conteúdo',
          placeholder: 'Conteúdo',
          rows: 3,
          value: b?.content ?? '',
          onChange: (e: any) => mudar(i, { content: e.target.value }),
          style: { ...caixa, flex: 1, minWidth: 0, resize: 'vertical', fontFamily: 'inherit' },
        }),
        h(
          'button',
          {
            type: 'button',
            title: lista.length > 1 ? 'Apagar bloco' : 'Tem de haver pelo menos um bloco',
            disabled: lista.length <= 1,
            onClick: () => apagar(i),
            style: botao(lista.length > 1),
          },
          '✕',
        ),
      )

    // Janela dividida: blocos à esquerda e pré-visualização à direita (passa para baixo se não houver largura).
    return h(
      'div',
      { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 } },
      h(
        'div',
        { style: { flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 } },
        ...lista.map(linha),
        h(
          'button',
          {
            type: 'button',
            disabled: !livres.length,
            onClick: acrescentar,
            title: livres.length ? '' : 'Já existem blocos de todos os tipos',
            style: { ...botao(livres.length > 0), alignSelf: 'flex-start' },
          },
          '+ Acrescentar bloco',
        ),
      ),
      // Fica visível ao fazer scroll do formulário.
      h('div', { style: { flex: '1 1 340px', minWidth: 0, position: 'sticky', top: 16 } }, cartao(lista, tipos)),
    )
  })
