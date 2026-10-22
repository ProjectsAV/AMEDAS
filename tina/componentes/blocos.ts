import { createElement as h } from 'react'
import { wrapFieldsWithMeta } from 'tinacms'

// Idiomas de um elemento (campo contentBlock): uma secção por { language, contents[] }, com o idioma em cima,
// os blocos à esquerda e a pré-visualização à direita. O Tina abre cada item de uma lista num formulário à parte;
// este componente mostra tudo de uma vez, para se ver com scroll.
// Um bloco é { type, content } ou um grupo { type: 'group', contents[] } com blocos de texto (um nível só).
// Mínimo 1 secção, 1 bloco por secção e 1 bloco por grupo; cada idioma numa só secção; em cada secção e em cada
// grupo, os tipos que não são repetíveis só aparecem uma vez.

type Opcao = { value: string; label: string }
type Bloco = { type?: string; content?: string; contents?: Bloco[] }

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

// Aspeto de cada tipo no cartão.
const ESTILOS: Record<string, object> = {
  eyebrow: { fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ec4815' },
  title: { fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: '#111827' },
  subtitle: { fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: '#1f2937' },
  text: { fontSize: 15, lineHeight: 1.5, color: '#374151' },
  item: { fontSize: 15, lineHeight: 1.5, color: '#374151' },
  quote: { fontSize: 16, fontStyle: 'italic', lineHeight: 1.5, color: '#4b5563', borderLeft: '3px solid #ec4815', paddingLeft: 12 },
}

// Ordem no cartão, seja qual for a ordem dos blocos ("group" = os grupos). Os repetíveis (itens) aparecem numa lista
// com marcadores e os grupos em caixas, pela ordem deles. Um tipo novo que não esteja aqui aparece no fim, como texto.
const ORDEM = ['eyebrow', 'title', 'subtitle', 'text', 'item', 'group', 'quote']

// Índice do bloco do mesmo tipo antes (-1) ou depois (+1) do bloco k, ou undefined se não houver:
// a ordem só conta entre itens e entre grupos.
const vizinho = (lista: Bloco[], k: number, sentido: number) => {
  const mesmos = lista.flatMap((x, j) => (x?.type === lista[k]?.type ? [j] : []))
  return mesmos[mesmos.indexOf(k) + sentido]
}
const trocar = (lista: Bloco[], k: number, j: number) => lista.map((x, n) => (n === k ? lista[j] : n === j ? lista[k] : x))

const etiqueta = (texto: string) =>
  h('span', { style: { fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' } }, texto)

// Botões ↑ e ↓ do bloco k.
const setas = (lista: Bloco[], k: number, mudar: (novos: Bloco[]) => void) => {
  const seta = (texto: string, sentido: number, titulo: string) => {
    const j = vizinho(lista, k, sentido)
    return h(
      'button',
      {
        key: texto,
        type: 'button',
        title: titulo,
        disabled: j === undefined,
        onClick: () => j !== undefined && mudar(trocar(lista, k, j)),
        style: { ...botao(j !== undefined), padding: '2px 8px' },
      },
      texto,
    )
  }
  return [seta('↑', -1, 'Subir'), seta('↓', 1, 'Descer')]
}

export const blocos = (tipos: Opcao[], idiomas: Opcao[], repetiveis: string[], tipoGrupo: string) => {
  // Tipo de um bloco novo: o primeiro tipo não repetível ainda livre na lista; se não houver, o primeiro repetível.
  const tipoLivre = (lista: Bloco[]) =>
    tipos.find((t) => !repetiveis.includes(t.value) && !lista.some((b) => b?.type === t.value))?.value ?? repetiveis[0]

  // Linhas do cartão para uma lista de blocos (de um idioma ou de um grupo).
  const linhas = (lista: Bloco[]): any[] => {
    const ordem = [...ORDEM, ...tipos.map((t) => t.value).filter((t) => !ORDEM.includes(t))]
    return ordem.flatMap((tipo) => {
      const destes = lista.filter((b) => b?.type === (tipo === 'group' ? tipoGrupo : tipo))
      if (!destes.length) return []
      if (tipo === 'group')
        return destes.map((g, k) =>
          h(
            'div',
            {
              key: `grupo${k}`,
              style: { display: 'flex', flexDirection: 'column', gap: 8, padding: 14, border: '1px solid #e5e7eb', borderRadius: 10 },
            },
            ...linhas(g.contents ?? []),
          ),
        )
      // Bloco ainda vazio: mostra o nome do tipo a cinzento, para se ver onde vai ficar.
      const nome = (tipos.find((t) => t.value === tipo)?.label ?? tipo).replace(/\s*\(.*\)$/, '')
      const estilo = (b: Bloco) => ({
        ...(ESTILOS[tipo] ?? ESTILOS.text),
        margin: 0,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        ...(!b.content?.trim() && { color: '#d1d5db', fontStyle: 'italic' }),
      })
      const texto = (b: Bloco) => (b.content?.trim() ? b.content : nome)
      if (repetiveis.includes(tipo))
        return h(
          'ul',
          { key: tipo, style: { margin: 0, paddingLeft: 20, listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 4 } },
          ...destes.map((b, k) => h('li', { key: k, style: estilo(b) }, texto(b))),
        )
      return destes.map((b, k) => h('div', { key: `${tipo}${k}`, style: estilo(b) }, texto(b)))
    })
  }

  // Cartão com os blocos de uma secção (um idioma).
  const cartao = (lista: Bloco[]) => {
    const conteudo = linhas(lista)
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
          ...(conteudo.length ? conteudo : [h('div', { key: 'vazio', style: { color: '#9ca3af', fontSize: 14 } }, 'Sem blocos')]),
        ),
      ),
      h(
        'div',
        { style: { padding: '8px 14px', background: '#fff', borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: 12 } },
        'Só para orientação: nas páginas, o aspeto final depende de quem usa este conteúdo.',
      ),
    )
  }

  // Linha de um bloco de texto da lista (de um idioma ou de um grupo). A lista não pode ficar vazia:
  // "minimo" é a explicação no botão ✕ desativado.
  const linha = (lista: Bloco[], mudarLista: (novos: Bloco[]) => void, minimo: string) => (k: number) => {
    const b = lista[k]
    const mudar = (parte: Bloco) => mudarLista(lista.map((x, j) => (j === k ? { ...x, ...parte } : x)))
    const repetivel = repetiveis.includes(b?.type ?? '')
    const podeApagar = lista.length > 1

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
          // Um tipo não repetível já usado noutro bloco da mesma lista aparece desativado.
          ...tipos.map((t) =>
            h(
              'option',
              {
                key: t.value,
                value: t.value,
                disabled: !repetiveis.includes(t.value) && lista.some((x, j) => j !== k && x?.type === t.value),
              },
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
          rows: repetivel ? 1 : 3,
          value: b?.content ?? '',
          onChange: (e: any) => mudar({ content: e.target.value }),
          style: { ...caixa, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
        }),
      ),
      // Alinha os botões com as caixas, por baixo das etiquetas.
      repetivel && h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 20 } }, ...setas(lista, k, mudarLista)),
      h(
        'button',
        {
          type: 'button',
          title: podeApagar ? 'Apagar bloco' : minimo,
          disabled: !podeApagar,
          onClick: () => mudarLista(lista.filter((_, j) => j !== k)),
          style: { ...botao(podeApagar), marginTop: 20 },
        },
        '✕',
      ),
    )
  }

  // Caixa do grupo k da lista de um idioma: cabeçalho (número, setas, apagar), os seus blocos e o botão para acrescentar outro.
  const grupo = (lista: Bloco[], mudarLista: (novos: Bloco[]) => void) => (k: number) => {
    const filhos = Array.isArray(lista[k].contents) ? (lista[k].contents as Bloco[]) : []
    const mudarFilhos = (novos: Bloco[]) => mudarLista(lista.map((x, j) => (j === k ? { ...x, contents: novos } : x)))
    const numero = lista.slice(0, k + 1).filter((x) => x?.type === tipoGrupo).length
    const podeApagar = lista.length > 1

    return h(
      'div',
      {
        key: k,
        style: { display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 6 } },
        h('span', { style: { flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' } }, `Grupo ${numero}`),
        ...setas(lista, k, mudarLista),
        h(
          'button',
          {
            type: 'button',
            title: podeApagar ? 'Apagar este grupo e os seus blocos' : 'Cada idioma tem de ter pelo menos um bloco',
            disabled: !podeApagar,
            onClick: () => mudarLista(lista.filter((_, j) => j !== k)),
            style: botao(podeApagar),
          },
          '✕ Apagar grupo',
        ),
      ),
      ...filhos.map((_, j) => linha(filhos, mudarFilhos, 'Cada grupo tem de ter pelo menos um bloco')(j)),
      h(
        'button',
        {
          type: 'button',
          onClick: () => mudarFilhos([...filhos, { type: tipoLivre(filhos), content: '' }]),
          style: { ...botao(true), alignSelf: 'flex-start' },
        },
        '+ Acrescentar bloco ao grupo',
      ),
    )
  }

  return wrapFieldsWithMeta(({ input }: any) => {
    const seccoes: { language?: string; contents?: Bloco[] }[] = Array.isArray(input.value) ? input.value : []
    const mudarSeccao = (i: number, parte: object) => input.onChange(seccoes.map((s, j) => (j === i ? { ...s, ...parte } : s)))
    const usados = seccoes.map((s) => s?.language)
    const idiomaLivre = idiomas.find((l) => !usados.includes(l.value))

    const seccao = (s: (typeof seccoes)[number], i: number) => {
      const lista = Array.isArray(s?.contents) ? s.contents : []
      const mudarBlocos = (novos: Bloco[]) => mudarSeccao(i, { contents: novos })
      return h(
        'div',
        {
          key: i,
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
        // Cabeçalho: número da secção e botão de apagar (apaga o idioma e os seus blocos).
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
              onClick: () => input.onChange(seccoes.filter((_, j) => j !== i)),
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
            {
              value: s?.language ?? '',
              onChange: (e: any) => mudarSeccao(i, { language: e.target.value }),
              style: { ...caixa, width: '100%' },
            },
            !s?.language && h('option', { value: '' }, 'Escolhe o idioma'),
            // Um idioma que já tem secção aparece desativado.
            ...idiomas.map((l) =>
              h('option', { key: l.value, value: l.value, disabled: l.value !== s?.language && usados.includes(l.value) }, l.label),
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
            ...lista.map((b, k) =>
              b?.type === tipoGrupo ? grupo(lista, mudarBlocos)(k) : linha(lista, mudarBlocos, 'Cada idioma tem de ter pelo menos um bloco')(k),
            ),
            h(
              'div',
              { style: { display: 'flex', flexWrap: 'wrap', gap: 8 } },
              h(
                'button',
                { type: 'button', onClick: () => mudarBlocos([...lista, { type: tipoLivre(lista), content: '' }]), style: botao(true) },
                '+ Acrescentar bloco',
              ),
              // Grupo novo no fim, com um bloco do primeiro tipo.
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => mudarBlocos([...lista, { type: tipoGrupo, contents: [{ type: tipos[0].value, content: '' }] }]),
                  title: 'Um grupo junta blocos relacionados (ex.: uma pergunta e a sua resposta)',
                  style: { ...botao(true), borderStyle: 'dashed' },
                },
                '+ Acrescentar grupo',
              ),
            ),
          ),
          h('div', { style: { flex: '1 1 300px', minWidth: 0 } }, cartao(lista)),
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
          onClick: () =>
            idiomaLivre && input.onChange([...seccoes, { language: idiomaLivre.value, contents: [{ type: tipos[0].value, content: '' }] }]),
          title: idiomaLivre ? '' : 'Já existem secções para todos os idiomas',
          style: { ...botao(!!idiomaLivre), width: '100%', padding: '10px 12px', borderStyle: 'dashed' },
        },
        '+ Acrescentar idioma',
      ),
    )
  })
}
