/**
 * 站点构建入口：执行 astro build，再构建 MeguminLink 的 mlink-webui 并投放到站点目录。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMlinkWebui } from './build-mlink-webui.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const result = spawnSync('pnpm', ['exec', 'astro', 'build'], {
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

buildMlinkWebui(path.join(ROOT, 'dist'));
