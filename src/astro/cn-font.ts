import type { AstroIntegration } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const fontSplit = await import('cn-font-split');

export interface CnFontSplitOptions {
  /** 字体名称 */
  name: string;

  /** 要的包的字体文件 */
  input: string;

  /** 字体的FontFamily */
  family?: string;

  /** 是否减少日志输出，默认true */
  silent?: boolean;
}

export const cnFontSplit = (opt: CnFontSplitOptions) =>
  ({
    name: 'cakes_cnFontSplit',
    hooks: {
      'astro:config:setup': async ({ createCodegenDir, injectScript }) => {
        const dir = path.join(createCodegenDir().pathname, opt.name);
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir);
        }
        await fs.access(dir);

        const cssFileName = `${opt.name}.css`;

        fontSplit.fontSplit({
          input: opt.input,
          outDir: dir,

          css: {
            fontFamily: opt.family,
            fileName: cssFileName,
          },

          silent: opt.silent ?? true,
          reporter: false,
          testHtml: false,
        });

        injectScript('page-ssr', `import '${path.join(dir, cssFileName)}';`);
      },
    },
  }) satisfies AstroIntegration;
