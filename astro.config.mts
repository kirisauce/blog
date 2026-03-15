// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig, fontProviders } from 'astro/config';

import svelte from '@astrojs/svelte';

type Variants = NonNullable<
  NonNullable<Parameters<typeof defineConfig>[0]['fonts']>[number]['options']
>['variants'];

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), svelte()],

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
              src: [`./fonts/MapleMono-${variantName}.ttf.woff2`],
              weight: (index + 1) * 100,
              style: style.toLowerCase(),
            } as const;
          }),
        ) as Variants,
      },
    },
  ],
});