# AMEDAS: guia para agentes

Repositório de **conteúdo de design** gerido por pessoas não técnicas através do [TinaCMS](https://tina.io). Quem edita altera JSON num painel web. Um script converte esses JSON em **CSS com variáveis** e o resultado é publicado no GitHub Pages. As libs React da empresa, que estão noutros repositórios privados, incluem esse CSS e leem as variáveis.

Não há aplicação nem framework: só o Tina, os conteúdos e o script `scripts/gerar.mjs`.

**Estado (2026-10-06):** o projeto funciona em local, com o painel, a gravação e a geração do CSS testados. **Ainda não há commits nem repositório no GitHub**, e não existe projeto no TinaCloud. O workflow de publicação e o login em produção **nunca correram**.

## Fluxo de dados

```
Painel Tina (/admin)
   │  grava
   ▼
conteudo/<coleção>/*.json      ← fonte de verdade do conteúdo
   │  node scripts/gerar.mjs
   ▼
public/<coleção>/<coleção>.css  + cópia dos JSON   (gerado, ignorado no git)
   │  GitHub Actions → GitHub Pages
   ▼
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
| `tina/campos.ts` | Funções partilhadas que criam campos: `px`, `rgba`, `claroEscuro`, `tamanhos`, `descricao`, `slug`. Os campos novos devem usar estas funções. |
| `tina/componentes/corRgba.ts` | Componente React próprio para cores rgba (ver [Cores](#cores-e-tema-escuro)). |
| `tina/marca.ts` | Personalização do painel (título, logótipo, cor). **Não está em uso** (ver pontos de falha). |
| `tina/tina-lock.json` | Schema compilado. É **gerado** pelo `tinacms dev` ou `build`, mas **tem de ir para o git**, porque o TinaCloud lê o schema a partir dele. |
| `tina/__generated__/` | Cliente e tipos gerados. Ignorado no git; nunca se edita à mão. |
| `conteudo/` | Os JSON editados pelo Tina. |
| `scripts/gerar.mjs` | Converte JSON em CSS e copia os JSON para `public/`. É a única lógica de negócio do repositório. |
| `public/uploads/` | Imagens carregadas pelo Media Manager. Ficam no git. |
| `public/admin/`, `public/<coleção>/` | Gerados (o painel e o CSS). Ignorados no git. |
| `.github/workflows/pages.yml` | Build e deploy para o GitHub Pages, com Node 24. |

## Coleções

| Coleção (`name`) | Pasta | Ficheiros | Estrutura | Saída em `public/` |
|---|---|---|---|---|
| `tokens` (Tokens) | `conteudo/tokens/` | Fixos: só `colors.json`. Não se pode criar nem apagar | Templates: `colors` | `tokens/tokens.css` + JSON |
| `button` (Botões) | `conteudo/button/` | Fixos: `mainButton.json`, `secondaryButton.json`, `navButton.json` | Templates: `mainButton`, `secondaryButton`, `navButton` | `button/button.css` + JSON |
| `elementos` (Elementos) | `conteudo/elementos/` | **Livres**: criar e apagar permitido, sem pastas | `fields` (sem templates): `items[]` com `{ type, content, language }` | `elementos/*.json` + `index.json` (sem CSS) |

A **fonte de verdade da forma de cada JSON** são os templates e as coleções em `tina/`. O `gerar.mjs` tem de corresponder a eles; ver [Duas fontes de verdade](#1-duas-fontes-de-verdade-schema-e-gerador).

### Cores e tema escuro

- **Todas as cores são strings `rgba(r, g, b, a)`.** O seletor de cor do Tina (`ui.component: 'color'`) grava sempre `a: 1` e não tem controlo de opacidade. Por isso os campos de cor usam `rgba()` de `tina/campos.ts`, com o componente `CorRgba`: pré-visualização com fundo aos quadrados, seletor, opacidade e caixa de texto, validados pela regex de `parseRgba`. Mantém este componente em todas as cores novas.
- **`claroEscuro(name, label)`** grava `{ "light": "rgba(…)", "dark": "rgba(…)" }`.
- **No CSS**, cada par gera:
  - `--color-<k>-light` e `--color-<k>-dark`, com os valores;
  - `--color-<k>`, a variável que as libs devem usar. Aponta para a versão clara no `:root` e para a escura em `@media (prefers-color-scheme: dark)` (exceto com `data-theme="light"`) e em `:root[data-theme="dark"]`.
- **As cores personalizadas** (`custom[]`) geram `--color-custom-<slug(name)>`, uma só cor, sem versão escura. O campo `description` é só para orientação de quem edita e **não vai para o CSS**.
- **Os botões não têm cores.** Só têm medidas (tamanhos, espaçamentos, arredondamento, espessuras) e o ícone. As cores vêm sempre dos Tokens.

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

### Convenções de nomes

- **Chaves JSON e nomes de campos em inglês** (`fontSize`, `borderWidth`); **etiquetas e descrições do painel em português de Portugal**.
- **Variáveis CSS:** `--color-*` para os tokens, e `--main-btn-*`, `--secondary-btn-*`, `--nav-btn-*` para os botões. Os números saem em `px`.
- **Comentários no código** em português, curtos, explicando o porquê.

## Comandos

Os comandos estão em `package.json`. O que não é óbvio:

- **`npm run dev`:**
  - corre o Tina em modo local (sem login, grava no disco), com a API em `http://localhost:4001/graphql`, e serve `public/` em `http://localhost:3000`;
  - o painel abre em `http://localhost:4001/AMEDAS/admin/` ou em `http://localhost:3000/admin/index.html`.
- **`npm run build`** é o build de **produção**. Precisa de `TINA_CLIENT_ID` e `TINA_TOKEN` (secrets no CI, ou `.env` na raiz em local; a CLI do Tina carrega `<raiz>/.env`). Sem elas falha com *"Client not configured properly"*, **e isso é esperado**.
- **`npm run build:local`** faz o build sem TinaCloud. É o comando certo para testar o build em local.
- **`node scripts/gerar.mjs`** só gera o CSS. Com `BASE_URL=https://<owner>.github.io/AMEDAS`, os URLs das imagens ficam absolutos.

## Receitas

Cada receita termina com uma verificação. Só está feita quando essa verificação passa.

### Acrescentar um campo a um template existente
1. Acrescenta o campo em `tina/templates/<template>.ts`, usando as funções de `tina/campos.ts`.
2. Acrescenta o valor a **todos** os JSON desse template, sobretudo se `required: true`. Os ficheiros fixos não se recriam sozinhos.
3. Se o campo deve chegar ao CSS, acrescenta a variável na função do template em `colecoes` no `scripts/gerar.mjs`.
4. **Verificação:**
   - `node scripts/gerar.mjs` corre sem erros;
   - a variável aparece em `public/<coleção>/<coleção>.css` **sem** `undefined`;
   - o `tina/tina-lock.json` mostra o campo (`tinacms dev` ou `build:local`).

### Acrescentar um tipo de documento (template) a uma coleção fixa
1. Cria `tina/templates/<nome>.ts`, com `name` igual à chave que vais usar no JSON.
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
- **Sintoma:** em produção, o painel não mostra campos novos, ou o build do CI falha com erro de schema.
- **Causa:** o TinaCloud lê o schema do `tina/tina-lock.json` commitado, que só se atualiza ao correr o `tinacms dev` ou o `build`.
- **O que fazer:** faz commit do `tina-lock.json` no mesmo commit da alteração ao schema.

### 6. `basePath`, imagens e URLs
- **`basePath`:** `build.basePath: 'AMEDAS'` tem de ser igual ao nome do repositório no GitHub, porque o Pages serve o site em `/<repo>/`.
- **Caminhos das imagens:** os campos `image` gravam `/uploads/<ficheiro>`, **sem** `/AMEDAS`. O gerador acrescenta o `BASE_URL`, que só está definido no CI; em local, o `url()` fica relativo. Os JSON copiados para `public/` mantêm o caminho cru, por isso quem os ler tem de juntar a base.
- **Media Manager:** o URL que mostra é `window.location.origin + src`. Com o painel aberto na porta 4001, o link dá 404, porque as imagens são servidas na 3000.

### 7. Cores
- **Seletor do Tina:** trocar `rgba()` por `ui.component: 'color'` perde a transparência em silêncio (opacidade sempre 1).
- **Regex do `parseRgba`:** aceita `rgba(0-255, 0-255, 0-255, 0-1)` e nada mais. Rejeita hex, `rgb()`, percentagens e opacidade acima de 1. Um valor já gravado noutro formato aparece como inválido no painel.
- **`slug()` duplicado:** existe em `tina/campos.ts` (validação de nomes repetidos e etiquetas) e em `scripts/gerar.mjs` (nomes das variáveis). **Têm de ficar iguais**, senão o painel mostra uma variável e o CSS gera outra.
- **Nomes repetidos:** o painel bloqueia a gravação com nomes que dão o mesmo slug. O gerador volta a verificar e lança erro, o que faz parar o deploy se o JSON for editado fora do painel.
- **Sem versão escura:** as cores personalizadas não têm versão escura.

### 8. Permissões só no painel
O `allowedActions` só esconde botões no painel. Pelo git, ou pela API GraphQL, continua a ser possível criar ou apagar ficheiros nas coleções fixas.

Se um ficheiro fixo desaparecer, o gerador simplesmente não o inclui: as variáveis somem do CSS sem erro. Se aparecer um `_template` desconhecido, o gerador lança erro.

Com `delete: false`, a opção **Rename** também desaparece; no código do Tina, depende do `delete`.

### 9. Coleção Elementos
- **Ficheiro sem elementos:** é gravado como `{}`, sem `items`. Os consumidores devem tratar a falta de `items` como `[]`.
- **Campos vazios:** um `type` ou `content` vazio pode ser omitido em vez de gravado como `""`.
- **Nome do ficheiro:** passa por `slug()` (`ui.filename.parse`). Um nome só com símbolos dá uma string vazia.
- **Publicação:** o gerador apaga `public/elementos/` e recria-o (para refletir ficheiros apagados) e escreve `index.json`, porque o Pages não lista pastas.
- **`language` em falta:** elementos gravados antes de o campo existir, ou editados fora do painel, podem não ter `language`. O painel mostra-o vazio e não deixa gravar até ser escolhido (`required`). Os consumidores devem tratar a falta de `language` como `default`.
- **Opção vazia no seletor:** o Tina acrescenta uma opção vazia antes das 12. É o `required` que impede gravá-la.
- **Acrescentar ou remover um idioma:** muda só a constante `IDIOMAS`. Remover um código deixa os elementos que já o usam com um valor que o seletor não mostra; antes de remover, procura `"language": "<código>"` em `conteudo/elementos/`.
- **Idioma repetido:** nada impede dois elementos com o mesmo `type` e o mesmo `language` no mesmo ficheiro. Quem consome decide qual usar.

### 10. Texto nas descrições
- **`description` dos campos:** o Tina interpreta-a como HTML, e `<nome>` desaparece. Escreve exemplos sem `<…>`.
- **`descricao(texto)`:** é um campo só de leitura que não grava valor. Não uses `descricao` como nome de um campo real no mesmo template.

### 11. Marca do painel desligada
`tina/marca.ts` existe e funcionava, injetando CSS sobre classes internas do Tina (`fill-tina-orange`, `bg-tina-orange-dark`). O `cmsCallback` que a chamava **foi retirado do `config.ts`** pelo utilizador. Ficou um `import { aplicarMarca }` sem uso e um comentário solto antes de `schema`.

Pergunta ao utilizador antes de religar a marca ou de apagar estes restos.

Se a religares, confirma o aspeto depois de cada atualização do `tinacms`, porque as classes internas podem mudar. O ecrã de login do TinaCloud não é personalizável.

### 12. Ambiente
- **Node:** em local é o 26; o CI usa o 24; o `create-tina-app` exige o 22 ou o 24. Se algo da CLI do Tina falhar só em local, experimenta o Node 24.
- **npm 11:** bloqueia os scripts de instalação de `esbuild`, `better-sqlite3` e `core-js`. Não foram aprovados e tudo funciona; aprova-os (`npm install-scripts approve <pkg>`) só se aparecer um erro relacionado.
- **GitHub Pages:** num repositório privado exige um plano pago, e o site publicado (CSS, JSON, imagens, `/admin`) é **público**. O `/admin` exige login do TinaCloud.

### 13. Do lado das libs
O componente Button do projeto irmão `~/Secretária/Button-Tina` ainda lê `--btn-primary-bg`, `--btn-radius`, etc., nomes que este repositório já não gera. As libs têm de passar a ler `--color-*` e `--<tipo>-btn-*`.

Estados como `:hover` e o sublinhado da página ativa não funcionam com estilos inline (`style={{…}}`): precisam de classes CSS na lib.

### 14. Restos no repositório
- **`conteudo/nav/`:** pasta vazia, criada pelo painel quando ainda era permitido criar pastas. O git ignora-a.
- **`conteudo/`:** contém dados reais de quem edita. Altera estes ficheiros só quando a tarefa o pede e mantém os valores existentes.

## Pendente
1. Primeiro commit; repositório `<owner>/AMEDAS` no GitHub; projeto no TinaCloud (Client ID, token, *Site URLs*); secrets; Pages com a fonte *GitHub Actions*.
2. Primeira execução real do `pages.yml` e do login em produção.
3. Decidir o mapeamento das cores dos botões nas libs, por exemplo, o fundo do botão principal = `--color-primary`. Não há token para o texto sobre as cores principal, secundária e terciária.
4. Confirmar em tina.io os limites do plano gratuito (utilizadores, modo editorial).
