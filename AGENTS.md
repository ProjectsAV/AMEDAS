# AMEDAS: guia para agentes

Repositório de **conteúdo de design** gerido por pessoas não técnicas através do [TinaCMS](https://tina.io). Quem edita altera JSON num painel web. Um script converte esses JSON em **CSS com variáveis** e o resultado é publicado no GitHub Pages. As libs React da empresa, que estão noutros repositórios privados, incluem esse CSS e leem as variáveis.

Não há aplicação nem framework: só o Tina, os conteúdos e o script `scripts/gerar.mjs` (com a página inicial em `scripts/pagina-inicial.mjs`).

**Estado (2026-10-12):** o projeto está em produção. O repositório público é `ProjectsAV/AMEDAS` (o Pages fica em `https://projectsav.github.io/AMEDAS/`) e o projeto TinaCloud chama-se `AMEDAS`. Os secrets `TINA_CLIENT_ID` e `TINA_TOKEN` estão definidos, o `pages.yml` corre com sucesso e quem edita já grava pelo painel publicado (os commits *TinaCMS content update* / *Update from TinaCMS* vêm daí). Antes de trabalhar em local, faz `git pull`, porque o painel faz commits diretamente no `main`.

## Fluxo de dados

```
Painel Tina (/admin)
   │  grava
   ▼
conteudo/<coleção>/*.json      ← fonte de verdade do conteúdo
   │  node scripts/gerar.mjs
   ▼
public/<coleção>/<coleção>.css  + cópia dos JSON   (gerado, ignorado no git)
public/tag/<etiqueta>.<ext>     ← cópia do ficheiro do Media Manager escolhido em cada etiqueta
public/index.html               ← página inicial com os links de tudo
   │  GitHub Actions → GitHub Pages
   ▼
https://<owner>.github.io/AMEDAS/                        (página inicial)
https://<owner>.github.io/AMEDAS/<coleção>/<coleção>.css
   │  <link rel="stylesheet">
   ▼
libs React (outros repositórios): var(--color--primary), var(--main-btn-radius)…  (marca: data-config="…")
```

- **Em produção:** o painel publicado grava através do **TinaCloud**, que faz commit no GitHub. Esse commit dispara `.github/workflows/pages.yml`, que corre `npm run build` (o build do Tina mais o `gerar.mjs`) e publica a pasta `public/`.
- **Em local:** o `npm run dev` grava diretamente no disco e **não** gera o CSS (ver [Pontos de falha](#pontos-de-falha)).

## Mapa de ficheiros

| Caminho | Papel |
|---|---|
| `tina/config.ts` | Entrada do Tina: lista de coleções, `basePath`, media, credenciais (vindas do ambiente) e o `cmsCallback`, que regista as páginas do guia. |
| `tina/colecoes/*.ts` | Uma coleção por ficheiro. Definem a pasta, o formato, as permissões (`allowedActions`) e os templates ou campos. |
| `tina/templates/*.ts` | Templates: os "tipos de documento" dentro de uma coleção. Cada JSON indica o seu em `_template`. |
| `tina/campos.ts` | Funções partilhadas que criam campos: `px`, `rgba`, `claroEscuro`, `tamanhos`, `descricao`, `slug`, `nomeUnico`, `nomeFicheiro`. Os campos novos devem usar estas funções. Tem também a constante `PAGES` (URL do Pages), usada pelo guia e pelo link das etiquetas. |
| `tina/componentes/corRgba.ts` | Componentes React próprios para cores rgba: `CorRgba` e `CorHerdavel`, para as cores que se podem herdar da base (ver [Cores](#cores-e-tema-escuro)). |
| `tina/guia.ts` | Páginas do guia no menu do painel (ver [Guia no painel](#guia-no-painel)). |
| `tina/componentes/linkEtiqueta.ts` | Componente `LinkEtiqueta`, que mostra o link publicado de cada etiqueta, e as funções `extensao` e `nomeDoFicheiro` (ver [Etiquetas](#etiquetas)). |
| `tina/componentes/blocos.ts` | Componente React próprio para o `contentBlock` dos Elementos: uma secção por idioma, com o idioma em cima, os blocos (tipo e conteúdo) e os grupos de blocos à esquerda e um cartão de pré-visualização à direita (ver [Elementos](#elementos-e-idiomas)). |
| `README.md` | Apresentação do projeto para pessoas (o que publica, como se usa, comandos). Atualiza-o quando mudar o que é publicado. |
| `tina/tina-lock.json` | Schema compilado. É **gerado** pelo `tinacms dev` (o `build:local` não o atualiza), mas **tem de ir para o git**, porque o TinaCloud lê o schema a partir dele. |
| `tina/__generated__/` | Cliente e tipos gerados. Ignorado no git; nunca se edita à mão. |
| `conteudo/` | Os JSON editados pelo Tina. |
| `scripts/gerar.mjs` | Converte JSON em CSS e copia os JSON para `public/`. É a única lógica de negócio do repositório. |
| `scripts/pagina-inicial.mjs` | HTML da página inicial (ver [Página inicial](#página-inicial)). Chamada no fim do `gerar.mjs`. |
| `public/uploads/` | Imagens carregadas pelo Media Manager. Ficam no git. |
| `public/admin/`, `public/<coleção>/`, `public/index.html` | Gerados (o painel, o CSS, os JSON, as etiquetas e a página inicial). Ignorados no git. |
| `.github/workflows/pages.yml` | Build e deploy para o GitHub Pages, com Node 24. |

## Coleções

| Coleção (`name`) | Pasta | Ficheiros | Estrutura | Saída em `public/` |
|---|---|---|---|---|
| `tokens` (Tokens) | `conteudo/tokens/` | Fixos: `colors.json` e `text.json`. Não se pode criar nem apagar (as configurações de cores dentro do `colors.json`, sim) | Templates: `colors`, `text` | `tokens/tokens.css` + JSON |
| `button` (Botões) | `conteudo/button/` | Fixos: `mainButton.json`, `secondaryButton.json`, `navButton.json` | Templates: `mainButton`, `secondaryButton`, `navButton` | `button/button.css` + JSON |
| `element` (Elementos) | `conteudo/element/` | **Livres**: criar e apagar permitido, sem pastas. Nome com `A-Z a-z 0-9 - _` | `fields` (sem templates): `items[]` com `{ name, contentBlock[] }`; cada `contentBlock` é `{ language, contents[] }` e cada bloco de `contents` é `{ type, content }` ou um grupo `{ type: 'group', contents[] }` | `element/*.json` + `index.json` (sem CSS) |
| `tag` (Etiquetas) | `conteudo/tag/` | Fixo: `tags.json`. As etiquetas acrescentam-se e apagam-se dentro dele | `fields` (sem templates): `items[]` com `{ name, file, description? }` | `tag/<slug(name)>.<extensão>` (cópia do ficheiro) + `index.json` |

A **fonte de verdade da forma de cada JSON** são os templates e as coleções em `tina/`. O `gerar.mjs` tem de corresponder a eles; ver [Duas fontes de verdade](#1-duas-fontes-de-verdade-schema-e-gerador).

### Cores e tema escuro

- **Todas as cores são strings `rgba(r, g, b, a)`.** O seletor de cor do Tina (`ui.component: 'color'`) grava sempre `a: 1` e não tem controlo de opacidade. Por isso os campos de cor usam `rgba()` de `tina/campos.ts`, com o componente `CorRgba`: pré-visualização com fundo aos quadrados, seletor, opacidade e caixa de texto, validados pela regex de `parseRgba`. Mantém este componente em todas as cores novas.
- **Configurações:** o `colors.json` continua a ser um ficheiro fixo, mas guarda uma lista `configurations[]` (uma por marca ou produto) que quem edita pode aumentar ou reduzir à vontade:
  ```json
  { "configurations": [ { "name": "Default", "background": { "light": "…", "dark": "…" }, "h1": { … }, "custom": [ … ] } ], "_template": "colors" }
  ```
  - As cores de cada configuração (`background`, `text`, `h1`…`h5`, `primary`, `secondary`, `tertiary`, `separator`) estão na constante `PARES`, que existe em `tina/templates/colors.ts` (com as etiquetas, exportada para o guia) e em `scripts/gerar.mjs`. **Têm de ficar iguais.** Ao acrescentar uma cor a `PARES`, acrescenta-a também à base no `colors.json`.
  - O `name` é obrigatório e único entre todas as configurações (`nomeUnico`, comparado pelo slug). O slug dá o prefixo das variáveis e o valor de `data-config`, por isso mudar o nome obriga as apps a mudar também.
- **Base e herança:** a **primeira configuração da lista é a base** (hoje, `Default`). Tem todas as cores e aplica-se por omissão.
  - Nas outras, uma cor (par claro/escuro) pode ficar vazia: **herda a da base**. O par herda-se inteiro: ou as duas metades estão preenchidas, ou nenhuma. No JSON, uma cor herdada vem sem a chave ou com `""` nas duas metades.
  - Uma configuração nova criada com **+** começa sem cores, com tudo herdado (`defaultItem`: `novaConfiguracao` no `colors.ts`).
  - As cores personalizadas **não** se herdam.
  - Os valores da Arva Vare foram mantidos todos, mesmo os iguais aos da base. Quem edita é que decide quais passam a herdados.
- **No painel:** `claroEscuro(name, label)` (em `campos.ts`) cria os pares com o componente `CorHerdavel` (em `corRgba.ts`).
  - Numa configuração que não é a base, uma cor vazia mostra "Herdada de …" com a cor da base, e o botão **✎ Definir cor própria** copia-a. Uma cor definida tem o botão **↺ Herdar de …**, que apaga as duas metades. Enquanto a caixa de texto tem o foco, o editor fica visível mesmo vazio.
  - Validação: o `validate` de cada metade exige-a na base (caminho `configurations.0.…`) e bloqueia um par só com uma metade. O `baseCompleta` (no `validate` da lista `configurations`) apanha uma base incompleta mesmo que os submenus nunca tenham sido abertos, por exemplo depois de apagar ou mover a primeira configuração.
- **No CSS** (`tokens.css`), com `p = --color--<slug(configuração)>--`:
  - cada par gera `<p><k>-light` e `<p><k>-dark` com os valores (ex.: `--color--default--h1-light`). Numa cor herdada, os valores são `var(<base><k>-light)` e `var(<base><k>-dark)`, por isso todas as variáveis têm sempre valor;
  - e gera `<p><k>` (ex.: `--color--default--h1`), que aponta para a versão clara no `:root` e para a escura em `@media (prefers-color-scheme: dark)` (exceto com `data-theme="light"`) e em `:root[data-theme="dark"]`;
  - **nomes neutros:** no fim do CSS, cada configuração tem uma regra `[data-config="<slug>"] { --color--<k>: var(<p><k>); … }` (e `--color--custom-<nome>` para as suas personalizadas). A regra da base tem também o seletor `:root`. **As libs usam os nomes neutros** (`var(--color--primary)`), e a app escolhe a configuração com `data-config` num contentor. Vale o contentor mais próximo. As variáveis com prefixo continuam disponíveis para fixar uma marca específica.
  - A herança resolve-se nas variáveis com prefixo, nunca omitindo a regra neutra. Se a regra neutra de uma configuração omitisse uma cor, essa cor viria do `data-config` do elemento pai, e não da base.
- **As cores personalizadas** (`custom[]`, uma lista dentro de cada configuração) geram `<p>custom-<slug(name)>` (ex.: `--color--default--custom-blood`), uma só cor, sem versão escura. O nome só tem de ser único dentro da sua configuração. O campo `description` é só para orientação de quem edita e **não vai para o CSS**.
- **Os botões não têm cores.** Só têm medidas (tamanhos, espaçamentos, arredondamento, espessuras) e o ícone. As cores vêm sempre dos Tokens.

### Tamanhos de texto

O `text.json` (template `text`) guarda tamanhos em px:
- **Fixos**, entre 1 e 450: `h1Size`, `h2Size`, `h3Size`, `h4Size`, `paragraphSize` e `mainContentSize`. No CSS geram `--font-size-h1` … `--font-size-h4`, `--font-size-paragraph` e `--font-size-main-content`. O mapa chave → variável está na constante `TEXTOS` do `gerar.mjs`.
- **Personalizados** (`customSizes[]`), entre 0 e 450: `{ name, size, description? }`. Geram `--font-size-custom-<slug(name)>`. Como nas cores, o `name` é obrigatório e único (`nomeUnico`) e a `description` não vai para o CSS.
- **Os nomes das chaves têm o sufixo `Size`** porque o template `colors` tinha `h1`…`h4` e `custom` como objetos, antes de passarem para dentro de `configurations[]`; ver [Campos com o mesmo nome](#15-campos-com-o-mesmo-nome-em-templates-da-mesma-coleção). Mudar os nomes agora obriga a migrar o `text.json` e a constante `TEXTOS`.

### Elementos e idiomas

Cada ficheiro em `conteudo/element/` tem uma lista de elementos (publicado em `https://projectsav.github.io/AMEDAS/element/<ficheiro>.json`). Em TypeScript:
```ts
type TextContent = { type: 'text' | 'title' | 'eyebrow' | 'subtitle' | 'item' | 'quote'; content: string }
type GroupContent = { type: 'group'; content?: string; contents: TextContent[] }
type Content = TextContent | GroupContent
type ContentBlock = { language: Language; contents: Content[] }
type TextElement = { name: string; contentBlock: ContentBlock[] }
```
```json
{ "items": [
  { "name": "titulo", "contentBlock": [
    { "language": "pt", "contents": [
      { "type": "eyebrow", "content": "Olá" },
      { "type": "title", "content": "Bem-vindo" }
    ] },
    { "language": "en", "contents": [ { "type": "title", "content": "Welcome" } ] }
  ] }
] }
```
- **Um item = um texto em todos os idiomas.** Cada `contentBlock` é a versão num idioma. Os consumidores procuram o item pelo `name` e, dentro dele, o `contentBlock` com o `language` pedido.
- **Mínimos (obrigatórios):** cada item tem **pelo menos um `contentBlock`** e cada `contentBlock` tem **pelo menos um bloco em `contents`**. O painel não deixa apagar o último idioma nem o último bloco de um idioma, e o gerador lança erro se faltarem.
- **`name`:** texto obrigatório (etiqueta "Nome") e **único no ficheiro** (comparado sem espaços nas pontas). Chama-se "Nome" no painel para não se confundir com o bloco do tipo `title` ("Título").
  - No painel, o `nomeValido` (`ui.validate` do `name`, em `element.ts`) mostra *"Escreve um nome"* ou *"Já existe um elemento com este nome"* e bloqueia a gravação. Encontra os irmãos pelo caminho do campo (`items.2.name` → `items`).
  - O `gerar.mjs` volta a verificar (objeto `verificar`, por coleção `soJson`) e lança erro, o que faz parar o deploy se o JSON for editado fora do painel.
- **`contentBlock[].language`:** obrigatório e **único no item** (cada idioma aparece uma só vez). Os valores são `default`, `en`, `pt`, `es`, `fr`, `it`, `de`, `sv`, `ru`, `pl`, `no`, `ja`. A lista, com as etiquetas em português, está na constante `IDIOMAS` em `tina/colecoes/element.ts`, que é a única fonte de verdade.
  - `default` **não é um código de idioma**: significa "sem idioma específico, serve para todos". Os consumidores devem usá-lo como fallback quando não houver um `contentBlock` no idioma pedido.
  - Os códigos seguem ISO 639-1 (`no` = norueguês, `sv` = sueco, `ja` = japonês).
- **`contentBlock[].contents[]`:** pelo menos um bloco, no idioma do seu `contentBlock`. Cada bloco é de texto (`{ type, content }`) ou um grupo (`{ type: 'group', contents[] }`).
  - **`type` dos blocos de texto:** `title`, `text`, `eyebrow`, `subtitle`, `item` ou `quote`. A lista, com as etiquetas em português (Título, Texto, Antetítulo, Subtítulo, Item de lista, Citação), está na constante `TIPOS` em `tina/colecoes/element.ts`. O `gerar.mjs` tem a mesma lista em `TIPOS_BLOCO`: **têm de ficar iguais**.
  - **Repetíveis:** os tipos em `REPETIVEIS` (hoje só `item`) podem repetir-se, e a ordem deles no array é a ordem da lista. Os outros tipos de texto aparecem no máximo uma vez em cada idioma e uma vez em cada grupo. `REPETIVEIS` existe em `element.ts` e no `gerar.mjs`: **têm de ficar iguais**.
  - **Grupos:** um bloco `{ type: 'group', contents: [...] }` junta blocos de texto relacionados, por exemplo uma pergunta (`subtitle`) e a resposta (`text`). O valor `'group'` está na constante `GRUPO`, em `element.ts` e no `gerar.mjs` (**iguais**).
    - Pode haver vários grupos por idioma, em qualquer posição; a ordem dos grupos no array é a ordem deles. Cada grupo tem **pelo menos um bloco**, e dentro dele valem as mesmas regras de tipos.
    - **Um nível só:** um grupo não tem grupos. O Tina não aceita schemas recursivos, por isso o campo `contents` do grupo (etiqueta "Blocos do grupo") só tem `type` e `content`.
    - O painel grava o grupo **sem** `content`. No schema, o `type` do primeiro nível tem as opções `TIPOS` + `group`; o dos blocos do grupo, só `TIPOS`.
  - **Compatibilidade:** o Seara (`~/Documentos/Seara`) e a Arva Webpage (`ProjectCard.tsx`) leem os textos com `contents.find((c) => c.type === 'title')`, que só olha para o primeiro nível: nunca apanha um bloco de dentro de um grupo, e ignora os tipos que não procura (`group`, `item`…). **Não mudes** a forma `{ type, content }` dos blocos de texto nem o `content` para algo que não seja string, e mantém o `name` em todos os itens: o Seara faz `x.name.toLowerCase()` a todos os itens do ficheiro.
  - **`content`:** texto livre, editado numa caixa de várias linhas.
- **No painel**, o `contentBlock` não abre formulários à parte como as outras listas do Tina. O componente `blocos(TIPOS, IDIOMAS, REPETIVEIS, GRUPO)` (`tina/componentes/blocos.ts`, no `ui.component` do campo `contentBlock`) mostra uma secção (cartão branco) por `contentBlock`, todas seguidas, para se ver tudo com scroll. Cada secção tem:
  - um cabeçalho com "Idioma N" e o botão **✕ Apagar idioma**, que apaga o `contentBlock` e se desativa quando só há um;
  - o seletor do **Idioma** a toda a largura. Os idiomas que já têm secção aparecem desativados;
  - por baixo, à esquerda (num fundo cinzento claro), os blocos pela ordem do array:
    - um bloco de texto por linha: seletor do **Tipo**, caixa do **Conteúdo** e botão **✕**, que se desativa quando a lista (do idioma ou do grupo) só tem um bloco. Os itens de lista têm também **↑** e **↓**, que os trocam com o item anterior ou o seguinte da mesma lista. Os tipos não repetíveis já usados noutro bloco da mesma lista aparecem desativados;
    - cada grupo numa caixa branca com "Grupo N" (N conta os grupos pela ordem), **↑ ↓** (troca com o grupo anterior ou seguinte), **✕ Apagar grupo** (desativa-se se a secção ficasse sem blocos), as linhas dos seus blocos e **+ Acrescentar bloco ao grupo**;
    - no fim, **+ Acrescentar bloco** e **+ Acrescentar grupo** (contorno tracejado). Um bloco novo tem o primeiro tipo não repetível ainda livre na sua lista ou, se já houver todos, `item`. Um grupo novo fica no fim, com um bloco `title`;
  - à direita, a pré-visualização. Quando o painel é estreito, passa para baixo dos blocos (`flexWrap`).
  - No fim da lista, o botão **+ Acrescentar idioma** (a toda a largura, com contorno tracejado) cria um `contentBlock` com o primeiro idioma de `IDIOMAS` que ainda não tem secção e um bloco do primeiro tipo de `TIPOS` (`title`). Desativa-se quando todos os idiomas têm secção.
  - Um `contentBlock` sem `language` (editado fora do painel) aparece com o seletor em *Escolhe o idioma*.
  - Os campos `language`, `contents`, `type` e `content` declarados em `fields` continuam a definir a forma do JSON e da API GraphQL; o componente só muda o aspeto.
- **Pré-visualização:** cada secção tem um cartão com os blocos desse idioma, que se atualiza enquanto se escreve. Para não parecer parte do formulário, o cartão está dentro de uma moldura de janela: uma barra escura com três pontos, "Pré-visualização" e "ao vivo"; um fundo ponteado; e, no fim, uma nota a dizer que é só para orientação. A ordem é sempre a da constante `ORDEM` de `blocos.ts` (antetítulo, título, subtítulo, texto, itens, grupos e citação), seja qual for a ordem dos blocos; dentro de cada grupo, igual. Os itens aparecem numa lista com marcadores e os grupos em caixas com contorno, pela ordem deles. Os tipos sem bloco não aparecem, e um bloco vazio mostra o nome do tipo a cinzento e em itálico. O aspeto de cada tipo está na constante `ESTILOS` de `blocos.ts`. É só uma ajuda visual com estilos fixos (o antetítulo usa o laranja do Tina): não usa os Tokens nem grava nada, e as libs podem mostrar o conteúdo de outra forma. Um tipo novo que não esteja em `ESTILOS` aparece no fim, com o estilo do texto.
- **Validação:** o `idiomasValidos` (`ui.validate` do `contentBlock`) bloqueia a gravação sem idiomas, com um idioma vazio ou repetido, com um idioma sem blocos, com um bloco sem tipo, com um tipo não repetível repetido na mesma lista, com um grupo vazio ou com um grupo dentro de um grupo (função `blocosValidos`). O `gerar.mjs` volta a verificar (`verificarBlocos`: sem idiomas, idioma em falta ou repetido, idioma ou grupo sem blocos, tipo fora de `TIPOS_BLOCO`, grupo dentro de grupo, tipo repetido) e lança erro.
- **Valores iniciais (`defaultItem`):** um item novo criado com **+** começa com nome vazio e um `contentBlock` no idioma `default` com um bloco `text` vazio.
- **Na lista do painel:** cada item aparece com o `name`.

### Etiquetas

Uma etiqueta é um nome fixo que aponta para um ficheiro do Media Manager, para que o link desse nome não mude quando se troca o ficheiro (ex.: vários favicons carregados e uma etiqueta "Favicon" que escolhe o que está em uso). Funciona com qualquer tipo de ficheiro do Media Manager. O número de etiquetas é livre (pode não haver nenhuma) e os ficheiros sem etiqueta continuam publicados só em `uploads/<ficheiro>`.

- **Porque é uma coleção:** o Media Manager do Tina não tem API para acrescentar campos ou ações. As etiquetas vivem na coleção `tag` (`tina/colecoes/tag.ts`) e o campo `file` (`type: 'image'`, sem `accept`) abre o Media Manager para escolher ou carregar o ficheiro. Sem `accept`, o Media Manager mostra todos os tipos de ficheiro.
- **JSON** (`conteudo/tag/tags.json`, ficheiro fixo):
  ```json
  { "items": [ { "name": "Favicon", "file": "/uploads/favicons/natal.png", "description": "…" } ] }
  ```
  - `name`: `nomeUnico` (obrigatório e único pelo slug).
  - `file`: o caminho que o Tina grava, `/uploads/<ficheiro>` (o TinaCloud converte o URL `assets.tina.io` que o painel mostra para este caminho ao gravar). O `validate` exige ficheiro com extensão.
  - `link`: campo só de leitura (componente `LinkEtiqueta`) que mostra `PAGES/tag/<slug(name)>.<extensão>` com um botão Copiar, atualizado enquanto se escreve (subscreve o formulário). Não é gravado.
  - `description`: só para quem edita; não é publicada.
  - Na lista do painel, cada item aparece como `<nome> → <ficheiro>`.
- **No gerador** (bloco das etiquetas no fim do `gerar.mjs`): apaga e recria `public/tag/`, copia cada ficheiro para `public/tag/<slug(name)>.<extensão em minúsculas>` e escreve `public/tag/index.json`, uma lista `[{ name, file, source }]` (`file` = nome publicado em `tag/`, `source` = caminho em `/uploads/`). Lança erro (e o deploy para) com nome vazio ou repetido, ficheiro em falta, sem extensão, fora de `public/uploads/` ou que não existe.
- **O link** é `https://projectsav.github.io/AMEDAS/tag/<slug(name)>.<extensão>`. A extensão faz parte do link para o Pages servir o `Content-Type` certo (um ficheiro sem extensão sai como `application/octet-stream`, e os browsers não mostram SVG assim). Por isso, trocar o ficheiro por outro com outra extensão muda o link.

### Página inicial

O `gerar.mjs` escreve `public/index.html`, a página de `https://projectsav.github.io/AMEDAS/` (sem ela, o Pages dá 404). Tem:
- **um botão "Abrir o painel"**, que aponta para `admin/`;
- **uma secção por coleção**, montada a partir do que o gerador publicou nessa corrida. As coleções com CSS listam primeiro o CSS e depois cada JSON; as coleções `soJson` listam o `index.json` e cada ficheiro; as Etiquetas listam o `tag/index.json` e cada etiqueta (pelo `name`). Cada linha tem o URL, "Abrir" e "Copiar link".

Os nomes das linhas (ex.: "Tokens · Cores") são as etiquetas do painel (`label` da coleção e do template), lidas do `tina/tina-lock.json`. Se uma etiqueta não estiver no lock, aparece o nome técnico (`tokens`, `colors`). Nos `soJson`, a linha usa o nome do ficheiro.

Os URLs mostrados são absolutos com `BASE_URL` (no CI) e relativos sem ele (em local). Os links da página são sempre relativos, por isso funcionam nos dois casos.

**O aspeto imita o painel do Tina:** só tema claro, laranja `#ec4815` / `#c2410c` / `#fff7ed`, os cinzentos do admin, a fonte Inter (Google Fonts) e botões redondos com sombra leve. As cores estão como variáveis no `:root` do `pagina-inicial.mjs`. Foram tiradas do CSS compilado do painel, `public/admin/assets/*.css` (classes `bg-tina-orange*` e `*-gray-*`); se uma atualização do `tinacms` mudar a paleta, vai lá buscar os valores novos. A página não usa o logótipo do Tina: o quadrado laranja com "A" é próprio.

### Guia no painel

O `tina/guia.ts` acrescenta ao menu do painel, na secção *Site*, as páginas **Guia: Começar**, **Cores**, **Tamanhos de texto**, **Botões**, **Elementos** e **Etiquetas**, para quem usa o que o AMEDAS publica. São *screen plugins* do Tina, registados no `cmsCallback` do `tina/config.ts`, e o URL é `#/screens/<slugify do nome>` (o Tina tira acentos e símbolos: `guia_cores`, `guia_botes`).
- **Ao vivo:** as listas de variáveis e de ficheiros leem o que está publicado (`tokens.css`, `button.css`, `element/index.json`, `tag/index.json`), primeiro ao lado do painel (`../`) e, se falhar, no Pages. Na porta 4001 do `tinacms dev` usam o Pages; na 3000 usam o `public/` local. A página das Cores aplica o `tokens.css` enquanto está aberta, para as amostras e o exemplo com `data-config`.
- **Escrito à mão:** os textos e os exemplos de código (nomes de variáveis, forma do JSON, URLs). **Ao mudar nomes de variáveis, a forma de um JSON ou o que é publicado, atualiza também o `guia.ts`.** As etiquetas vêm de `PARES`, `IDIOMAS` e `TIPOS`.

### Convenções de nomes

- **Chaves JSON e nomes de campos em inglês** (`fontSize`, `borderWidth`); **etiquetas e descrições do painel em português de Portugal**.
- **Variáveis CSS:** `--color--*` (nomes neutros, os que as libs usam), `--color--<configuração>--*` e `--font-size-*` para os tokens, e `--main-btn-*`, `--secondary-btn-*`, `--nav-btn-*` para os botões. Os números saem em `px`.
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
   - **Outra saída** (como as Etiquetas, que copiam ficheiros): um bloco próprio antes de escrever a página inicial, que acrescenta a sua secção a `seccoes`.
4. Acrescenta `public/<nome>` ao `.gitignore`.
5. **Verificação:**
   - a coleção aparece no menu do painel e na API;
   - a coleção aparece em `public/index.html`, com a etiqueta do painel (corre o `tinacms dev` antes, para o lock a ter);
   - `public/<nome>/` é gerado;
   - `git status` não mostra `public/<nome>`.
   - o `tina/tina-lock.json` tem a coleção (`grep '"name":"<nome>"' tina/tina-lock.json`) e vai no mesmo commit.

### Verificar o painel sem browser humano
O painel pode ser conduzido com Chromium headless e o protocolo CDP: o `Runtime.evaluate` dá para clicar e o `Input.insertText` para escrever. Abrir um formulário: `http://localhost:4001/AMEDAS/admin/index.html#/collections/edit/<coleção>/<ficheiro-sem-extensão>`.

Detalhes:
- em modo local aparece um modal; carrega primeiro em `[data-test="enter-edit-mode"]`;
- o Chromium do snap só lê e escreve dentro de `~/snap/chromium/common/`;
- sem `Emulation.setFocusEmulationEnabled`, o `focus()` não dispara eventos de foco no modo headless;
- o painel guarda o estado do formulário (submenus abertos, alterações por gravar) entre navegações por `#`. Para recomeçar do zero, navega primeiro para `about:blank`. O `history.back()` pode voltar a uma página antiga em cache; navega pelos botões do próprio painel;
- as páginas do guia abrem em `#/screens/<nome>` (ver [Guia no painel](#guia-no-painel));
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
- **Nomes repetidos** (`configurations[]` e o `custom[]` de cada uma, nas cores, e `customSizes[]` no texto): o `nomeUnico(lista, mensagem)` bloqueia a gravação com nomes que dão o mesmo slug.
  - Os irmãos encontram-se pelo caminho do campo que o Tina passa ao `validate` (`meta.name`, ex.: `configurations.0.custom.2.name` → `configurations.0.custom`). É isso que faz funcionar a validação em listas dentro de listas. O argumento `lista` só se usa se faltar o caminho.
  - O gerador volta a verificar (nenhuma configuração, configurações repetidas ou sem nome, cores repetidas numa configuração, cor de `PARES` em falta na base, par só com uma metade) e lança erro, o que faz parar o deploy se o JSON for editado fora do painel.
- **Sem versão escura nem herança:** as cores personalizadas não têm versão escura nem se herdam da base. Dentro de um `data-config` cuja configuração não tem uma certa cor personalizada, `var(--color--custom-<nome>)` vem do `data-config` acima (ou do `:root`), ou fica vazia.

### 8. Permissões só no painel
O `allowedActions` só esconde botões no painel. Pelo git, ou pela API GraphQL, continua a ser possível criar ou apagar ficheiros nas coleções fixas.

Se um ficheiro fixo desaparecer, o gerador simplesmente não o inclui: as variáveis somem do CSS sem erro. Se aparecer um `_template` desconhecido, o gerador lança erro.

Com `delete: false`, a opção **Rename** também desaparece; no código do Tina, depende do `delete`.

### 9. Coleção Elementos
- **Ficheiro sem elementos:** é gravado como `{}`, sem `items`. Os consumidores devem tratar a falta de `items` como `[]`.
- **Campos vazios:** um `content` vazio pode ser omitido em vez de gravado como `""` (os grupos vêm sempre sem `content`). Cada item tem sempre `name` e pelo menos um `contentBlock`; cada `contentBlock` tem `language` e pelo menos um bloco em `contents`, e cada bloco tem `type` (o painel e o gerador exigem-no).
- **Acrescentar um tipo de bloco:** acrescenta-o a `TIPOS` em `element.ts` e a `TIPOS_BLOCO` no `gerar.mjs` (e a `REPETIVEIS` nos dois, se se puder repetir), e o seu aspeto a `ESTILOS` em `blocos.ts`. Os tipos repetíveis aparecem na pré-visualização como lista com marcadores. Acrescentar tipos não parte os consumidores atuais, porque procuram os blocos pelo `type`. Atualiza também o tipo `TextContent` do Seara. Remover um tipo faz o gerador rejeitar os blocos que o usam: antes, procura `"type": "<tipo>"` em `conteudo/element/`.
- **Nome do ficheiro:**
  - O Tina só aceita `a-z A-Z 0-9 - _ . /` (regex `RELATIVE_PATH_REGEX` em `@tinacms/schema-tools`). Espaços nunca são aceites.
  - O `ui.filename.parse` é `nomeFicheiro()` de `tina/campos.ts`: tira acentos, troca espaços e `/` por `-` e remove o resto, incluindo `.`. Mantém maiúsculas, `-` e `_`. A `/` fica de fora porque criaria pastas.
  - O `parse` corre **a cada tecla**, no "Create New" e no Rename. Por isso não pode aparar `-` nas pontas nem transformar caracteres que se escrevem a meio do nome: o antigo `slug()` apagava o `-` final e não deixava escrever `a-b`. Não voltes a usar `slug()` aqui.
  - O campo aparece primeiro no formulário (`showFirst`), com uma descrição em português (`ui.filename.description`, interpretada como HTML).
  - Um nome só com símbolos dá uma string vazia, e o Tina responde *Required*.
  - **Maiúsculas:** `Menu.json` e `menu.json` são ficheiros diferentes no Linux e no Pages (os URLs distinguem maiúsculas), mas colidem num clone em macOS ou Windows. Quem consome tem de pedir o nome exato.
- **Publicação:** o gerador apaga `public/element/` e recria-o (para refletir ficheiros apagados) e escreve `index.json`, porque o Pages não lista pastas.
- **`language` em falta:** um `contentBlock` editado fora do painel pode não ter `language`. O painel mostra o seletor com *Escolhe o idioma* e o `idiomasValidos` não deixa gravar; o gerador lança erro.
- **Acrescentar ou remover um idioma:** muda só a constante `IDIOMAS`. Remover um código deixa os elementos que já o usam com um valor que o seletor não mostra; antes de remover, procura `"language": "<código>"` em `conteudo/element/`.
- **Histórico da forma (2026-10-12 a 2026-10-22), para quem consome:**
  1. A coleção chamava-se `elementos` (pasta `conteudo/elementos/`, publicada em `/AMEDAS/elementos/`) e cada elemento tinha `type` em vez de `title`. Na API GraphQL a query passou a `elementConnection`.
  2. Depois, cada elemento deixou de ter `content` e `language` diretos e passou a ter `contents[]`. Na migração, os elementos com o mesmo `title` no mesmo ficheiro juntaram-se num só (ex.: o `titulo` pt e en do `exemplo.json`).
  3. Depois, cada conteúdo deixou de ter `content` direto e passou a ter `blocks[]` com `{ type, content }`. Na migração, cada `content` passou a ser um bloco `text`.
  4. Depois, o `title` de cada elemento passou a chamar-se `name` (o valor manteve-se).
  5. Depois (2026-10-13), a forma ficou plana: cada `contents[i]` com `{ language, blocks[] }` passou a ser um item próprio `{ name, language, contents }`, em que `contents` são os antigos `blocks`. Na migração, um elemento com N idiomas deu N itens com o mesmo `name`.
  6. Depois (2026-10-13, commit `97a0a2d`), o idioma passou do item para cada bloco: `{ name, contents: [{ language, type, content }] }`. Na migração, os itens com o mesmo `name` no mesmo ficheiro juntaram-se num só.
  7. Depois (2026-10-13), os blocos passaram a ficar agrupados por idioma: `{ name, contentBlock: [{ language, contents: [{ type, content }] }] }`. Na migração, os blocos de cada item juntaram-se num `contentBlock` por idioma.
  8. Depois (2026-10-22), sem migração: os tipos de texto `subtitle`, `item` (repetível) e `quote`, e os grupos `{ type: 'group', contents[] }`. A forma dos blocos de texto não mudou e os JSON existentes continuam válidos. Houve uma versão intermédia, nunca publicada, com um `group` numérico em cada bloco: os JSON com `"group": 1` vêm de testes locais e não são grupos.
  Os JSON existentes foram migrados. Quem ainda lê `elementos/`, `item.type`, `item.title`, `item.content`, `item.language`, `item.contents` ou `contents[].blocks` deixa de encontrar os dados; agora o idioma está em `item.contentBlock[].language` e o texto em `item.contentBlock[].contents[].content`.
- **Nome único:** o `name` não se repete; um texto em vários idiomas é um só item com um `contentBlock` por idioma.

### 10. Texto nas descrições
- **`description` dos campos:** o Tina interpreta-a como HTML, e `<nome>` desaparece. Escreve exemplos sem `<…>`.
- **`descricao(texto)`:** é um campo só de leitura que não grava valor. Não uses `descricao` como nome de um campo real no mesmo template.

### 11. Marca do painel removida
O painel usa o aspeto original da Tina. Houve uma personalização (`tina/marca.ts`, chamada pelo `cmsCallback` no `config.ts`, que hoje só regista o guia) que injetava CSS sobre classes internas do Tina (`fill-tina-orange`, `bg-tina-orange-dark`). O utilizador retirou-a.

Pede confirmação ao utilizador antes de a voltar a pôr. Se a voltares a pôr, confirma o aspeto depois de cada atualização do `tinacms`, porque as classes internas podem mudar. O ecrã de login do TinaCloud não é personalizável.

Um `import` de um ficheiro que já não existe em `tina/config.ts` faz falhar o `tinacms dev` e o `build` (*Could not resolve*). Ao apagar um ficheiro de `tina/`, procura os `import` que apontam para ele.

### 12. Ambiente
- **Node:** em local é o 26; o CI usa o 24; o `create-tina-app` exige o 22 ou o 24. Se algo da CLI do Tina falhar só em local, experimenta o Node 24.
- **npm 11:** bloqueia os scripts de instalação de `esbuild`, `better-sqlite3` e `core-js`. Não foram aprovados e tudo funciona; aprova-os (`npm install-scripts approve <pkg>`) só se aparecer um erro relacionado.
- **GitHub Pages:** num repositório privado exige um plano pago, e o site publicado (CSS, JSON, imagens, `/admin`) é **público**. O `/admin` exige login do TinaCloud.

### 13. Do lado das libs
O componente Button do projeto irmão `~/Secretária/Button-Tina` ainda lê `--btn-primary-bg`, `--btn-radius`, etc., nomes que este repositório já não gera. As libs têm de passar a ler os nomes neutros `--color--*` (a app escolhe a marca com `data-config`), `--font-size-*` e `--<tipo>-btn-*`. As antigas `--color-<k>` (com um só hífen) também já não existem.

Estados como `:hover` e o sublinhado da página ativa não funcionam com estilos inline (`style={{…}}`): precisam de classes CSS na lib.

Os Elementos leem-se com o **Seara** (`~/Documentos/Seara`, repositório privado `ProjectsAV/Seara`, pacote `@arva/seara`), um cliente TypeScript. O `src/types.ts` dele espelha a forma do JSON (`TextContent`, `GroupContent`, `ContentBlock`…). **Ao mudar a forma ou os tipos dos Elementos, atualiza também o Seara** e lança uma versão nova (`npm version minor` e `git push --follow-tags`; o GitHub Action publica a tag `build-vX.Y.Z`). A Arva Webpage (`~/Documentos/Arva Webpage`) usa o Seara.

### 14. Restos no repositório
- **`conteudo/nav/`:** pasta vazia, criada pelo painel quando ainda era permitido criar pastas. O git ignora-a.
- **`conteudo/`:** contém dados reais de quem edita. Altera estes ficheiros só quando a tarefa o pede e mantém os valores existentes.

### 15. Campos com o mesmo nome em templates da mesma coleção
- **Sintoma:** o `tinacms dev` ou o `build` falham com *Fields "h3" conflict because they return conflicting types "TokensColorsH3!" and "Float!"*.
- **Causa:** o Tina junta os templates de uma coleção nas mesmas queries GraphQL. Dois templates podem ter um campo com o mesmo nome só se o tipo for igual; um `object` ou uma lista de objetos tem sempre um tipo próprio por template.
- **O que fazer:** dá ao campo novo um nome distinto (foi por isso que o `text` usa `h1Size` e `customSizes`).

### 16. Etiquetas
- **Ficheiro apagado do Media Manager:** se uma etiqueta aponta para um ficheiro que já não existe, o gerador lança erro e o deploy para (o Pages continua com a versão anterior, por isso o link da etiqueta continua a funcionar). Corrige-se escolhendo outro ficheiro na etiqueta. O Media Manager não avisa ao apagar.
- **Link muda com a extensão:** ver [Etiquetas](#etiquetas). Se for preciso um link sem extensão, teria de ser outra solução (ex.: um ficheiro HTML com redirecionamento, que não serve para `<img>` nem `<link rel="icon">`).
- **Cache:** o Pages deixa o browser guardar os ficheiros até 10 minutos, e os browsers guardam os favicons durante mais tempo.
- **Em local:** a pré-visualização da imagem no campo `file` aparece partida na porta 4001 (ver [ponto 6](#6-basepath-imagens-e-urls)); o link mostrado é sempre o do Pages.
- **`slug()`:** o link no painel (`LinkEtiqueta`) e o ficheiro publicado usam o `slug()` de `campos.ts` e do `gerar.mjs`, que têm de ficar iguais (ver [ponto 7](#7-cores-e-listas-personalizadas)).

## Pendente
1. Decidir o mapeamento das cores e dos tamanhos de texto nas libs, por exemplo, o fundo do botão principal = `--color--primary`. A escolha da configuração já está decidida (`data-config`). Não há token para o texto sobre as cores principal, secundária e terciária.
2. Confirmar em tina.io os limites do plano gratuito (utilizadores, modo editorial).
