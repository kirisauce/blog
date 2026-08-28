// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig, fontProviders } from 'astro/config';
import svelte from '@astrojs/svelte';
import { unified } from '@astrojs/markdown-remark';
import { patcher } from './src/astro';
import { cnFontSplit } from './src/astro/cn-font';
import path from 'node:path';

// Vite plugins
import icon from 'unplugin-icons/vite';

import expressiveCode from 'astro-expressive-code';
import { dynamicStyle } from './src/vite';
import remarkHeadingAnchor from './src/vite/rehype-heading-anchor';
import {
  remarkInlineIcon,
  remarkGithubCard,
  remarkHeimu,
  remarkSingleLineDisplayMath,
} from './src/server/mdext';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { theme } from './src/config';

const katexEnabled = theme.katex.enabled;

type Variants = NonNullable<
  NonNullable<Parameters<typeof defineConfig>[0]['fonts']>[number]['options']
>['variants'];

// https://astro.build/config
export default defineConfig({
  site: 'https://kirisauce.netlify.app/',
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkHeadingAnchor,
        remarkInlineIcon,
        remarkGithubCard,
        remarkHeimu,
        ...(katexEnabled ? [remarkMath, remarkSingleLineDisplayMath] : []),
      ],
      rehypePlugins: [...(katexEnabled ? [rehypeKatex] : [])],
    }),
  },

  integrations: [
    expressiveCode(),
    mdx(),
    svelte(),
    patcher(),
    cnFontSplit({ name: 'Yozai', input: 'fonts/Yozai-Medium.ttf' }),
  ],

  vite: {
    resolve: {
      alias: {
        'virtual:katex-css': katexEnabled
          ? path.resolve('node_modules/katex/dist/katex.min.css')
          : path.resolve('src/styles/markdown/katex-placeholder.css'),
      },
    },

    plugins: [
      icon({
        compiler: 'svelte',
      }) as any,

      dynamicStyle(),
    ],

    build: {
      rollupOptions: {
        external: [
          'node:fs',
          'node:fs/promises',
          'node:path',
          'node:path/posix',
        ],
      },
    },
  },

  fonts: [
    {
      name: 'Maple Mono',
      provider: fontProviders.local(),
      cssVariable: '--font-monospace',
      fallbacks: ['Consolas', 'Courier New', 'monospace'],
      options: {
        variants: ['Normal', 'Italic'].flatMap((style) =>
          [
            'Thin',
            'ExtraLight',
            'Light',
            'Regular',
            'Medium',
            'SemiBold',
            'Bold',
            'ExtraBold',
          ].map((thickness, index) => {
            let variantName;
            if (style === 'Normal') {
              variantName = thickness;
            } else {
              // style === 'Italic'
              if (thickness === 'Regular') {
                variantName = style;
              } else {
                variantName = thickness + style;
              }
            }
            return {
              src: [`./fonts/MapleMono/MapleMono-${variantName}.ttf.woff2`],
              weight: (index + 1) * 100,
              style: style.toLowerCase(),
            } as const;
          }),
        ) as Variants,
      },
    },
  ],
});
