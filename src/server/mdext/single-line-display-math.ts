/**
 * Remark 插件：单行 `$$...$$` 公式升级为 display（块级）公式。
 *
 * 上游 `micromark-extension-math` 规定块级公式的 `$$` 必须独占一行
 * （fence 的 meta 段不允许出现 `$`），因此单行 `$$x=1$$` 会被其
 * text 级构造回退解析为 `inlineMath`（行内公式），最终被 rehype-katex
 * 以 inline 模式渲染。
 *
 * 本插件在 `remark-math` 之后运行：将「独占整行且以 `$$` 包裹的
 * 行内公式」提升为 flow `math` 节点（结构 / data 与 `mdast-util-math`
 * 的 display 节点一致），使 rehype-katex 走 display 分支渲染。
 *
 * 处理规则：
 * - 段落整体为公式（含纯空白）→ 整段替换为 math 节点序列；
 * - 段落中公式行与正文混排 → 按公式切分段落（文本段保持为 paragraph）；
 * - 行内公式未独占整行（`文字 $$x=1$$ 文字`）、单 dollar、同行多个
 *   公式、跨行公式 → 保持原样，仍按行内公式处理。
 */

import { visit } from 'unist-util-visit';
import type { Root, Paragraph, Parent, Text, PhrasingContent } from 'mdast';
import type { InlineMath, Math as MathNode } from 'mdast-util-math';

interface Replacement {
  parent: Parent;
  index: number;
  nodes: Array<Paragraph | MathNode>;
}

/** 文本节点是否纯空白（换行 / 空格 / 制表符） */
function isBlankText(node: Text): boolean {
  return /^[\t \r\n]*$/.test(node.value);
}

/** 段落子节点序列是否纯空白（可用于丢弃） */
function isBlankChildren(children: PhrasingContent[]): boolean {
  return children.every((c) => c.type === 'text' && isBlankText(c));
}

/**
 * 该行内公式是否「独占单行」且以双 dollar 包裹。
 *
 * 仅凭 mdast 的 `value` 无法区分 `$$x=1$$` 与 `$x=1$`（value 不含
 * 分隔符），这里用原始源码切片还原分隔符，并检查所在行首/行尾的
 * 前后空白，确定它独占整行；跨行公式（`$$a\nb$$`）不升级。
 */
function isSingleLineDoubleDollar(node: InlineMath, source: string): boolean {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start == null || end == null) return false;

  // 跨行公式不处理（KaTeX display 不接受未包裹多行内容）
  if (node.position!.start.line !== node.position!.end.line) return false;

  const raw = source.slice(start, end);
  if (!raw.startsWith('$$') || !raw.endsWith('$$')) return false;

  // 所在行：行首（上一个 \n 之后）到行尾（下一个 \n 之前）
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;
  const nextEol = source.indexOf('\n', end);
  const lineEnd = nextEol === -1 ? source.length : nextEol;

  const before = source.slice(lineStart, start);
  const after = source.slice(end, lineEnd);
  return /^[\t \r]*$/.test(before) && /^[\t \r]*$/.test(after);
}

/** 将行内公式节点转换为 flow `math` 节点（与 mdast-util-math 的 display 结构一致） */
function toFlowMath(node: InlineMath): MathNode {
  return {
    type: 'math',
    meta: null,
    value: node.value,
    data: {
      hName: 'pre',
      hChildren: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-math', 'math-display'] },
          children: [{ type: 'text', value: node.value }],
        },
      ],
    },
    position: node.position ?? undefined,
  };
}

function makeParagraph(children: PhrasingContent[]): Paragraph {
  return { type: 'paragraph', children };
}

export default function remarkSingleLineDisplayMath() {
  return (tree: Root, file: { value: unknown }) => {
    const source = String(file.value ?? '');
    const replacements: Replacement[] = [];

    visit(
      tree,
      'paragraph',
      (paragraph: Paragraph, index: number | undefined, parent: unknown) => {
        if (parent == null || index == null) return;

        const nodes: Array<Paragraph | MathNode> = [];
        let current: PhrasingContent[] = [];
        let upgraded = false;

        for (const child of paragraph.children) {
          if (child.type === 'inlineMath' && isSingleLineDoubleDollar(child, source)) {
            // flush 当前正文段（丢弃纯空白）
            if (current.length > 0 && !isBlankChildren(current)) {
              nodes.push(makeParagraph(current));
            }
            current = [];
            nodes.push(toFlowMath(child));
            upgraded = true;
          } else {
            current.push(child);
          }
        }

        // flush 结尾正文段
        if (current.length > 0 && !isBlankChildren(current)) {
          nodes.push(makeParagraph(current));
        }

        if (!upgraded) return;

        // 整段替换为切分后的节点序列（无正文时即为纯 math 节点序列）
        replacements.push({ parent: parent as Parent, index, nodes });
      },
    );

    // 同一父节点内按 index 降序替换，避免影响后续索引
    replacements.sort((a, b) => b.index - a.index);
    for (const { parent, index, nodes } of replacements) {
      parent.children.splice(index, 1, ...nodes);
    }
  };
}
