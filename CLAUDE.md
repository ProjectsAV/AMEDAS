# CLAUDE.md

O conhecimento do projeto está no `AGENTS.md`, que o Claude Code carrega sozinho no início da conversa (outras ferramentas, como o Codex e o Cursor, também o procuram por este nome). Este ficheiro só tem as regras de trabalho do Claude.

## Ler o AGENTS.md antes de alterar

1. **Antes da primeira alteração de cada tarefa** (editar, criar, apagar ou mudar o nome de um ficheiro, ou fazer commit), lê o `AGENTS.md` inteiro com a ferramenta Read. Lê-o mesmo que já esteja no teu contexto: a cópia carregada é a do início da conversa, e o ficheiro pode ter mudado entretanto (o painel e outras pessoas fazem commits no `main`, e o `git pull` traz as alterações).
2. **Avisa o utilizador** logo depois de o ler, antes de alterar o que quer que seja, numa linha que comece por **AGENTS.md lido:** e diga as secções que importam para a tarefa.

## Manter o AGENTS.md fiel ao código

O `AGENTS.md` é o mapa do repositório para modelos de linguagem. Tem de descrever o código **tal como está agora**.

1. **Depois de cada alteração** (código, schema do Tina, `scripts/`, `package.json`, workflow, `.gitignore`, forma dos JSON em `conteudo/`), procura no `AGENTS.md` todas as secções que falam do que mudou: mapa de ficheiros, coleções, constantes duplicadas, comandos, receitas, pontos de falha, pendente. Corrige-as na mesma tarefa e no mesmo commit.
2. **Quando o código contradiz o `AGENTS.md`**, mesmo numa parte em que não tocaste, corrige o `AGENTS.md` para corresponder ao código.
3. **Está feito** quando nenhuma frase do `AGENTS.md` contradiz o código e cada ficheiro, constante ou comando que ele nomeia existe.

Formato a manter:
- Cada informação num só sítio: atualiza a secção que já existe e apaga o que deixou de ser verdade.
- A estrutura que já existe: títulos por tema, tabelas para os mapas, receitas que acabam numa **Verificação**, e pontos de falha com sintoma → causa → o que fazer.
- Frases curtas, em português de Portugal. Ficheiros, constantes, campos e comandos em `código`. Datas absolutas (ex.: 2026-10-31).
- Os factos sobre o projeto vão para o `AGENTS.md`. Neste ficheiro ficam só as instruções para o Claude.

## Avisar o utilizador

Sempre que alterares o `AGENTS.md`, diz-o na resposta final, numa linha que comece por **AGENTS.md atualizado:** e indique as secções alteradas e o que mudou em cada uma.
