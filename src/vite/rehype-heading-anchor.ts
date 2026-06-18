import { visit } from 'unist-util-visit';
import type { Root as MdastRoot, Heading, Text } from 'mdast';

/**
 * Remark 插件：为标题注入锚点链接的 raw HTML
 */
export default function remarkHeadingAnchor() {
  return (tree: MdastRoot) => {
    const slugCounts = new Map<string, number>();

    visit(tree, 'heading', (node: Heading) => {
      const text = extractText(node.children);
      const slug = toSlug(text, slugCounts);

      // 在标题内容前注入锚点链接的 raw HTML
      node.children.unshift({
        type: 'html',
        value: `<a class="heading-anchor" href="#${slug}">`,
      } as any);

      node.children.push({
        type: 'html',
        value: '</a>',
      } as any);

      // 给标题节点添加 id（通过 data.hProperties）
      node.data = node.data ?? {};
      node.data.hProperties = node.data.hProperties ?? {};
      node.data.hProperties.id = slug;
    });
  };
}

function toSlug(text: string, slugCounts: Map<string, number>): string {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const count = slugCounts.get(slug) ?? 0;
  slugCounts.set(slug, count + 1);
  if (count > 0) slug = `${slug}-${count}`;
  return slug;
}

function extractText(nodes: Heading['children']): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return (n as Text).value;
      if ('children' in n) return extractText((n as any).children);
      if ('value' in n) return (n as any).value ?? '';
      return '';
    })
    .join('');
}
