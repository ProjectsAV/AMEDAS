import { defineConfig } from 'tinacms'
import { button } from './colecoes/button'
import { element } from './colecoes/element'
import { tokens } from './colecoes/tokens'
import { guia } from './guia'

export default defineConfig({
  branch: process.env.GITHUB_BRANCH || 'main',
  // Só necessários com TinaCloud (produção). Em local ficam vazios.
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  // basePath = nome do repositório no GitHub (o Pages serve em /<repo>/).
  build: { outputFolder: 'admin', publicFolder: 'public', basePath: 'AMEDAS' },
  media: { tina: { mediaRoot: 'uploads', publicFolder: 'public' } },
  // Páginas do guia no menu do painel (secção "Site").
  cmsCallback: (cms) => {
    for (const pagina of guia) cms.plugins.add(pagina)
    return cms
  },
  schema: {
    collections: [tokens, button, element],
  },
})
