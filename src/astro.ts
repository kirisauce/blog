import type { AstroIntegration } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

const patcher_buildDoneHook = (async ({ pages, dir, logger }) => {
  let counter = 0;

  const patch = async (pathname: string) => {
    let processedPathname: string;
    if (pathname.endsWith('.html')) {
      processedPathname = pathname;
    } else if (pathname.endsWith('/')) {
      processedPathname = pathname + 'index.html';
    } else {
      return;
    }

    const actualPathname = path.resolve(dir.pathname, processedPathname);
    const content = await fs.readFile(actualPathname, {
      encoding: 'utf-8',
    });

    const regexp = /<!-- @patch async_script -->\n*<script */;
    const result = regexp.exec(content);
    if (!result) {
      return;
    }

    let fd = null;
    try {
      fd = await fs.open(actualPathname, 'a');
      await fd.truncate(result.index + 2);
      await fd.write('<script async blocking="render" ');
      await fd.write(content.slice(result.index + result[0].length));
    } finally {
      if (fd) {
        fd.close();
      }
    }

    counter++;
  };

  for (const page of pages) {
    await patch(page.pathname);
  }
  await patch('index.html');

  logger.info(`Patched ${counter} files for async script`);
}) satisfies AstroIntegration['hooks']['astro:build:done'];

export const patcher = () =>
  ({
    name: 'cakes_patcher',
    hooks: {
      'astro:build:done': patcher_buildDoneHook,
    },
  }) satisfies AstroIntegration;
