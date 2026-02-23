// https://vitepress.dev/guide/custom-theme
import { getDefaultTheme } from 'vitepress-theme-matterial/theme'
import type { Theme } from 'vitepress'

export default {
  extends: getDefaultTheme() as Theme,
} satisfies Theme

