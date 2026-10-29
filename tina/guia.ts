import { createElement as h, Fragment, useEffect, useState, type ReactNode } from 'react'
import { PAGES } from './campos'
import { GRUPO, IDIOMAS, TIPOS } from './colecoes/element'
import { PARES } from './templates/colors'

// Guia para quem usa o que o AMEDAS publica: páginas próprias no menu do painel (secção "Site"),
// acrescentadas no cmsCallback do tina/config.ts. Só leem: não gravam nada.
// As listas "ao vivo" leem os ficheiros publicados (CSS e JSON), por isso mostram o que as apps recebem.

// ---------- Peças de texto ----------

// Texto com `código` entre acentos graves.
const t = (texto: string) =>
  texto.split('`').map((parte, i) =>
    i % 2
      ? h('code', { key: i, style: { background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em' } }, parte)
      : parte,
  )

const p = (texto: string) => h('p', { style: { margin: '0 0 12px', lineHeight: 1.6 } }, ...t(texto))

const lista = (itens: (string | ReactNode)[]) =>
  h(
    'ul',
    { style: { margin: '0 0 12px', paddingLeft: 22, listStyle: 'disc', lineHeight: 1.6 } },
    ...itens.map((item, i) => h('li', { key: i, style: { marginBottom: 4 } }, ...(typeof item === 'string' ? t(item) : [item]))),
  )

const nota = (texto: string) =>
  h(
    'p',
    {
      style: {
        margin: '0 0 12px',
        padding: '10px 12px',
        borderLeft: '3px solid #ec4815',
        background: '#fff7ed',
        borderRadius: 4,
        lineHeight: 1.5,
      },
    },
    ...t(texto),
  )

const link = (href: string, texto = href) =>
  h('a', { href, target: '_blank', rel: 'noreferrer', style: { color: '#c2410c', textDecoration: 'underline', overflowWrap: 'anywhere' } }, texto)

const Codigo = ({ texto }: { texto: string }) => {
  const [copiado, setCopiado] = useState(false)
  return h(
    'div',
    { style: { position: 'relative', margin: '0 0 16px' } },
    h(
      'pre',
      {
        style: {
          margin: 0,
          padding: '14px 16px',
          background: '#1f2937',
          color: '#f3f4f6',
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.55,
          overflowX: 'auto',
        },
      },
      h('code', null, texto),
    ),
    h(
      'button',
      {
        type: 'button',
        onClick: () => navigator.clipboard?.writeText(texto).then(() => (setCopiado(true), setTimeout(() => setCopiado(false), 1500))),
        style: {
          position: 'absolute',
          top: 8,
          right: 8,
          padding: '3px 9px',
          border: '1px solid #4b5563',
          borderRadius: 6,
          background: '#374151',
          color: '#f3f4f6',
          fontSize: 12,
          cursor: 'pointer',
        },
      },
      copiado ? 'Copiado' : 'Copiar',
    ),
  )
}
const codigo = (texto: string) => h(Codigo, { texto: texto.trim() })

const celula = { padding: '7px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'left' as const, verticalAlign: 'middle' as const }
const tabela = (cabecalho: string[], linhas: ReactNode[][]) =>
  h(
    'div',
    { style: { overflowX: 'auto', margin: '0 0 16px' } },
    h(
      'table',
      { style: { borderCollapse: 'collapse', width: '100%', fontSize: 14 } },
      h('thead', null, h('tr', null, ...cabecalho.map((c, i) => h('th', { key: i, style: { ...celula, color: '#6b7280', fontWeight: 600 } }, c)))),
      h(
        'tbody',
        null,
        ...linhas.map((linha, i) =>
          h('tr', { key: i }, ...linha.map((c, j) => h('td', { key: j, style: celula }, ...(typeof c === 'string' ? t(c) : [c])))),
        ),
      ),
    ),
  )

const seccao = (titulo: string, ...filhos: ReactNode[]) =>
  h(
    'section',
    { style: { margin: '0 0 32px' } },
    h('h2', { style: { margin: '0 0 12px', fontSize: 20, fontWeight: 600, color: '#111827' } }, titulo),
    ...filhos,
  )

const pagina = (titulo: string, intro: string, ...seccoes: ReactNode[]) =>
  h(
    'div',
    { style: { padding: '24px 32px 64px', maxWidth: 900, color: '#374151', fontSize: 15 } },
    h('h1', { style: { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#111827' } }, titulo),
    h('p', { style: { margin: '0 0 28px', fontSize: 16, lineHeight: 1.6, color: '#4b5563' } }, ...t(intro)),
    ...seccoes,
  )

// ---------- Ficheiros publicados ----------

// Lê um ficheiro publicado: primeiro ao lado do painel (o que este site publicou), depois no Pages.
// Com o painel aberto no tinacms dev (porta 4001) os ficheiros de public/ não existem ali, e usa-se o Pages.
const lerPublicado = async (caminho: string) => {
  for (const base of [new URL('..', location.href).href, `${PAGES}/`]) {
    try {
      const r = await fetch(base + caminho, { cache: 'no-store' })
      if (r.ok && !r.headers.get('content-type')?.includes('text/html')) return { texto: await r.text(), url: base + caminho }
    } catch {}
  }
  return null
}

type Lido = { texto: string; url: string } | null | undefined
const usePublicado = (caminho: string): Lido => {
  const [lido, setLido] = useState<Lido>(undefined)
  useEffect(() => void lerPublicado(caminho).then(setLido), [caminho])
  return lido
}

// Estado da leitura: a carregar, falhou, ou de onde veio.
const origem = (lido: Lido, caminho: string) =>
  lido === undefined
    ? p('A carregar…')
    : lido === null
      ? nota(`Não foi possível ler \`${caminho}\`. Experimenta abrir o painel no endereço publicado.`)
      : h('p', { style: { margin: '0 0 12px', fontSize: 13, color: '#6b7280' } }, 'Lido de ', link(lido.url), '.')

// Variáveis do primeiro bloco :root { … } de um CSS gerado pelo scripts/gerar.mjs.
const variaveis = (css: string) =>
  [...css.slice(0, css.indexOf('}')).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()] as const)

// Valores de data-config, pela ordem do painel (a primeira é a base).
const configuracoes = (css: string) => [...new Set([...css.matchAll(/\[data-config="([^"]+)"\]/g)].map((m) => m[1]))]

const xadrez = 'repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
const amostra = (cor: string, herdada = false) =>
  h('span', {
    title: herdada ? 'Herdada da base' : undefined,
    style: {
      display: 'inline-block',
      width: 28,
      height: 28,
      borderRadius: 6,
      verticalAlign: 'middle',
      border: herdada ? '2px dashed #9ca3af' : '1px solid #d1d5db',
      background: `linear-gradient(${cor}, ${cor}), ${xadrez}`,
    },
  })

const etiqueta = (texto: string, cor = '#6b7280') =>
  h('span', { style: { marginLeft: 8, padding: '1px 8px', borderRadius: 999, background: '#f3f4f6', color: cor, fontSize: 12 } }, texto)

// ---------- Páginas ----------

const Comecar = () =>
  pagina(
    'Começar',
    'O AMEDAS guarda os tokens de design (cores, tamanhos de texto e medidas dos botões) e os textos editados neste painel, e publica-os como ficheiros CSS e JSON. As apps e as libs React incluem esses ficheiros e usam as variáveis CSS.',
    seccao(
      'Ficheiros publicados',
      tabela(
        ['O quê', 'Ficheiro'],
        [
          ['Cores e tamanhos de texto', link(`${PAGES}/tokens/tokens.css`)],
          ['Medidas dos botões', link(`${PAGES}/button/button.css`)],
          ['Textos (Elementos), um JSON por ficheiro do painel', link(`${PAGES}/element/index.json`)],
          ['Ficheiros com link fixo (Etiquetas)', link(`${PAGES}/tag/index.json`)],
        ],
      ),
      h('p', { style: { margin: '0 0 12px' } }, 'Todos os links estão na página inicial: ', link(`${PAGES}/`), '.'),
    ),
    seccao(
      'Incluir no projeto',
      p('Num site em HTML, ou no `index.html` de uma app React (Vite, Create React App):'),
      codigo(`
<link rel="stylesheet" href="${PAGES}/tokens/tokens.css">
<link rel="stylesheet" href="${PAGES}/button/button.css">`),
      p('Em Next.js (App Router), no `app/layout.tsx`:'),
      codigo(`
export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <head>
        <link rel="stylesheet" href="${PAGES}/tokens/tokens.css" />
        <link rel="stylesheet" href="${PAGES}/button/button.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}`),
      p('Inclui estes ficheiros antes do CSS das libs. Depois, usa as variáveis em qualquer CSS ou estilo inline, por exemplo `var(--color--primary)`.'),
    ),
    seccao(
      'Quando chegam as alterações',
      lista([
        'Ao gravar no painel, o GitHub publica os ficheiros novos em 2 a 3 minutos.',
        'O GitHub Pages deixa o browser guardar os ficheiros em cache até 10 minutos. Para ver logo a alteração, recarrega a página sem cache (Ctrl+Shift+R).',
      ]),
    ),
    seccao(
      'Tema claro e escuro',
      p('As cores seguem o tema do sistema operativo. Para forçar um tema, põe `data-theme` no `<html>` (só funciona aí):'),
      codigo(`
<html data-theme="dark">   <!-- sempre escuro -->
<html data-theme="light">  <!-- sempre claro -->`),
    ),
    seccao(
      'Outras páginas do guia',
      lista([
        'Guia: Cores: variáveis de cor, configurações (marcas) e `data-config`.',
        'Guia: Tamanhos de texto: variáveis `--font-size-*`.',
        'Guia: Botões: medidas dos botões e como as juntar às cores.',
        'Guia: Elementos: ler os textos em vários idiomas.',
        'Guia: Etiquetas: ficheiros do Media Manager com um link que não muda (ex.: o favicon).',
      ]),
    ),
  )

const Cores = () => {
  const lido = usePublicado('tokens/tokens.css')
  const css = lido?.texto ?? ''
  const vars = new Map(variaveis(css))
  const configs = configuracoes(css)
  const [base, outra = base ?? 'outra-marca'] = configs

  // Uma configuração por cartão: as cores de PARES (clara e escura) e as personalizadas.
  const cartaoConfig = (c: string, i: number) => {
    const pre = `--color--${c}--`
    const personalizadas = [...vars.keys()].filter((v) => v.startsWith(`${pre}custom-`))
    return h(
      'div',
      { key: c, style: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, margin: '0 0 16px', background: '#fff' } },
      h(
        'div',
        { style: { margin: '0 0 10px', fontWeight: 600, color: '#111827' } },
        h('code', null, `data-config="${c}"`),
        i === 0 ? etiqueta('base, usada por omissão', '#c2410c') : null,
      ),
      tabela(
        ['Cor', 'Claro', 'Escuro', 'Variável'],
        [
          ...PARES.map(([k, label]) => {
            const herdada = !!vars.get(`${pre}${k}-light`)?.startsWith('var(')
            return [
              h(Fragment, null, label, herdada ? etiqueta('herdada') : null),
              amostra(`var(${pre}${k}-light)`, herdada),
              amostra(`var(${pre}${k}-dark)`, herdada),
              `\`${pre}${k}\``,
            ]
          }),
          ...personalizadas.map((v) => [`Personalizada: ${v.slice(`${pre}custom-`.length)}`, amostra(`var(${v})`), '', `\`${v}\``]),
        ],
      ),
    )
  }

  // Exemplo com os nomes neutros: o mesmo HTML dentro de cada data-config.
  const exemplo = (c: string) =>
    h(
      'div',
      {
        key: c,
        'data-config': c,
        style: {
          flex: '1 1 220px',
          padding: 20,
          borderRadius: 8,
          border: '1px solid var(--color--separator)',
          background: 'var(--color--background)',
          color: 'var(--color--text)',
        },
      },
      h('code', { style: { fontSize: 12, opacity: 0.7 } }, `data-config="${c}"`),
      h('div', { style: { margin: '8px 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--color--h1)' } }, 'Título H1'),
      h('div', { style: { margin: '0 0 12px', lineHeight: 1.5 } }, 'Texto do parágrafo, com a cor de texto desta configuração.'),
      h('hr', { style: { border: 0, borderTop: '1px solid var(--color--separator)', margin: '0 0 12px' } }),
      h(
        'span',
        { style: { display: 'inline-block', padding: '8px 16px', borderRadius: 6, background: 'var(--color--primary)', color: 'var(--color--background)', fontWeight: 600 } },
        'Principal',
      ),
    )

  return pagina(
    'Cores',
    'As cores estão organizadas em configurações (uma por marca ou produto). Os componentes usam sempre os mesmos nomes, como `var(--color--primary)`, e a configuração escolhe-se no HTML com o atributo `data-config`.',
    // Aplica o CSS publicado a esta página, para as amostras e o exemplo. Sai quando se muda de página.
    css ? h('style', null, css) : null,
    seccao(
      'Usar uma cor',
      codigo(`
.cartao {
  background: var(--color--background);
  color: var(--color--text);
  border: 1px solid var(--color--separator);
}
.cartao h1 { color: var(--color--h1); }
.botao { background: var(--color--primary); }`),
      p('Em React, também funciona com estilos inline:'),
      codigo(`<h1 style={{ color: 'var(--color--h1)' }}>Olá</h1>`),
      tabela(
        ['Cor', 'Variável'],
        [...PARES.map(([k, label]) => [label, `\`--color--${k}\``]), ['Personalizada', '`--color--custom-<nome>` (só nas configurações que a têm)']],
      ),
    ),
    seccao(
      'Escolher a configuração',
      p('Sem `data-config`, usa-se a configuração base (a primeira da lista no painel). Para usar outra numa parte da página, põe `data-config` no elemento que a envolve. Tudo o que está lá dentro passa a usar essa configuração:'),
      codigo(`
<body>                                <!-- configuração base -->
  <header>…</header>

  <section data-config="${outra}">   <!-- daqui para dentro: ${outra} -->
    <button class="main-btn">Comprar</button>
  </section>
</body>`),
      p('Em React é o mesmo atributo. Podem ficar umas dentro das outras, e vale a mais próxima:'),
      codigo(`
<main>
  <Header />
  <section data-config="${outra}">
    <Card />
    <div data-config="${base ?? 'default'}">
      <Card />
    </div>
  </section>
</main>`),
      p('Se preferires um componente, o `display: contents` faz com que o `div` não mexa no layout:'),
      codigo(`
function Marca({ config, children }) {
  return <div data-config={config} style={{ display: 'contents' }}>{children}</div>
}

<Marca config="${outra}"><Button /></Marca>`),
      nota('O valor de `data-config` vem do nome da configuração no painel ("Arva Vare" → `arva-vare`). Se alguém mudar o nome no painel, as apps têm de mudar o atributo.'),
    ),
    seccao(
      'Configurações publicadas',
      origem(lido, 'tokens/tokens.css'),
      p('As amostras com contorno tracejado são cores herdadas: a configuração não as define e usa as da base.'),
      ...configs.map(cartaoConfig),
    ),
    configs.length
      ? seccao(
          'Exemplo ao vivo',
          p('O mesmo HTML dentro de cada `data-config`. Segue o tema do teu sistema (claro ou escuro).'),
          h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 16 } }, ...configs.map(exemplo)),
        )
      : null,
    seccao(
      'Cores herdadas',
      p('Nas configurações que não são a base, quem edita só define as cores que mudam. As outras herdam as da base. Para quem usa o CSS, isto não muda nada: todas as variáveis têm sempre valor. Se a base mudar uma cor herdada, a alteração aparece em todas as configurações que a herdam.'),
    ),
    seccao(
      'Uma cor de uma configuração específica',
      p('Quando um sítio precisa sempre da cor de uma marca, seja qual for o `data-config` à volta, usa a variável com o nome da configuração:'),
      codigo(`
.selo { color: var(--color--${outra}--primary); }

/* Sempre a versão clara ou sempre a escura, ignorando o tema: */
.logo { color: var(--color--${outra}--primary-light); }`),
    ),
    seccao(
      'Cores personalizadas',
      p('Cada configuração pode ter cores próprias, publicadas como `--color--custom-<nome>`. Ao contrário das outras, não se herdam: só existem nas configurações que as têm. Dentro de uma secção cuja configuração não a tem, a variável vem de uma configuração mais acima na página, ou fica vazia. Usa um valor de recurso:'),
      codigo(`.alerta { color: var(--color--custom-blood, red); }`),
    ),
    seccao(
      'No painel',
      lista([
        'Em Tokens → Cores, a primeira configuração da lista é a base e tem de ter todas as cores.',
        'Nas outras, uma cor vazia mostra "Herdada de …". O botão "Definir cor própria" começa com as cores da base; o botão "Herdar de …" volta a deixá-la vazia.',
        'Cada cor herda-se com as duas versões (clara e escura) ao mesmo tempo.',
        'Uma configuração nova começa com todas as cores herdadas.',
      ]),
    ),
  )
}

const Texto = () => {
  const lido = usePublicado('tokens/tokens.css')
  const vars = variaveis(lido?.texto ?? '').filter(([v]) => v.startsWith('--font-size-'))
  return pagina(
    'Tamanhos de texto',
    'Os tamanhos de texto estão no mesmo `tokens.css` que as cores, em px. Não dependem da configuração (`data-config`): são iguais em todas.',
    seccao(
      'Usar um tamanho',
      codigo(`
h1 { font-size: var(--font-size-h1); }
p  { font-size: var(--font-size-paragraph); }
.destaque { font-size: var(--font-size-main-content); }`),
    ),
    seccao(
      'Tamanhos publicados',
      origem(lido, 'tokens/tokens.css'),
      tabela(
        ['Variável', 'Valor', 'Exemplo'],
        vars.map(([v, valor]) => [
          `\`${v}\``,
          valor,
          h('span', { style: { fontSize: `min(var(${v}), 48px)`, lineHeight: 1.1, color: '#111827' } }, 'Aa'),
        ]),
      ),
      p('Os exemplos estão limitados a 48 px para caberem na tabela.'),
      p('Os tamanhos personalizados (Tokens → Tamanhos de texto no painel) aparecem como `--font-size-custom-<nome>`.'),
    ),
  )
}

const Botoes = () => {
  const lido = usePublicado('button/button.css')
  const vars = variaveis(lido?.texto ?? '')
  return pagina(
    'Botões',
    'O `button.css` tem as medidas de cada tipo de botão: tamanho do texto, espaçamentos, arredondamento, espessuras e o ícone. Não tem cores: essas vêm sempre do `tokens.css`.',
    seccao(
      'Exemplo',
      codigo(`
.main-btn {
  font-size: var(--main-btn-font-size);
  padding: var(--main-btn-padding-y) var(--main-btn-padding-x);
  border-radius: var(--main-btn-radius);
  border: var(--main-btn-border-width) solid var(--color--primary);
  background: var(--color--primary);
  color: var(--color--background);
}
.main-btn:hover { filter: brightness(1.1); }

.secondary-btn {
  font-size: var(--secondary-btn-font-size);
  padding: var(--secondary-btn-padding-y) var(--secondary-btn-padding-x);
  border-radius: var(--secondary-btn-radius);
  border: var(--secondary-btn-border-width) solid var(--color--secondary);
  background: transparent;
  color: var(--color--secondary);
}`),
      nota('Estados como `:hover` não funcionam com estilos inline (`style={{…}}`). Usa classes CSS na lib.'),
      p('O `--nav-btn-icon` é um `url(…)` para `background-image` ou `mask-image`.'),
    ),
    seccao(
      'Medidas publicadas',
      origem(lido, 'button/button.css'),
      tabela(['Variável', 'Valor'], vars.map(([v, valor]) => [`\`${v}\``, h('code', { style: { overflowWrap: 'anywhere' } }, valor)])),
    ),
  )
}

const Elementos = () => {
  const lido = usePublicado('element/index.json')
  let ficheiros: string[] = []
  try {
    ficheiros = JSON.parse(lido?.texto ?? '[]')
  } catch {}
  return pagina(
    'Elementos',
    'Os Elementos são textos curtos (títulos, subtítulos, antetítulos, parágrafos, citações e listas) em vários idiomas. Cada ficheiro do painel é publicado como JSON em `element/<ficheiro>.json`.',
    seccao(
      'Ficheiros publicados',
      origem(lido, 'element/index.json'),
      lista(ficheiros.map((f) => link(`${PAGES}/element/${f}`, f))),
      p('O `index.json` tem a lista dos ficheiros. Os nomes distinguem maiúsculas: pede o nome exato.'),
    ),
    seccao(
      'Forma do JSON',
      codigo(`
type TextContent = { type: 'title' | 'text' | 'eyebrow' | 'subtitle' | 'item' | 'quote'; content?: string }
type GroupContent = { type: 'group'; content?: string; contents: TextContent[] }
type Content = TextContent | GroupContent
type ContentBlock = { language: string; contents: Content[] }
type TextElement = { name: string; contentBlock: ContentBlock[] }
type Ficheiro = { items?: TextElement[] }`),
      lista([
        'Cada item é um texto em todos os idiomas, e procura-se pelo `name` (único no ficheiro).',
        'Cada `contentBlock` é a versão num idioma, com pelo menos um bloco.',
        'O `item` (item de lista) pode repetir-se, e a ordem dos itens é a da lista. Os outros tipos de texto aparecem no máximo uma vez em cada idioma e uma vez em cada grupo.',
        'Um bloco `group` junta blocos relacionados (ex.: uma pergunta e a sua resposta) no seu `contents`. Pode haver vários grupos, mas um grupo não tem grupos dentro. O `content` de um grupo vem vazio ou não vem.',
        'Um `find()` por tipo só olha para o primeiro nível, por isso nunca apanha um bloco de dentro de um grupo. Quem não conhece os grupos nem os tipos novos continua a funcionar.',
        'Um ficheiro sem elementos vem como `{}`: trata a falta de `items` como `[]`.',
        'Um bloco vazio pode vir sem `content`.',
      ]),
    ),
    seccao(
      'Ler um texto',
      p('O idioma `default` serve para todos: usa-o quando não houver o idioma pedido.'),
      codigo(`
const BASE = '${PAGES}/element/'

async function carregar(ficheiro) {
  const dados = await (await fetch(BASE + ficheiro + '.json')).json()
  return dados.items ?? []
}

function texto(items, name, idioma) {
  const blocos = items.find((i) => i.name === name)?.contentBlock ?? []
  const versao =
    blocos.find((b) => b.language === idioma) ??
    blocos.find((b) => b.language === 'default') ??
    blocos[0]
  const de = (tipo) => versao?.contents.find((c) => c.type === tipo)?.content ?? ''
  return { eyebrow: de('eyebrow'), title: de('title'), text: de('text') }
}

// const items = await carregar('exemplo')
// texto(items, 'titulo', 'pt')  →  { eyebrow: '…', title: '…', text: '…' }`),
    ),
    seccao(
      'Listas e grupos',
      p('Os itens de lista e os grupos leem-se a partir dos blocos de um idioma (a `versao` do exemplo acima):'),
      codigo(`
// Itens da lista, pela ordem
const itens = versao.contents.filter((c) => c.type === 'item').map((c) => c.content ?? '')

// Grupos, pela ordem: [{ subtitle: 'Pergunta 1', text: 'Resposta 1', items: [] }, …]
const grupos = versao.contents
  .filter((c) => c.type === 'group')
  .map((g) => {
    const de = (tipo) => g.contents.find((c) => c.type === tipo)?.content ?? ''
    return {
      subtitle: de('subtitle'),
      text: de('text'),
      items: g.contents.filter((c) => c.type === 'item').map((c) => c.content ?? ''),
    }
  })`),
    ),
    seccao(
      'Idiomas e tipos',
      tabela(['Código', 'Idioma'], IDIOMAS.map(({ value, label }) => [`\`${value}\``, label])),
      tabela(
        ['Tipo', 'No painel'],
        [...TIPOS, { value: GRUPO, label: 'Grupo' }].map(({ value, label }) => [`\`${value}\``, label.replace(/\s*\(.*\)$/, '')]),
      ),
    ),
  )
}

const Etiquetas = () => {
  const lido = usePublicado('tag/index.json')
  let etiquetas: { name: string; file: string; source: string }[] = []
  try {
    etiquetas = JSON.parse(lido?.texto ?? '[]')
  } catch {}
  const imagem = /\.(png|jpe?g|gif|webp|svg|avif|ico)$/i
  // As pré-visualizações vêm de onde se leu a lista (local ou Pages); os links mostram sempre o Pages.
  const pasta = lido?.url.replace(/index\.json$/, '') ?? `${PAGES}/tag/`
  return pagina(
    'Etiquetas',
    'Uma etiqueta é um nome fixo que aponta para um ficheiro do Media Manager. O ficheiro é publicado em `tag/<nome>.<extensão>`, e esse link não muda quando quem edita escolhe outro ficheiro para a etiqueta. Serve, por exemplo, para ter vários favicons e escolher no painel qual está em uso.',
    seccao(
      'Usar uma etiqueta',
      codigo(`
<link rel="icon" href="${PAGES}/tag/favicon.png">
<img src="${PAGES}/tag/logotipo.svg" alt="Logótipo">`),
      lista([
        'O nome no link é o da etiqueta em minúsculas, sem acentos e com `-` no lugar dos espaços ("Logótipo Principal" → `logotipo-principal`).',
        'A extensão é a do ficheiro escolhido. Se quem edita trocar um `.png` por um `.svg`, o link muda: combina com a equipa manter a extensão de cada etiqueta.',
        'Os ficheiros sem etiqueta continuam publicados no seu caminho de sempre (`uploads/<ficheiro>`).',
      ]),
      nota('O GitHub Pages deixa o browser guardar os ficheiros em cache até 10 minutos, e os browsers guardam os favicons durante mais tempo. Depois de trocar o ficheiro, pode demorar a aparecer.'),
    ),
    seccao(
      'Etiquetas publicadas',
      origem(lido, 'tag/index.json'),
      etiquetas.length
        ? tabela(
            ['Etiqueta', 'Link', 'Ficheiro escolhido', ''],
            etiquetas.map((e) => [
              e.name,
              link(`${PAGES}/tag/${e.file}`, `tag/${e.file}`),
              `\`${e.source}\``,
              imagem.test(e.file)
                ? h('img', { src: pasta + e.file, alt: '', style: { maxWidth: 64, maxHeight: 32, verticalAlign: 'middle' } })
                : '',
            ]),
          )
        : lido
          ? p('Ainda não há etiquetas.')
          : null,
    ),
    seccao(
      'Lista em JSON',
      p('O `tag/index.json` lista as etiquetas, para quem as quiser descobrir sem as conhecer de antemão:'),
      codigo(`
type Etiqueta = {
  name: string    // nome no painel
  file: string    // ficheiro publicado, em tag/ (ex.: "favicon.png")
  source: string  // ficheiro escolhido no Media Manager (ex.: "/uploads/favicon-natal.png")
}
type Ficheiro = Etiqueta[]`),
    ),
    seccao(
      'No painel',
      lista([
        'Em Etiquetas → tags, acrescenta uma etiqueta, dá-lhe um nome e escolhe o ficheiro (abre o Media Manager).',
        'Para trocar o ficheiro de uma etiqueta, escolhe outro ficheiro; não mudes o nome.',
        'Não apagues do Media Manager um ficheiro que esteja numa etiqueta: a publicação para até a etiqueta apontar para outro ficheiro.',
      ]),
    ),
  )
}

// ---------- Menu ----------

const Livro = ({ className }: { className?: string }) =>
  h(
    'svg',
    { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' },
    h('path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z' }),
    h('path', { d: 'M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5' }),
  )

// Cada página aparece no menu com este nome (o URL é #/screens/<nome sem acentos nem símbolos>).
export const guia = [
  ['Guia: Começar', Comecar],
  ['Guia: Cores', Cores],
  ['Guia: Tamanhos de texto', Texto],
  ['Guia: Botões', Botoes],
  ['Guia: Elementos', Elementos],
  ['Guia: Etiquetas', Etiquetas],
].map(([name, Component]) => ({ __type: 'screen' as const, name, Component, Icon: Livro, layout: 'fullscreen' as const }))
