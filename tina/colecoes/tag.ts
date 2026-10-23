import type { Collection } from 'tinacms'
import { descricao, nomeUnico } from '../campos'
import { extensao, LinkEtiqueta, nomeDoFicheiro } from '../componentes/linkEtiqueta'

// Etiquetas: nomes fixos que apontam para um ficheiro do Media Manager (ex.: "favicon" → /uploads/favicon-natal.png).
// O scripts/gerar.mjs publica cada uma em tag/<slug(nome)>.<extensão>, um link que não muda quando se escolhe
// outro ficheiro. O Media Manager do Tina não se pode estender, por isso as etiquetas vivem nesta coleção.
// Ficheiro fixo (conteudo/tag/tags.json) com a lista items[] { name, file, description? }.
export const tag: Collection = {
  name: 'tag',
  label: 'Etiquetas',
  path: 'conteudo/tag',
  format: 'json',
  ui: {
    // Um só ficheiro: as etiquetas acrescentam-se e apagam-se dentro dele.
    allowedActions: { create: false, delete: false, createFolder: false, createNestedFolder: false },
  },
  fields: [
    descricao(
      'Cada etiqueta tem um nome e aponta para um ficheiro do Media Manager (imagem, PDF, vídeo…). ' +
        'O link da etiqueta fica sempre igual: para trocar o ficheiro publicado (ex.: o favicon do momento), ' +
        'escolhe outro ficheiro na etiqueta, sem mudar o nome. O link só muda se mudares o nome ou se o ficheiro novo ' +
        'tiver outra extensão (ex.: de .png para .svg). Os ficheiros sem etiqueta continuam publicados como sempre.',
    ),
    {
      name: 'items',
      label: 'Etiquetas',
      type: 'object',
      list: true,
      ui: {
        itemProps: (item) => ({
          label: item?.name ? `${item.name}${item.file ? ` → ${nomeDoFicheiro(item.file)}` : ''}` : 'Sem nome',
        }),
        defaultItem: { name: '' },
      },
      fields: [
        nomeUnico('items', 'Já existe uma etiqueta com este nome'),
        {
          name: 'file',
          label: 'Ficheiro',
          description: 'Abre o Media Manager. Podes escolher um ficheiro que já lá está ou carregar um novo.',
          type: 'image',
          required: true,
          ui: {
            validate: (value?: string) =>
              !value ? 'Escolhe um ficheiro' : !extensao(value) ? 'O ficheiro tem de ter extensão (ex.: .png)' : undefined,
          },
        },
        // Só mostra o link (não é gravado).
        { name: 'link', label: 'Link publicado', type: 'string', ui: { component: LinkEtiqueta } },
        {
          name: 'description',
          label: 'Descrição (opcional)',
          description: 'Só para orientação de quem edita (ex.: "Favicon dos sites da Arva Vare"). Não é publicada.',
          type: 'string',
          ui: { component: 'textarea' },
        },
      ],
    },
  ],
}
