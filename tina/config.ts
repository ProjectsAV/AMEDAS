import { defineConfig } from 'tinacms'
import { button } from './colecoes/button'
import { elementos } from './colecoes/elementos'
import { tokens } from './colecoes/tokens'

export default defineConfig({
  branch: process.env.GITHUB_BRANCH || 'main',
  // Só necessários com TinaCloud (produção). Em local ficam vazios.
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  // basePath = nome do repositório no GitHub (o Pages serve em /<repo>/).
  build: { outputFolder: 'admin', publicFolder: 'public', basePath: 'AMEDAS' },
  media: { tina: { mediaRoot: 'uploads', publicFolder: 'public' } },
  schema: {
    collections: [tokens, button, elementos],
  },
})
