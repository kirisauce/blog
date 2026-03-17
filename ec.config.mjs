import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { defineEcConfig } from 'astro-expressive-code';

export default defineEcConfig({
  useThemedSelectionColors: true,
  styleOverrides: {
    codeFontFamily: 'var(--font-monospace)',
    codePaddingBlock: '0.5rem',
  },
  themes: ['andromeeda', 'rose-pine-dawn'],
  plugins: [pluginLineNumbers()],
});
