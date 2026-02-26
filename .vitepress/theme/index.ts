// https://vitepress.dev/guide/custom-theme
import { getDefaultTheme } from 'vitepress-theme-matterial/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'

export default {
  Layout: Layout,
  extends: getDefaultTheme() as Theme,
} satisfies Theme

