import { defineConfig } from 'vitepress'
import { getDefaultConfig } from 'vitepress-theme-matterial/config'
import { ThemeConfig } from 'vitepress-theme-matterial/shared'
import * as data from './data'

// https://vitepress.dev/reference/site-config
export default defineConfig<ThemeConfig>({
  srcDir: "src",

  title: "kirisauce's blog",
  description: "This website is for test only at present.",

  themeConfig: {
    author: 'kirisauce',
    authorProfiles: data.authors,
  },

  extends: (await getDefaultConfig()) as any,
})
