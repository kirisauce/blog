/**
 * Remark 插件：`::github[owner/repo]` GitHub 仓库卡片语法。
 *
 * ```markdown
 * ::github[kirisauce/astro-cakes]
 * ```
 *
 * 构建时注入 <github-card> 自定义元素，内部携带无 JS 回退占位
 * （内联样式，不依赖任何脚本或组件样式表），
 * 客户端 Svelte 组件升级挂载时接管渲染并移除回退内容。
 */

import { loadIconSvg, type IconResult } from '../icon-loader';
import { createCommandPlugin, escapeHtml } from './plugin-factory';

// 模块顶层预取：图标只加载一次，供所有 ::github 占位复用
const GH_ICON: IconResult = await loadIconSvg('mingcute:github-line');

/** 回退占位图标：过滤原始尺寸属性，内联样式固定大小并继承文字颜色 */
function renderFallbackIcon(icon: IconResult, size: number): string {
  const attrs = Object.entries(icon.attribs)
    .filter(([k]) => k !== 'width' && k !== 'height')
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<svg ${attrs} fill="currentColor" style="width: ${size}px; height: ${size}px; flex-shrink: 0;">${icon.body}</svg>`;
}

/** 回退占位内联样式：必须在不执行 JS、不加载组件样式的环境下独立生效 */
const FALLBACK_STYLE = `
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  margin: 1rem 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-family: var(--font-sans, inherit);
  text-decoration: none;
`;

/**
 * 构建占位 HTML。
 *
 * <github-card> 内部放置回退链接：JS 不可用时用户仍能看到可点击的占位卡片；
 * 组件升级后由 GitHubCard.svelte 清除宿主中的回退节点。
 */
function buildPlaceholder(repo: string): string {
  const escapedRepo = escapeHtml(repo.trim());
  if (escapedRepo.length === 0) return '';
  return `<github-card repo="${escapedRepo}">
    <a href="https://github.com/${escapedRepo}" target="_blank" rel="noopener noreferrer" style="${FALLBACK_STYLE}">
      ${renderFallbackIcon(GH_ICON, 18)}
      <span style="flex: 1; font-family: var(--font-monospace, monospace); font-weight: 600; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${escapedRepo}
      </span>
      <span style="font-size: 0.8rem;">N/A</span>
    </a>
  </github-card>`;
}

export default createCommandPlugin('github', buildPlaceholder);
