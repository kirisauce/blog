import { defineConfig } from 'vitepress'
import { getDefaultConfig } from 'vitepress-theme-matterial/config'
import { ThemeConfig } from 'vitepress-theme-matterial/shared'
import * as data from './data'

const themeConfig = {
  author: 'kirisauce',
  authorProfiles: data.authors,

  license: {
    default: 'cc-by-nc-4.0',
  },

  font: {
    monospace: '"Cascadia Code"',
  },

  page: {
    home: {
      showImagePlaceholder: true,
    },
  },

  layout: {
    footer: {
      copyright: 'Copyright © 2026-{currentYear} kirisauce',
    },

    headerImage: {
      src: '/background.webp',
      behavior: 'half-parallax',
    },
  },
} satisfies ThemeConfig

// https://vitepress.dev/reference/site-config
export default defineConfig<ThemeConfig>({
  srcDir: "src",

  title: "kirisauce's blog",
  description: "This website is for test only at present.",

  themeConfig,

  extends: (await getDefaultConfig()) as any,
})
