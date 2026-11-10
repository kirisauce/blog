/**
 * MeguminLink 的 mlink-webui（externals/mlink-webui）构建与产物投放。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEBUI_DIR = path.join(ROOT, 'externals/mlink-webui');
const WEBUI_BASE = '/tools/meguminlink-webui';
const WEBUI_DIST = path.join(WEBUI_DIR, 'dist');

function run(args: string[], options = {}): void {
  const result = spawnSync('pnpm', args, { stdio: 'inherit', ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function buildMlinkWebui(siteDist: string): void {
  run(['install'], { cwd: WEBUI_DIR });
  run(['run', 'build'], {
    cwd: WEBUI_DIR,
    env: { ...process.env, ASTRO_BASE: WEBUI_BASE },
  });

  const target = path.join(siteDist, 'tools/meguminlink-webui');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(WEBUI_DIST, target, { recursive: true });
}
