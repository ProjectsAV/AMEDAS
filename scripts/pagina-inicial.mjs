// Página inicial do Pages (public/index.html): link para o painel e para tudo o que foi publicado.
// Sem ela, https://<owner>.github.io/AMEDAS/ dá 404.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/**
 * @param {{ titulo: string, links: { nome: string, href: string }[] }[]} seccoes
 * @param {string} base URL público (BASE_URL); vazio em local, e aí os URLs mostrados ficam relativos.
 */
export const paginaInicial = (seccoes, base) => {
  const linha = ({ nome, href }) => `
        <li>
          <div class="info">
            <strong>${esc(nome)}</strong>
            <code>${esc(base ? `${base}/${href}` : href)}</code>
          </div>
          <div class="acoes">
            <a class="botao" href="${esc(href)}" target="_blank" rel="noopener">Abrir</a>
            <button type="button" class="botao" data-copiar="${esc(href)}">Copiar link</button>
          </div>
        </li>`
  const seccao = ({ titulo, links }) => `
    <section>
      <h2>${esc(titulo)}</h2>
      <ul>${links.map(linha).join('')}
      </ul>
    </section>`
  const data = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Lisbon' }).format(new Date())

  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AMEDAS</title>
  <style>
    :root {
      --fundo: #f6f7f9; --cartao: #fff; --texto: #111827; --suave: #6b7280; --borda: #e5e7eb;
      --destaque: #2563eb; --destaque-texto: #fff; --codigo: #f3f4f6;
      color-scheme: light dark;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --fundo: #0f1115; --cartao: #181b22; --texto: #f3f4f6; --suave: #9ca3af; --borda: #2a2f3a;
        --destaque: #60a5fa; --destaque-texto: #0f1115; --codigo: #222733;
      }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--fundo); color: var(--texto); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    main { max-width: 820px; margin: 0 auto; padding: 40px 16px 64px; }
    h1 { margin: 0 0 4px; font-size: 28px; }
    header p { margin: 0 0 28px; color: var(--suave); }
    .painel { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between;
      background: var(--cartao); border: 1px solid var(--borda); border-radius: 12px; padding: 20px; margin-bottom: 32px; }
    .painel h2 { margin: 0; font-size: 18px; }
    .painel p { margin: 4px 0 0; color: var(--suave); font-size: 14px; }
    section { margin-bottom: 28px; }
    section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--suave); margin: 0 0 8px; }
    ul { list-style: none; margin: 0; padding: 0; background: var(--cartao); border: 1px solid var(--borda); border-radius: 12px; }
    li { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 12px 16px; }
    li + li { border-top: 1px solid var(--borda); }
    .info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    code { font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--suave); overflow-wrap: anywhere; }
    .acoes { display: flex; gap: 8px; flex-shrink: 0; }
    .botao { display: inline-block; font: inherit; font-size: 14px; padding: 6px 12px; border-radius: 8px; cursor: pointer;
      border: 1px solid var(--borda); background: var(--codigo); color: var(--texto); text-decoration: none; white-space: nowrap; }
    .botao:hover { border-color: var(--destaque); }
    .principal { background: var(--destaque); color: var(--destaque-texto); border-color: var(--destaque); font-weight: 600; padding: 10px 18px; }
    footer { color: var(--suave); font-size: 13px; }
    @media (max-width: 560px) {
      li { flex-direction: column; align-items: stretch; }
      .acoes .botao { flex: 1; text-align: center; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>AMEDAS</h1>
      <p>Conteúdo de design editado no painel e publicado aqui para as libs.</p>
    </header>

    <div class="painel">
      <div>
        <h2>Painel de edição</h2>
        <p>Altera cores, tamanhos, botões e elementos. Pede login do TinaCloud.</p>
      </div>
      <a class="botao principal" href="admin/">Abrir o painel</a>
    </div>
${seccoes.map(seccao).join('\n')}

    <footer>Publicado em ${esc(data)}.</footer>
  </main>
  <script>
    // Copia o URL completo (o browser resolve o caminho relativo).
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-copiar]')
      if (!b) return
      try {
        await navigator.clipboard.writeText(new URL(b.dataset.copiar, location.href).href)
        b.textContent = 'Copiado'
      } catch {
        b.textContent = 'Não foi possível copiar'
      }
      setTimeout(() => (b.textContent = 'Copiar link'), 1500)
    })
  </script>
</body>
</html>
`
}
