import { createElement } from 'react'
import type { TinaField } from 'tinacms'
import { CorRgba, parseRgba } from './componentes/corRgba'

// Funções partilhadas pelas coleções, para não repetir os mesmos campos.

/** Nome → parte de uma variável CSS: "Azul Marca" → "azul-marca". */
export const slug = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Nome de ficheiro escrito no painel: "Página Inicial" → "Pagina-Inicial".
 * Corre a cada tecla (ui.filename.parse), por isso não apara os "-" das pontas: senão "a-b" não se conseguia escrever.
 * Só deixa o que o Tina aceita (a-z, A-Z, 0-9, - e _), sem "/" (criaria pastas) nem ".".
 */
export const nomeFicheiro = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s/]/g, '-')
    .replace(/[^A-Za-z0-9_-]/g, '')

/** Número em px, com limites. */
export const px = (name: string, label: string, min: number, max: number): TinaField => ({
  name,
  label,
  type: 'number',
  required: true,
  description: `Entre ${min} e ${max} px`,
  ui: {
    validate: (value?: number) =>
      value == null || value < min || value > max ? `Entre ${min} e ${max} px` : undefined,
  },
})

/** Nome de um item da lista `lista` (ex.: "custom"): obrigatório e sem nomes que deem o mesmo slug (seriam a mesma variável CSS). */
export const nomeUnico = (lista: string, repetido: string): TinaField => ({
  name: 'name',
  label: 'Nome',
  type: 'string',
  required: true,
  ui: {
    validate: (value?: string, todos?: any) => {
      const s = slug(value ?? '')
      if (!s) return 'Escreve um nome com letras ou números'
      const iguais = (todos?.[lista] ?? []).filter((c: any) => slug(c?.name ?? '') === s).length
      return iguais > 1 ? repetido : undefined
    },
  },
})

/** Cor em rgba (com transparência): seletor + opacidade + caixa de texto. */
export const rgba = (name: string, label: string): TinaField => ({
  name,
  label,
  type: 'string',
  required: true,
  ui: {
    component: CorRgba,
    validate: (value?: string) =>
      parseRgba(value) ? undefined : 'Formato: rgba(vermelho, verde, azul, opacidade), ex.: rgba(37, 99, 235, 1)',
  },
})

/** Par de cores para o tema claro e o tema escuro (abre num submenu). */
export const claroEscuro = (name: string, label: string): TinaField => ({
  name,
  label,
  type: 'object',
  required: true,
  fields: [rgba('light', 'Tema claro'), rgba('dark', 'Tema escuro')],
})

/** Tamanho do texto e espaçamentos, comuns a todos os botões. */
export const tamanhos: TinaField[] = [
  px('fontSize', 'Tamanho do texto', 10, 32),
  px('paddingY', 'Espaço vertical', 0, 40),
  px('paddingX', 'Espaço horizontal', 0, 80),
]

/** Texto fixo de ajuda no topo do formulário. Só de leitura: não é gravado no JSON. */
export const descricao = (texto: string): TinaField => ({
  name: 'descricao',
  label: 'Descrição',
  type: 'string',
  ui: {
    component: () =>
      createElement(
        'p',
        {
          style: {
            margin: '0 0 16px',
            padding: '10px 12px',
            borderLeft: '3px solid #9ca3af',
            background: '#f3f4f6',
            borderRadius: 4,
            color: '#374151',
            fontSize: 14,
            lineHeight: 1.4,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          },
        },
        texto,
      ),
  },
})
