// Página inicial do Pages (public/index.html): link para o painel e para tudo o que foi publicado.
// Sem ela, https://<owner>.github.io/AMEDAS/ dá 404.
// O aspeto imita o painel do Tina (cores e fonte tiradas do CSS do admin): claro, com laranja.

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <style>
    :root {
      /* Paleta do painel do Tina (tina-orange e cinzentos do admin) */
      --laranja: #ec4815; --laranja-escuro: #c2410c; --laranja-claro: #fff7ed;
      --fundo: #f6f6f9; --cartao: #fff; --borda: #e1ddec; --cinza: #edecf3;
      --texto: #252336; --texto-2: #433e52; --suave: #716c7f;
      --sombra: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);
      color-scheme: light;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--fundo); color: var(--texto); font: 15px/1.5 Inter, system-ui, sans-serif; }
    .topo { background: var(--cartao); border-bottom: 1px solid var(--borda); }
    .topo > div { max-width: 860px; margin: 0 auto; padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
    .marca { width: 28px; height: 28px; border-radius: 8px; background: var(--laranja); color: #fff;
      display: grid; place-items: center; font-weight: 700; font-size: 15px; }
    .topo span { font-weight: 600; font-size: 17px; letter-spacing: -.01em; }
    main { max-width: 860px; margin: 0 auto; padding: 32px 16px 64px; }
    h1 { margin: 0 0 4px; font-size: 26px; font-weight: 700; letter-spacing: -.02em; }
    header p { margin: 0 0 24px; color: var(--suave); }
    .painel { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between;
      background: var(--laranja-claro); border: 1px solid #fed7aa; border-left: 4px solid var(--laranja);
      border-radius: 8px; padding: 20px 22px; margin-bottom: 36px; }
    .painel h2 { margin: 0; font-size: 17px; font-weight: 600; }
    .painel p { margin: 4px 0 0; color: var(--texto-2); font-size: 14px; }
    section { margin-bottom: 28px; }
    section h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 10px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--suave); }
    section h2::before { content: ""; width: 3px; height: 14px; border-radius: 2px; background: var(--laranja); }
    ul { list-style: none; margin: 0; padding: 0; background: var(--cartao); border: 1px solid var(--borda);
      border-radius: 8px; box-shadow: var(--sombra); overflow: hidden; }
    li { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 12px 16px;
      border-left: 3px solid transparent; transition: background .15s, border-color .15s; }
    li + li { border-top: 1px solid var(--borda); }
    li:hover { background: var(--fundo); border-left-color: var(--laranja); }
    .info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .info strong { font-weight: 600; }
    code { font: 12.5px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--suave); overflow-wrap: anywhere; }
    .acoes { display: flex; gap: 8px; flex-shrink: 0; }
    /* Botões como os do Tina: redondos, com sombra leve */
    .botao { display: inline-block; font: 500 13px/1 Inter, system-ui, sans-serif; padding: 8px 14px; border-radius: 999px;
      border: 1px solid var(--borda); background: var(--cartao); color: var(--texto-2); box-shadow: var(--sombra);
      cursor: pointer; text-decoration: none; white-space: nowrap; transition: color .15s, border-color .15s, background .15s; }
    .botao:hover { color: var(--laranja); border-color: var(--laranja); }
    .botao:focus-visible { outline: 2px solid var(--laranja); outline-offset: 2px; }
    .botao.copiado { color: var(--laranja-escuro); border-color: var(--laranja); background: var(--laranja-claro); }
    .principal { background: var(--laranja-escuro); border-color: var(--laranja-escuro); color: #fff; font-size: 14px; font-weight: 600; padding: 11px 22px; }
    .principal:hover { background: var(--laranja); border-color: var(--laranja); color: #fff; }
    footer { color: var(--suave); font-size: 13px; }
    @media (max-width: 560px) {
      li { flex-direction: column; align-items: stretch; }
      .acoes .botao { flex: 1; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="topo"><div><div class="marca">A</div><span>AMEDAS</span></div></div>
  <main>
    <header>
      <h1>Conteúdo publicado</h1>
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
        b.classList.add('copiado')
      } catch {
        b.textContent = 'Não foi possível copiar'
      }
      setTimeout(() => {
        b.textContent = 'Copiar link'
        b.classList.remove('copiado')
      }, 1500)
    })
  </script>
</body>
</html>
`
}
