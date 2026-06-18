import { visit } from 'unist-util-visit';
import type { Root, Text, Html } from 'mdast';
import { parseCommands } from './command-parser';

/** 本插件关心的命令名 */
const COMMAND = 'github';

/**
 * 简易 HTML 转义：防止 XSS，同时保留 GitHub repo 名中的合法字符。
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 仓库图标 SVG（GitHub Primer octicon "repo"） */
const REPO_ICON =
  '<svg class="gh-card__icon" viewBox="0 0 16 16" fill="currentColor">' +
  '<path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75v-2.5h-7.5a1 1 0 00-1 1v.5A3.5 3.5 0 015.5 12h7.25a.75.75 0 010 1.5H5.5A5 5 0 010 8.5v-1A2.5 2.5 0 012 5h8.5V.75a.75.75 0 011.5 0V5h1a.75.75 0 010 1.5h-1v1.5h2.25a.75.75 0 010 1.5H12v2.5h1a.75.75 0 010 1.5h-1v.75a.75.75 0 01-1.5 0V12H5.5A3.5 3.5 0 012 8.5v-6z"/>' +
  '</svg>';

/**
 * 构建占位 HTML。
 *
 * 脚本未运行或加载失败时，用户看到此占位内容——一个可点击的链接卡片，
 * 显示仓库名称和 "N/A"。客户端脚本运行后会在进入视口时替换为完整卡片。
 */
function buildPlaceholder(repo: string): string {
  const escapedRepo = escapeHtml(repo.trim());
  if (escapedRepo.length === 0) return '';

  return [
    `<span class="gh-card" data-repo="${escapedRepo}">`,
    `<a class="gh-card--placeholder" href="https://github.com/${escapedRepo}" target="_blank" rel="noopener noreferrer">`,
    REPO_ICON,
    `<span class="gh-card__name">${escapedRepo}</span>`,
    `<span class="gh-card__meta">N/A</span>`,
    `</a>`,
    `</span>`,
  ].join('');
}

/**
 * Remark 插件：`::github[owner/repo]` GitHub 仓库卡片语法。
 *
 * ```markdown
 * ::github[kirisauce/astro-cakes]
 * ```
 *
 * 构建时注入占位 HTML（仓库名 + N/A + GitHub 链接），
 * 客户端脚本在元素滚动到视口内时懒加载完整卡片数据。
 */
export default function remarkGithubCard() {
  return (tree: Root) => {
    visit(
      tree,
      'text',
      (node: Text, index: number | undefined, parent: any) => {
        if (parent == null || index == null) return;

        const matches = parseCommands(node.value).filter(
          (m) => m.cmd === COMMAND,
        );
        if (matches.length === 0) return;

        const text = node.value;
        const parts: Array<{ type: 'text' | 'html'; value: string }> = [];
        let lastIndex = 0;

        for (const m of matches) {
          if (m.startIndex > lastIndex) {
            parts.push({
              type: 'text',
              value: text.slice(lastIndex, m.startIndex),
            });
          }

          const placeholder = buildPlaceholder(m.arg);
          if (placeholder) {
            parts.push({ type: 'html', value: placeholder });
          } else {
            parts.push({ type: 'text', value: m.fullMatch });
          }

          lastIndex = m.endIndex;
        }

        if (lastIndex < text.length) {
          parts.push({ type: 'text', value: text.slice(lastIndex) });
        }

        if (parts.length > 0) {
          const newNodes = parts.map((part) =>
            part.type === 'html'
              ? ({ type: 'html', value: part.value } satisfies Html)
              : ({ type: 'text', value: part.value } satisfies Text),
          );
          parent.children.splice(index, 1, ...newNodes);
        }
      },
    );
  };
}
