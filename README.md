# AMEDAS

**Arva Meta Data Storage**: o sítio onde a equipa guarda as cores, os tamanhos de texto, as medidas dos botões, os textos e os ficheiros com link fixo (etiquetas) dos sites da Arva Vare. Edita-se num painel web, sem mexer em código, e o resultado é publicado como CSS e JSON que as apps e as libs leem.

- **Página inicial** (links para tudo o que está publicado): https://projectsav.github.io/AMEDAS/
- **Painel** (exige login do TinaCloud): https://projectsav.github.io/AMEDAS/admin/

## Como funciona

1. Quem edita altera os conteúdos no painel ([TinaCMS](https://tina.io)). Cada gravação é um commit no `main` deste repositório.
2. O commit dispara o GitHub Actions (`.github/workflows/pages.yml`), que corre `npm run build`. O script `scripts/gerar.mjs` converte os JSON de `conteudo/` em CSS e verifica-os.
3. O resultado é publicado no GitHub Pages, em menos de dois minutos.

O painel tem um guia (secção *Site* do menu: **Guia: Começar**, **Cores**, **Tamanhos de texto**, **Botões**, **Elementos** e **Etiquetas**) com os nomes das variáveis e exemplos de código, sempre atualizado com o que está publicado.

## O que é publicado

| Coleção no painel | Ficheiro | Conteúdo |
|---|---|---|
| Tokens | `tokens/tokens.css` | Cores (claro e escuro, por marca) e tamanhos de texto |
| Botões | `button/button.css` | Medidas dos botões principal, secundário e de navegação |
| Elementos | `element/<ficheiro>.json` e `element/index.json` | Textos em vários idiomas |
| Etiquetas | `tag/<etiqueta>.<extensão>` e `tag/index.json` | Ficheiros do Media Manager com um link que não muda |
| (Media Manager) | `uploads/<ficheiro>` | Todos os ficheiros carregados, com ou sem etiqueta |

Os JSON de cada coleção também são publicados ao lado do CSS.

### Cores, textos e botões (CSS)

```html
<link rel="stylesheet" href="https://projectsav.github.io/AMEDAS/tokens/tokens.css">
<link rel="stylesheet" href="https://projectsav.github.io/AMEDAS/button/button.css">
```

```css
.botao {
  background: var(--color--primary);
  border-radius: var(--main-btn-radius);
  font-size: var(--font-size-paragraph);
}
```

- **Cores:** as libs usam os nomes neutros (`--color--primary`, `--color--h1`…). O tema escuro aplica-se sozinho (`prefers-color-scheme`) ou com `data-theme="dark"`.
- **Marcas:** cada marca é uma configuração de cores no painel. A app escolhe-a com `data-config="<marca>"` num contentor; sem ele, aplica-se a primeira configuração (a base).

### Textos (Elementos)

Cada ficheiro de Elementos é uma lista de textos, cada um com um nome e uma versão por idioma (`default` serve para todos):

```json
{ "items": [
  { "name": "faq", "contentBlock": [
    { "language": "pt", "contents": [
      { "type": "title", "content": "Perguntas frequentes" },
      { "type": "item",  "content": "Arquitetura" },
      { "type": "item",  "content": "Design" },
      { "type": "group", "contents": [
        { "type": "subtitle", "content": "Quanto tempo demora um projeto?" },
        { "type": "text",     "content": "Entre 6 e 18 meses." }
      ] }
    ] }
  ] }
] }
```

- **Tipos de bloco:** `title` (título), `subtitle` (subtítulo), `text` (texto), `eyebrow` (antetítulo), `quote` (citação) e `item` (item de lista). Só o `item` se pode repetir; a ordem dos itens é a da lista.
- **Grupos:** um bloco `group` junta blocos relacionados no seu `contents` (ex.: uma pergunta e a resposta, um cartão). Pode haver vários grupos, mas não há grupos dentro de grupos.

Em TypeScript, o mais simples é usar o cliente [`@arva/seara`](https://github.com/ProjectsAV/Seara) (privado), que já tem os tipos.

### Ficheiros com link fixo (Etiquetas)

Uma etiqueta é um nome que aponta para um ficheiro do Media Manager. O ficheiro é publicado em `tag/<etiqueta>.<extensão>`, e o link não muda quando se escolhe outro ficheiro para a etiqueta. Por exemplo, com vários favicons carregados, a etiqueta "Favicon" escolhe qual está em uso:

```html
<link rel="icon" href="https://projectsav.github.io/AMEDAS/tag/favicon.png">
```

- O nome no link é o da etiqueta em minúsculas, sem acentos e com `-` no lugar dos espaços. A extensão é a do ficheiro escolhido: se mudar (ex.: de `.png` para `.svg`), o link muda.
- O número de etiquetas é livre (pode não haver nenhuma), e os ficheiros sem etiqueta continuam em `uploads/<ficheiro>`.
- As etiquetas editam-se na coleção **Etiquetas** do painel, porque o Media Manager do Tina não se pode estender.

## Desenvolvimento

Requer Node 22 ou 24 (o CI usa o 24).

```bash
npm install
npm run dev          # painel em http://localhost:4001/AMEDAS/admin/ e public/ em http://localhost:3000
```

- **Em local, o painel grava diretamente nos JSON de `conteudo/`**, que são os dados reais. Antes de testar, faz `git pull` (o painel publicado faz commits no `main`). No fim, desfaz os testes com `git restore conteudo`.
- **O `dev` não gera o CSS.** Corre `node scripts/gerar.mjs` (ou `node --watch-path=conteudo scripts/gerar.mjs` noutro terminal).
- **Build local:** `npm run build:local`. O `npm run build` é o de produção e precisa de `TINA_CLIENT_ID` e `TINA_TOKEN`.
- **Ao mudar o schema** (`tina/`), o `tina/tina-lock.json` atualizado pelo `npm run dev` tem de ir no mesmo commit.

| Pasta | O que tem |
|---|---|
| `conteudo/` | Os JSON editados no painel (fonte de verdade) |
| `tina/` | Configuração do painel: coleções, campos, componentes próprios e o guia |
| `scripts/` | `gerar.mjs` (JSON → CSS, verificações) e a página inicial |
| `public/` | Resultado do build (ignorado no git, exceto `public/uploads/`) |

O [`AGENTS.md`](AGENTS.md) tem a documentação técnica completa: a forma de cada JSON, as receitas para acrescentar campos e coleções, e os pontos de falha conhecidos.
