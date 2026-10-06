import { readdir, readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

// URL público do Pages, ex.: https://<owner>.github.io/AMEDAS
const BASE = process.env.BASE_URL ?? ''
const url = (p) => (!p ? undefined : /^https?:/.test(p) ? `url("${p}")` : `url("${BASE}${p}")`)

// Igual ao slug() de tina/campos.ts: "Azul Marca" → "azul-marca"
const slug = (nome) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Campos comuns a todos os botões (prefixo + tema → variáveis)
const tamanhos = (p, t) => ({
  [`${p}-font-size`]: `${t.fontSize}px`,
  [`${p}-padding-y`]: `${t.paddingY}px`,
  [`${p}-padding-x`]: `${t.paddingX}px`,
})

// Cores com versão clara e escura, pela ordem do formulário
const PARES = ['background', 'text', 'h1', 'h2', 'h3', 'h4', 'h5', 'primary', 'secondary', 'tertiary', 'separator']

// Coleção (pasta em conteudo/) → template (campo "_template" do JSON) → variáveis CSS.
// Cada função devolve as variáveis do :root, ou { root, dark } quando há valores para o tema escuro.
const colecoes = {
  tokens: {
    colors: (t) => {
      const root = {}
      const dark = {}
      for (const k of PARES) {
        root[`--color-${k}-light`] = t[k].light
        root[`--color-${k}-dark`] = t[k].dark
        root[`--color-${k}`] = `var(--color-${k}-light)`
        dark[`--color-${k}`] = `var(--color-${k}-dark)`
      }
      for (const { name, color } of t.custom ?? []) {
        const v = `--color-custom-${slug(name)}`
        if (v in root) throw new Error(`Cor personalizada repetida: "${name}" (${v})`)
        root[v] = color
      }
      return { root, dark }
    },
  },
  button: {
    mainButton: (t) => ({
      ...tamanhos('--main-btn', t),
      '--main-btn-radius': `${t.radius}px`,
      '--main-btn-border-width': `${t.borderWidth}px`,
    }),
    secondaryButton: (t) => ({
      ...tamanhos('--secondary-btn', t),
      '--secondary-btn-radius': `${t.radius}px`,
      '--secondary-btn-border-width': `${t.borderWidth}px`,
    }),
    navButton: (t) => ({
      ...tamanhos('--nav-btn', t),
      '--nav-btn-indicator-height': `${t.indicatorHeight}px`,
      '--nav-btn-icon': url(t.icon),
    }),
  },
}

const bloco = (linhas, recuo) => linhas.map((l) => recuo + l).join('\n')
const declaracoes = (file, vars) => [
  `/* ${file} */`,
  ...Object.entries(vars)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${v};`),
]

// Cada coleção gera um único CSS (public/<coleção>/<coleção>.css) com as
// variáveis de todos os seus ficheiros, e copia os JSON para o mesmo sítio.
// O tema escuro aplica-se com a preferência do sistema ou com data-theme="dark" no <html>.
for (const [colecao, templates] of Object.entries(colecoes)) {
  const dir = join('conteudo', colecao)
  const out = join('public', colecao)
  await mkdir(out, { recursive: true })

  const claras = []
  const escuras = []
  for (const file of (await readdir(dir)).sort()) {
    if (!file.endsWith('.json')) continue
    const tema = JSON.parse(await readFile(join(dir, file), 'utf8'))
    const toVars = templates[tema._template]
    if (!toVars) throw new Error(`${dir}/${file}: template desconhecido "${tema._template}"`)

    const vars = toVars(tema)
    const { root, dark } = vars.root ? vars : { root: vars }
    claras.push(...declaracoes(file, root))
    if (dark && Object.keys(dark).length) escuras.push(...declaracoes(file, dark))
    await copyFile(join(dir, file), join(out, file))
  }

  let css = `:root {\n${bloco(claras, '  ')}\n}\n`
  if (escuras.length) {
    css +=
      `\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${bloco(escuras, '    ')}\n  }\n}\n` +
      `\n:root[data-theme="dark"] {\n${bloco(escuras, '  ')}\n}\n`
  }
  await writeFile(join(out, `${colecao}.css`), css)
  console.log(`${dir}/ → ${out}/${colecao}.css`)
}

// Coleções sem CSS: os JSON são só copiados para public/<coleção>/, para as libs os lerem,
// com um index.json que lista os ficheiros (o Pages não deixa listar pastas).
const soJson = ['elementos']

for (const colecao of soJson) {
  const dir = join('conteudo', colecao)
  const out = join('public', colecao)
  // Começa do zero, para os ficheiros apagados no Tina desaparecerem também daqui.
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })

  const ficheiros = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json')).sort()
  for (const file of ficheiros) await copyFile(join(dir, file), join(out, file))
  await writeFile(join(out, 'index.json'), `${JSON.stringify(ficheiros, null, 2)}\n`)
  console.log(`${dir}/ → ${out}/ (${ficheiros.length} ficheiros + index.json)`)
}
