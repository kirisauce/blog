/**
 * 命令插件工厂 — 消除各 remark 命令插件之间的重复样板代码。
 *
 * 每个命令插件只需提供命令名和 builder 函数，工厂负责：
 * - 遍历 text 节点
 * - 解析 `::cmd[arg]{attrs}` 命令
 * - 将匹配的命令替换为 builder 返回的 HTML
 * - 拼接剩余文本节点
 */

import { visit } from 'unist-util-visit';
import type { Root, Text, Html } from 'mdast';
import { parseCommands } from './command-parser';

/**
 * 简易 HTML 转义。
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 创建 remark 命令插件。
 *
 * @param commandName - 命令名（如 'heimu'），与 `::cmd[...]` 中的 cmd 对应
 * @param buildHtml   - 接收命令参数 arg，返回 HTML 字符串；返回空字符串或 undefined 时保留原文
 * @returns remark 插件函数
 */
export function createCommandPlugin(
  commandName: string,
  buildHtml: (arg: string) => string | undefined,
): () => (tree: Root) => void {
  return () => {
    return (tree: Root) => {
      visit(tree, 'text', (node: Text, index: number | undefined, parent: any) => {
        if (parent == null || index == null) return;

        const matches = parseCommands(node.value).filter(
          (m) => m.cmd === commandName,
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

          const html = buildHtml(m.arg);
          if (html) {
            parts.push({ type: 'html', value: html });
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
      });
    };
  };
}
