import { visit } from 'unist-util-visit';
import type { Root, Text, Html } from 'mdast';
import { loadIconSvg, type IconResult } from '../icon-loader';
import { parseCommands, type CommandMatch } from './command-parser';
import { parseAttrs } from './parse-attrs';

/** 本插件关心的命令名 */
const COMMAND = 'i';

interface Modification {
  node: Text;
  parent: any;
  index: number;
  matches: CommandMatch[];
}

/**
 * Remark 插件：`::i[src]{attrs}` 内联图标语法。
 *
 * ```markdown
 * ::i[mdi:calendar]
 * ::i[mdi:calendar]{class="big-icon" style="color:red"}
 * ```
 *
 * 工作流程：
 * 1. 遍历文本节点，用 `parseCommands` 识别所有 `::` 命令，
 *    过滤出 `i` 命令并收集需要加载的图标
 * 2. 批量异步加载所有图标 SVG
 * 3. 将匹配替换为内联 `<svg>` HTML
 *
 * 图标加载失败时保留原始文本并在控制台输出错误。
 */
export default function remarkInlineIcon() {
  return async (tree: Root) => {
    const modifications: Modification[] = [];
    const iconCache = new Map<string, IconResult | null>();
    const loadPromises: Promise<void>[] = [];

    // ── 第 1 步：遍历收集 ──────────────────────────────────
    visit(
      tree,
      'text',
      (node: Text, index: number | undefined, parent: any) => {
        if (parent == null || index == null) return;

        const matches = parseCommands(node.value).filter(
          (m) => m.cmd === COMMAND,
        );
        if (matches.length === 0) return;

        // 收集需要加载的图标
        for (const m of matches) {
          if (!iconCache.has(m.arg)) {
            const promise = loadIconSvg(m.arg)
              .then((result) => {
                iconCache.set(m.arg, result);
              })
              .catch((error: unknown) => {
                console.error(
                  `[remark-inline-icon] Failed to load icon "${m.arg}":`,
                  error,
                );
                iconCache.set(m.arg, null);
              });
            loadPromises.push(promise);
          }
        }

        modifications.push({ node, parent, index, matches });
      },
    );

    // 没有匹配任何图标 —— 提前返回
    if (modifications.length === 0) return;

    // ── 第 2 步：等待所有图标加载完毕 ──────────────────────
    await Promise.all(loadPromises);

    // ── 第 3 步：倒序修改 AST ──────────────────────────────
    for (const { node, parent, index, matches } of modifications.reverse()) {
      const text = node.value;

      const parts: Array<{ type: 'text' | 'html'; value: string }> = [];
      let lastIndex = 0;

      for (const m of matches) {
        // 匹配前的纯文本
        if (m.startIndex > lastIndex) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex, m.startIndex),
          });
        }

        const iconData = iconCache.get(m.arg);

        if (iconData) {
          // 加载成功 —— 生成内联 SVG
          const customAttrs = parseAttrs(m.attrsString);
          const merged = { ...iconData.attribs, ...customAttrs };

          const attrStr = Object.entries(merged)
            .map(([k, v]) => `${k}="${v.replace(/"/g, '&quot;')}"`)
            .join(' ');

          parts.push({
            type: 'html',
            value: `<svg ${attrStr}>${iconData.body}</svg>`,
          });
        } else {
          // 加载失败 —— 保留原始语法，让用户可见
          parts.push({ type: 'text', value: m.fullMatch });
        }

        lastIndex = m.endIndex;
      }

      // 匹配后的剩余文本
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
    }
  };
}
