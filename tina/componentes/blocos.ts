import { createElement as h } from 'react'
import { wrapFieldsWithMeta } from 'tinacms'

// Lista de blocos { language, type, content } de um elemento (campo contents). O JSON é plano, mas o painel
// agrupa os blocos por idioma: uma secção por idioma, com o idioma em cima, os blocos (tipo e conteúdo) à
// esquerda e a pré-visualização à direita. O Tina abre cada item de uma lista num formulário à parte; este
// componente mostra tudo de uma vez, para se ver com scroll.
// Mínimo 1 secção e 1 bloco por secção; em cada secção, cada tipo só uma vez (no máximo um bloco por tipo).

type Opcao = { value: string; label: string }
type Bloco = { language?: string; type?: string; content?: string }

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

// Cartão com os blocos de uma secção (um idioma).
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
          padding: '24px 20px',
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

const etiqueta = (texto: string) =>
  h('span', { style: { fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' } }, texto)

type Seccao = { language: string; blocos: Bloco[] }

export const blocos = (tipos: Opcao[], idiomas: Opcao[]) =>
  wrapFieldsWithMeta(({ input }: any) => {
    const lista: Bloco[] = Array.isArray(input.value) ? input.value : []
    // Secções pela ordem em que cada idioma aparece pela primeira vez. Um bloco sem idioma fica na secção "".
    const seccoes: Seccao[] = []
    for (const b of lista) {
      const language = b?.language ?? ''
      const s = seccoes.find((x) => x.language === language)
      if (s) s.blocos.push(b)
      else seccoes.push({ language, blocos: [b] })
    }
    // Volta a gravar a lista plana, com os blocos de cada secção seguidos.
    const gravar = (novas: Seccao[]) =>
      input.onChange(
        novas.flatMap((s) => s.blocos.map((b) => ({ language: s.language, type: b?.type, content: b?.content ?? '' }))),
      )
    const mudarSeccao = (i: number, parte: Partial<Seccao>) => gravar(seccoes.map((s, j) => (j === i ? { ...s, ...parte } : s)))
    const usados = seccoes.map((s) => s.language)
    const idiomaLivre = idiomas.find((l) => !usados.includes(l.value))
    const tipoLivre = (s: Seccao) => tipos.find((t) => !s.blocos.some((b) => b?.type === t.value))

    const linha = (s: Seccao, i: number) => (b: Bloco, k: number) => {
      const mudar = (parte: Bloco) => mudarSeccao(i, { blocos: s.blocos.map((x, j) => (j === k ? { ...x, ...parte } : x)) })
      return h(
        'div',
        { key: k, style: { display: 'flex', alignItems: 'flex-start', gap: 10 } },
        h(
          'label',
          { style: { width: 180, flexShrink: 0 } },
          etiqueta('Tipo'),
          h(
            'select',
            { value: b?.type ?? '', onChange: (e: any) => mudar({ type: e.target.value }), style: { ...caixa, width: '100%' } },
            !b?.type && h('option', { value: '' }, 'Escolhe o tipo'),
            // Um tipo já usado noutro bloco desta secção aparece desativado.
            ...tipos.map((t) =>
              h(
                'option',
                { key: t.value, value: t.value, disabled: s.blocos.some((x, j) => j !== k && x?.type === t.value) },
                t.label,
              ),
            ),
          ),
        ),
        h(
          'label',
          { style: { flex: 1, minWidth: 0 } },
          etiqueta('Conteúdo'),
          h('textarea', {
            placeholder: 'Conteúdo',
            rows: 3,
            value: b?.content ?? '',
            onChange: (e: any) => mudar({ content: e.target.value }),
            style: { ...caixa, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
          }),
        ),
        h(
          'button',
          {
            type: 'button',
            title: s.blocos.length > 1 ? 'Apagar bloco' : 'Cada idioma tem de ter pelo menos um bloco',
            disabled: s.blocos.length <= 1,
            onClick: () => mudarSeccao(i, { blocos: s.blocos.filter((_, j) => j !== k) }),
            // Alinha com as caixas, por baixo das etiquetas.
            style: { ...botao(s.blocos.length > 1), marginTop: 20 },
          },
          '✕',
        ),
      )
    }

    const seccao = (s: Seccao, i: number) => {
      const livre = tipoLivre(s)
      return h(
        'div',
        {
          key: s.language || `sem-idioma-${i}`,
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 14,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(17, 24, 39, 0.06)',
          },
        },
        // Cabeçalho: número da secção e botão de apagar (apaga todos os blocos deste idioma).
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          h('span', { style: { fontSize: 13, fontWeight: 600, color: '#374151' } }, `Idioma ${i + 1}`),
          h(
            'button',
            {
              type: 'button',
              title: seccoes.length > 1 ? 'Apagar este idioma e os seus blocos' : 'Tem de haver pelo menos um idioma',
              disabled: seccoes.length <= 1,
              onClick: () => gravar(seccoes.filter((_, j) => j !== i)),
              style: botao(seccoes.length > 1),
            },
            '✕ Apagar idioma',
          ),
        ),
        h(
          'label',
          { style: { display: 'block' } },
          etiqueta('Idioma'),
          h(
            'select',
            { value: s.language, onChange: (e: any) => mudarSeccao(i, { language: e.target.value }), style: { ...caixa, width: '100%' } },
            !s.language && h('option', { value: '' }, 'Escolhe o idioma'),
            // Um idioma que já tem secção aparece desativado.
            ...idiomas.map((l) =>
              h('option', { key: l.value, value: l.value, disabled: l.value !== s.language && usados.includes(l.value) }, l.label),
            ),
          ),
        ),
        // Blocos à esquerda, pré-visualização à direita (passa para baixo se não houver largura).
        h(
          'div',
          { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 12 } },
          h(
            'div',
            {
              style: {
                flex: '1 1 420px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                background: '#f9fafb',
              },
            },
            ...s.blocos.map(linha(s, i)),
            h(
              'button',
              {
                type: 'button',
                disabled: !livre,
                onClick: () => livre && mudarSeccao(i, { blocos: [...s.blocos, { type: livre.value, content: '' }] }),
                title: livre ? '' : 'Este idioma já tem blocos de todos os tipos',
                style: { ...botao(!!livre), alignSelf: 'flex-start' },
              },
              '+ Acrescentar bloco',
            ),
          ),
          h('div', { style: { flex: '1 1 300px', minWidth: 0 } }, cartao(s.blocos, tipos)),
        ),
      )
    }

    return h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      ...seccoes.map(seccao),
      h(
        'button',
        {
          type: 'button',
          disabled: !idiomaLivre,
          // Secção nova: o primeiro idioma sem secção, com um bloco do primeiro tipo.
          onClick: () => idiomaLivre && gravar([...seccoes, { language: idiomaLivre.value, blocos: [{ type: tipos[0].value, content: '' }] }]),
          title: idiomaLivre ? '' : 'Já existem secções para todos os idiomas',
          style: { ...botao(!!idiomaLivre), width: '100%', padding: '10px 12px', borderStyle: 'dashed' },
        },
        '+ Acrescentar idioma',
      ),
    )
  })
