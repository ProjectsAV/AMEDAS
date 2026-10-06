# AMEDAS: guia para agentes

Repositório de **conteúdo de design** gerido por pessoas não técnicas através do [TinaCMS](https://tina.io). Quem edita altera JSON num painel web. Um script converte esses JSON em **CSS com variáveis** e o resultado é publicado no GitHub Pages. As libs React da empresa, que estão noutros repositórios privados, incluem esse CSS e leem as variáveis.

Não há aplicação nem framework: só o Tina, os conteúdos e o script `scripts/gerar.mjs` (com a página inicial em `scripts/pagina-inicial.mjs`).

**Estado (2026-10-06):** o projeto funciona em local, com o painel, a gravação e a geração do CSS testados. O repositório público é `ProjectsAV/AMEDAS` (o Pages fica em `https://projectsav.github.io/AMEDAS/`), e o projeto TinaCloud `AMEDAS` já foi criado. O primeiro deploy falhou por falta dos secrets `TINA_CLIENT_ID` e `TINA_TOKEN`. O login em produção ainda não foi testado.

## Fluxo de dados

```
Painel Tina (/admin)
   │  grava
   ▼
conteudo/<coleção>/*.json      ← fonte de verdade do conteúdo
   │  node scripts/gerar.mjs
   ▼
public/<coleção>/<coleção>.css  + cópia dos JSON   (gerado, ignorado no git)
public/index.html               ← página inicial com os links de tudo
   │  GitHub Actions → GitHub Pages
   ▼
https://<owner>.github.io/AMEDAS/                        (página inicial)
https://<owner>.github.io/AMEDAS/<coleção>/<coleção>.css
   │  <link rel="stylesheet">
   ▼
libs React (outros repositórios): var(--color-primary), var(--main-btn-radius)…
```

- **Em produção:** o painel publicado grava através do **TinaCloud**, que faz commit no GitHub. Esse commit dispara `.github/workflows/pages.yml`, que corre `npm run build` (o build do Tina mais o `gerar.mjs`) e publica a pasta `public/`.
- **Em local:** o `npm run dev` grava diretamente no disco e **não** gera o CSS (ver [Pontos de falha](#pontos-de-falha)).

## Mapa de ficheiros

| Caminho | Papel |
|---|---|
| `tina/config.ts` | Entrada do Tina: lista de coleções, `basePath`, media e credenciais (vindas do ambiente). |
| `tina/colecoes/*.ts` | Uma coleção por ficheiro. Definem a pasta, o formato, as permissões (`allowedActions`) e os templates ou campos. |
| `tina/templates/*.ts` | Templates: os "tipos de documento" dentro de uma coleção. Cada JSON indica o seu em `_template`. |
| `tina/campos.ts` | Funções partilhadas que criam campos: `px`, `rgba`, `claroEscuro`, `tamanhos`, `descricao`, `slug`, `nomeUnico`, `nomeFicheiro`. Os campos novos devem usar estas funções. |
| `tina/componentes/corRgba.ts` | Componente React próprio para cores rgba (ver [Cores](#cores-e-tema-escuro)). |
| `tina/tina-lock.json` | Schema compilado. É **gerado** pelo `tinacms dev` (o `build:local` não o atualiza), mas **tem de ir para o git**, porque o TinaCloud lê o schema a partir dele. |
| `tina/__generated__/` | Cliente e tipos gerados. Ignorado no git; nunca se edita à mão. |
| `conteudo/` | Os JSON editados pelo Tina. |
| `scripts/gerar.mjs` | Converte JSON em CSS e copia os JSON para `public/`. É a única lógica de negócio do repositório. |
| `scripts/pagina-inicial.mjs` | HTML da página inicial (ver [Página inicial](#página-inicial)). Chamada no fim do `gerar.mjs`. |
| `public/uploads/` | Imagens carregadas pelo Media Manager. Ficam no git. |
| `public/admin/`, `public/<coleção>/`, `public/index.html` | Gerados (o painel, o CSS e a página inicial). Ignorados no git. |
| `.github/workflows/pages.yml` | Build e deploy para o GitHub Pages, com Node 24. |

## Coleções

| Coleção (`name`) | Pasta | Ficheiros | Estrutura | Saída em `public/` |
|---|---|---|---|---|
| `tokens` (Tokens) | `conteudo/tokens/` | Fixos: `colors.json` e `text.json`. Não se pode criar nem apagar | Templates: `colors`, `text` | `tokens/tokens.css` + JSON |
| `button` (Botões) | `conteudo/button/` | Fixos: `mainButton.json`, `secondaryButton.json`, `navButton.json` | Templates: `mainButton`, `secondaryButton`, `navButton` | `button/button.css` + JSON |
| `elementos` (Elementos) | `conteudo/elementos/` | **Livres**: criar e apagar permitido, sem pastas. Nome com `A-Z a-z 0-9 - _` | `fields` (sem templates): `items[]` com `{ type, content, language }` | `elementos/*.json` + `index.json` (sem CSS) |

A **fonte de verdade da forma de cada JSON** são os templates e as coleções em `tina/`. O `gerar.mjs` tem de corresponder a eles; ver [Duas fontes de verdade](#1-duas-fontes-de-verdade-schema-e-gerador).

### Cores e tema escuro

- **Todas as cores são strings `rgba(r, g, b, a)`.** O seletor de cor do Tina (`ui.component: 'color'`) grava sempre `a: 1` e não tem controlo de opacidade. Por isso os campos de cor usam `rgba()` de `tina/campos.ts`, com o componente `CorRgba`: pré-visualização com fundo aos quadrados, seletor, opacidade e caixa de texto, validados pela regex de `parseRgba`. Mantém este componente em todas as cores novas.
- **`claroEscuro(name, label)`** grava `{ "light": "rgba(…)", "dark": "rgba(…)" }`.
- **No CSS**, cada par gera:
  - `--color-<k>-light` e `--color-<k>-dark`, com os valores;
  - `--color-<k>`, a variável que as libs devem usar. Aponta para a versão clara no `:root` e para a escura em `@media (prefers-color-scheme: dark)` (exceto com `data-theme="light"`) e em `:root[data-theme="dark"]`.
- **As cores personalizadas** (`custom[]`) geram `--color-custom-<slug(name)>`, uma só cor, sem versão escura. O campo `description` é só para orientação de quem edita e **não vai para o CSS**.
- **Os botões não têm cores.** Só têm medidas (tamanhos, espaçamentos, arredondamento, espessuras) e o ícone. As cores vêm sempre dos Tokens.

### Tamanhos de texto

O `text.json` (template `text`) guarda tamanhos em px:
- **Fixos**, entre 1 e 450: `h1Size`, `h2Size`, `h3Size`, `h4Size`, `paragraphSize` e `mainContentSize`. No CSS geram `--font-size-h1` … `--font-size-h4`, `--font-size-paragraph` e `--font-size-main-content`. O mapa chave → variável está na constante `TEXTOS` do `gerar.mjs`.
- **Personalizados** (`customSizes[]`), entre 0 e 450: `{ name, size, description? }`. Geram `--font-size-custom-<slug(name)>`. Como nas cores, o `name` é obrigatório e único (`nomeUnico`) e a `description` não vai para o CSS.
- **Os nomes das chaves têm o sufixo `Size`** porque o template `colors` já tem `h1`…`h4` e `custom` como objetos; ver [Campos com o mesmo nome](#15-campos-com-o-mesmo-nome-em-templates-da-mesma-coleção).

### Elementos e idiomas

Cada ficheiro em `conteudo/elementos/` tem a forma:
```json
{ "items": [ { "type": "titulo", "content": "Bem-vindo", "language": "pt" } ] }
```
- **`type` e `content`:** texto livre. O `content` é editado numa caixa de várias linhas.
- **`language`:** seletor obrigatório com os valores `default`, `en`, `pt`, `es`, `fr`, `it`, `de`, `sv`, `ru`, `pl`, `no`, `ja`. A lista, com as etiquetas em português, está na constante `IDIOMAS` em `tina/colecoes/elementos.ts`, que é a única fonte de verdade.
  - `default` **não é um código de idioma**: significa "sem idioma específico, serve para todos". Os consumidores devem usá-lo como fallback quando não houver um elemento no idioma pedido.
  - Os códigos seguem ISO 639-1 (`no` = norueguês, `sv` = sueco, `ja` = japonês).
- **Elementos novos** criados com **+** começam com `language: "default"` (`defaultItem`).
- **Na lista do painel**, cada elemento aparece como `[idioma] tipo — início do conteúdo`. O prefixo `[idioma]` é omitido quando o idioma é `default`.

### Página inicial

O `gerar.mjs` escreve `public/index.html`, a página de `https://projectsav.github.io/AMEDAS/` (sem ela, o Pages dá 404). Tem:
- **um botão "Abrir o painel"**, que aponta para `admin/`;
- **uma secção por coleção**, montada a partir do que o gerador publicou nessa corrida. As coleções com CSS listam primeiro o CSS e depois cada JSON; as coleções `soJson` listam o `index.json` e cada ficheiro. Cada linha tem o URL, "Abrir" e "Copiar link".

Os nomes das linhas (ex.: "Tokens · Cores") são as etiquetas do painel (`label` da coleção e do template), lidas do `tina/tina-lock.json`. Se uma etiqueta não estiver no lock, aparece o nome técnico (`tokens`, `colors`). Nos `soJson`, a linha usa o nome do ficheiro.

Os URLs mostrados são absolutos com `BASE_URL` (no CI) e relativos sem ele (em local). Os links da página são sempre relativos, por isso funcionam nos dois casos.

**O aspeto imita o painel do Tina:** só tema claro, laranja `#ec4815` / `#c2410c` / `#fff7ed`, os cinzentos do admin, a fonte Inter (Google Fonts) e botões redondos com sombra leve. As cores estão como variáveis no `:root` do `pagina-inicial.mjs`. Foram tiradas do CSS compilado do painel, `public/admin/assets/*.css` (classes `bg-tina-orange*` e `*-gray-*`); se uma atualização do `tinacms` mudar a paleta, vai lá buscar os valores novos. A página não usa o logótipo do Tina: o quadrado laranja com "A" é próprio.

### Convenções de nomes

- **Chaves JSON e nomes de campos em inglês** (`fontSize`, `borderWidth`); **etiquetas e descrições do painel em português de Portugal**.
- **Variáveis CSS:** `--color-*` e `--font-size-*` para os tokens, e `--main-btn-*`, `--secondary-btn-*`, `--nav-btn-*` para os botões. Os números saem em `px`.
- **Comentários no código** em português, curtos, explicando o porquê.

## Comandos

Os comandos estão em `package.json`. O que não é óbvio:

- **`npm run dev`:**
  - corre o Tina em modo local (sem login, grava no disco), com a API em `http://localhost:4001/graphql`, e serve `public/` em `http://localhost:3000`;
  - o painel abre em `http://localhost:4001/AMEDAS/admin/` ou em `http://localhost:3000/admin/index.html`.
- **`npm run build`** é o build de **produção**. Precisa de `TINA_CLIENT_ID` e `TINA_TOKEN` (secrets no CI, ou `.env` na raiz em local; a CLI do Tina carrega `<raiz>/.env`). Sem elas falha com *"Client not configured properly"*, **e isso é esperado**.
- **`npm run build:local`** faz o build sem TinaCloud. É o comando certo para testar o build em local.
- **`node scripts/gerar.mjs`** gera o CSS e a página inicial (não faz o build do painel). Com `BASE_URL=https://<owner>.github.io/AMEDAS`, os URLs das imagens e os URLs mostrados na página inicial ficam absolutos.

## Receitas

Cada receita termina com uma verificação. Só está feita quando essa verificação passa.

### Acrescentar um campo a um template existente
1. Acrescenta o campo em `tina/templates/<template>.ts`, usando as funções de `tina/campos.ts`.
2. Acrescenta o valor a **todos** os JSON desse template, sobretudo se `required: true`. Os ficheiros fixos não se recriam sozinhos.
3. Se o campo deve chegar ao CSS, acrescenta a variável na função do template em `colecoes` no `scripts/gerar.mjs`.
4. **Verificação:**
   - `node scripts/gerar.mjs` corre sem erros;
   - a variável aparece em `public/<coleção>/<coleção>.css` **sem** `undefined`;
   - o `tina/tina-lock.json` mostra o campo (só o `tinacms dev` o atualiza).

### Acrescentar um tipo de documento (template) a uma coleção fixa
1. Cria `tina/templates/<nome>.ts`, com `name` igual à chave que vais usar no JSON. Os nomes dos campos não podem repetir, com outro tipo, os dos outros templates da coleção (ver [ponto 15](#15-campos-com-o-mesmo-nome-em-templates-da-mesma-coleção)).
2. Acrescenta-o a `templates: [...]` em `tina/colecoes/<coleção>.ts`.
3. Cria o JSON em `conteudo/<coleção>/<nome>.json` com `"_template": "<nome>"`. Nas coleções fixas o painel não deixa criar ficheiros, por isso este passo é feito no git.
4. Acrescenta a função de conversão em `colecoes.<coleção>.<nome>` no `gerar.mjs`.
5. **Verificação:**
   - o `gerar.mjs` não lança *"template desconhecido"*;
   - a API devolve o documento:
     ```bash
     curl -s localhost:4001/graphql -H 'content-type: application/json' \
       -d '{"query":"{ <coleção>Connection { edges { node { __typename } } } }"}'
     ```

### Acrescentar uma coleção
1. Cria `tina/colecoes/<nome>.ts`, com `path: 'conteudo/<nome>'`, `format: 'json'` e `allowedActions`. Templates se houver vários tipos de ficheiro; `fields` se houver um só.
2. Importa-a e acrescenta-a a `collections` em `tina/config.ts`. **Faz esta edição por último** (ver [recompilação](#3-recompilação-do-tina-a-meio-de-edições)).
3. No `gerar.mjs`, uma de duas:
   - **Com CSS:** acrescenta `colecoes.<nome>`, com um mapa template → função. Uma coleção sem templates não tem `_template`, e o ciclo atual exige-o.
   - **Só JSON:** acrescenta o nome a `soJson`.
4. Acrescenta `public/<nome>` ao `.gitignore`.
5. **Verificação:**
   - a coleção aparece no menu do painel e na API;
   - a coleção aparece em `public/index.html`, com a etiqueta do painel (corre o `tinacms dev` antes, para o lock a ter);
   - `public/<nome>/` é gerado;
   - `git status` não mostra `public/<nome>`.

### Verificar o painel sem browser humano
O painel pode ser conduzido com Chromium headless e o protocolo CDP: o `Runtime.evaluate` dá para clicar e o `Input.insertText` para escrever. Abrir um formulário: `http://localhost:4001/AMEDAS/admin/index.html#/collections/edit/<coleção>/<ficheiro-sem-extensão>`.

Detalhes:
- em modo local aparece um modal; carrega primeiro em `[data-test="enter-edit-mode"]`;
- o Chromium do snap só escreve dentro de `~/snap/chromium/common/`;
- **antes de gravar** pelo painel, faz cópia do JSON e repõe-a no fim, porque os ficheiros em `conteudo/` são dados reais de quem edita.

## Pontos de falha

Cada ponto tem: sintoma → causa → o que fazer.

### 1. Duas fontes de verdade: schema e gerador
- **Sintoma:** o CSS sai com `undefinedpx`, ou o `gerar.mjs` rebenta com `Cannot read properties of undefined`.
- **Causa:** a forma do JSON está definida em `tina/templates` e é lida à mão no `gerar.mjs`. O filtro do gerador só descarta `null` e `''`; um campo em falta vira `` `${undefined}px` `` → `undefinedpx`, CSS inválido publicado sem aviso. Um objeto em falta (`t.border.color`) faz parar o build.
- **O que fazer:** cada alteração ao schema obriga a rever a função correspondente no `gerar.mjs` e os JSON existentes. Depois de correr o gerador, procura `undefined` no CSS.

### 2. O CSS não é gerado em `npm run dev`
- **Sintoma:** gravas no painel e o `button.css` ou o `tokens.css` não muda.
- **Causa:** o Tina só escreve o JSON, e o `dev` não corre o `gerar.mjs`.
- **O que fazer:** corre `node scripts/gerar.mjs`, ou `node --watch-path=conteudo scripts/gerar.mjs` noutro terminal. Também se pode juntar o vigia ao `dev`, com `-c "node --watch-path=conteudo scripts/gerar.mjs & python3 -m http.server 3000 -d public"`; foi testado, mas o utilizador ainda não aplicou. Em produção não há problema, porque o `build` inclui o gerador.

### 3. Recompilação do Tina a meio de edições
- **Sintoma:** o painel mostra *"Failed loading TinaCMS assets"*, ou a consola diz `ReferenceError: <x> is not defined`.
- **Causa:** o `tinacms dev` recompila `tina/config.ts` e os ficheiros que ele importa para `tina/__generated__/config.prebuild.jsx` sempre que um muda. Se várias edições seguidas forem apanhadas a meio (por exemplo, a chamada já gravada e o `import` ainda não), o resultado fica inconsistente e não se corrige sozinho.
- **O que fazer:** edita os ficheiros importados primeiro e o `config.ts` por último. No fim, corre `touch tina/config.ts` e confirma com `grep` no `config.prebuild.jsx`.

### 4. `build:local` e `dev` em simultâneo
- **Sintoma:** *"Datalayer server is busy on port 9000"*.
- **O que fazer:** para o `dev`. Para um segundo servidor, usa `--port <p> --datalayer-port <p>` numa cópia do projeto.

### 5. `tina-lock.json` desatualizado no git
- **Sintoma:** em produção, o painel não mostra campos novos, ou o build do CI falha com erro de schema. Na página inicial, uma coleção ou um template novo aparece com o nome técnico em vez da etiqueta.
- **Causa:** o TinaCloud lê o schema do `tina/tina-lock.json` commitado, que só se atualiza ao correr o `tinacms dev`. O `build:local` compila o schema mas não reescreve o lock.
- **O que fazer:** faz commit do `tina-lock.json` no mesmo commit da alteração ao schema.

### 6. `basePath`, imagens e URLs
- **`basePath`:** `build.basePath: 'AMEDAS'` tem de ser igual ao nome do repositório no GitHub, porque o Pages serve o site em `/<repo>/`.
- **Caminhos das imagens:** os campos `image` gravam `/uploads/<ficheiro>`, **sem** `/AMEDAS`. O gerador acrescenta o `BASE_URL`, que só está definido no CI; em local, o `url()` fica relativo. Os JSON copiados para `public/` mantêm o caminho cru, por isso quem os ler tem de juntar a base.
- **Media Manager:** o URL que mostra é `window.location.origin + src`. Com o painel aberto na porta 4001, o link dá 404, porque as imagens são servidas na 3000.

### 7. Cores e listas personalizadas
- **Seletor do Tina:** trocar `rgba()` por `ui.component: 'color'` perde a transparência em silêncio (opacidade sempre 1).
- **Regex do `parseRgba`:** aceita `rgba(0-255, 0-255, 0-255, 0-1)` e nada mais. Rejeita hex, `rgb()`, percentagens e opacidade acima de 1. Um valor já gravado noutro formato aparece como inválido no painel.
- **`slug()` duplicado:** existe em `tina/campos.ts` (validação de nomes repetidos e etiquetas) e em `scripts/gerar.mjs` (nomes das variáveis). **Têm de ficar iguais**, senão o painel mostra uma variável e o CSS gera outra.
- **Nomes repetidos** (`custom[]` das cores e `customSizes[]` do texto): o `nomeUnico(lista, mensagem)` bloqueia a gravação com nomes que dão o mesmo slug. O primeiro argumento é o nome da lista no formulário; se renomeares a lista, muda-o também. O gerador volta a verificar e lança erro, o que faz parar o deploy se o JSON for editado fora do painel.
- **Sem versão escura:** as cores personalizadas não têm versão escura.

### 8. Permissões só no painel
O `allowedActions` só esconde botões no painel. Pelo git, ou pela API GraphQL, continua a ser possível criar ou apagar ficheiros nas coleções fixas.

Se um ficheiro fixo desaparecer, o gerador simplesmente não o inclui: as variáveis somem do CSS sem erro. Se aparecer um `_template` desconhecido, o gerador lança erro.

Com `delete: false`, a opção **Rename** também desaparece; no código do Tina, depende do `delete`.

### 9. Coleção Elementos
- **Ficheiro sem elementos:** é gravado como `{}`, sem `items`. Os consumidores devem tratar a falta de `items` como `[]`.
- **Campos vazios:** um `type` ou `content` vazio pode ser omitido em vez de gravado como `""`.
- **Nome do ficheiro:**
  - O Tina só aceita `a-z A-Z 0-9 - _ . /` (regex `RELATIVE_PATH_REGEX` em `@tinacms/schema-tools`). Espaços nunca são aceites.
  - O `ui.filename.parse` é `nomeFicheiro()` de `tina/campos.ts`: tira acentos, troca espaços e `/` por `-` e remove o resto, incluindo `.`. Mantém maiúsculas, `-` e `_`. A `/` fica de fora porque criaria pastas.
  - O `parse` corre **a cada tecla**, no "Create New" e no Rename. Por isso não pode aparar `-` nas pontas nem transformar caracteres que se escrevem a meio do nome: o antigo `slug()` apagava o `-` final e não deixava escrever `a-b`. Não voltes a usar `slug()` aqui.
  - O campo aparece primeiro no formulário (`showFirst`), com uma descrição em português (`ui.filename.description`, interpretada como HTML).
  - Um nome só com símbolos dá uma string vazia, e o Tina responde *Required*.
  - **Maiúsculas:** `Menu.json` e `menu.json` são ficheiros diferentes no Linux e no Pages (os URLs distinguem maiúsculas), mas colidem num clone em macOS ou Windows. Quem consome tem de pedir o nome exato.
- **Publicação:** o gerador apaga `public/elementos/` e recria-o (para refletir ficheiros apagados) e escreve `index.json`, porque o Pages não lista pastas.
- **`language` em falta:** elementos gravados antes de o campo existir, ou editados fora do painel, podem não ter `language`. O painel mostra-o vazio e não deixa gravar até ser escolhido (`required`). Os consumidores devem tratar a falta de `language` como `default`.
- **Opção vazia no seletor:** o Tina acrescenta uma opção vazia antes das 12. É o `required` que impede gravá-la.
- **Acrescentar ou remover um idioma:** muda só a constante `IDIOMAS`. Remover um código deixa os elementos que já o usam com um valor que o seletor não mostra; antes de remover, procura `"language": "<código>"` em `conteudo/elementos/`.
- **Idioma repetido:** nada impede dois elementos com o mesmo `type` e o mesmo `language` no mesmo ficheiro. Quem consome decide qual usar.

### 10. Texto nas descrições
- **`description` dos campos:** o Tina interpreta-a como HTML, e `<nome>` desaparece. Escreve exemplos sem `<…>`.
- **`descricao(texto)`:** é um campo só de leitura que não grava valor. Não uses `descricao` como nome de um campo real no mesmo template.

### 11. Marca do painel removida
O painel usa o aspeto original da Tina. Houve uma personalização (`tina/marca.ts`, chamada pelo `cmsCallback` no `config.ts`) que injetava CSS sobre classes internas do Tina (`fill-tina-orange`, `bg-tina-orange-dark`). O utilizador retirou-a.

Pede confirmação ao utilizador antes de a voltar a pôr. Se a voltares a pôr, confirma o aspeto depois de cada atualização do `tinacms`, porque as classes internas podem mudar. O ecrã de login do TinaCloud não é personalizável.

Um `import` de um ficheiro que já não existe em `tina/config.ts` faz falhar o `tinacms dev` e o `build` (*Could not resolve*). Ao apagar um ficheiro de `tina/`, procura os `import` que apontam para ele.

### 12. Ambiente
- **Node:** em local é o 26; o CI usa o 24; o `create-tina-app` exige o 22 ou o 24. Se algo da CLI do Tina falhar só em local, experimenta o Node 24.
- **npm 11:** bloqueia os scripts de instalação de `esbuild`, `better-sqlite3` e `core-js`. Não foram aprovados e tudo funciona; aprova-os (`npm install-scripts approve <pkg>`) só se aparecer um erro relacionado.
- **GitHub Pages:** num repositório privado exige um plano pago, e o site publicado (CSS, JSON, imagens, `/admin`) é **público**. O `/admin` exige login do TinaCloud.

### 13. Do lado das libs
O componente Button do projeto irmão `~/Secretária/Button-Tina` ainda lê `--btn-primary-bg`, `--btn-radius`, etc., nomes que este repositório já não gera. As libs têm de passar a ler `--color-*`, `--font-size-*` e `--<tipo>-btn-*`.

Estados como `:hover` e o sublinhado da página ativa não funcionam com estilos inline (`style={{…}}`): precisam de classes CSS na lib.

### 14. Restos no repositório
- **`conteudo/nav/`:** pasta vazia, criada pelo painel quando ainda era permitido criar pastas. O git ignora-a.
- **`conteudo/`:** contém dados reais de quem edita. Altera estes ficheiros só quando a tarefa o pede e mantém os valores existentes.

### 15. Campos com o mesmo nome em templates da mesma coleção
- **Sintoma:** o `tinacms dev` ou o `build` falham com *Fields "h3" conflict because they return conflicting types "TokensColorsH3!" and "Float!"*.
- **Causa:** o Tina junta os templates de uma coleção nas mesmas queries GraphQL. Dois templates podem ter um campo com o mesmo nome só se o tipo for igual; um `object` ou uma lista de objetos tem sempre um tipo próprio por template.
- **O que fazer:** dá ao campo novo um nome distinto (foi por isso que o `text` usa `h1Size` e `customSizes`).

## Pendente
1. Secrets `TINA_CLIENT_ID` e `TINA_TOKEN` no repositório (`gh secret set`); confirmar que o TinaCloud indexou o `main`; Pages com a fonte *GitHub Actions*.
2. Primeira execução real do `pages.yml` e do login em produção.
3. Decidir o mapeamento das cores e dos tamanhos de texto nas libs, por exemplo, o fundo do botão principal = `--color-primary`. Não há token para o texto sobre as cores principal, secundária e terciária.
4. Confirmar em tina.io os limites do plano gratuito (utilizadores, modo editorial).
