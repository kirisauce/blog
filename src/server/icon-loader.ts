import { loadNodeIcon } from '@iconify/utils/lib/loader/node-loader';
import { parseSVGContent } from '@iconify/utils/lib/svg/parse';

export interface IconResult {
  attribs: Record<string, string>;
  body: string;
}

/**
 * 加载并解析图标 SVG。
 * 与 Icon.astro 使用同一套 @iconify/utils 管道，
 * 确保构建时（remark 插件）和 Astro 组件渲染结果一致。
 *
 * @param src 图标标识，格式为 "provider:icon-name"，例如 "mdi:calendar"
 */
export async function loadIconSvg(src: string): Promise<IconResult> {
  const [provider, iconName] = src.split(':', 2);

  if (!provider || !iconName || iconName.length === 0) {
    throw new Error(
      `Invalid icon source: "${src}". Expected format: "provider:icon-name" (e.g. "mdi:calendar")`,
    );
  }

  const svg = await loadNodeIcon(provider, iconName);

  if (!svg) {
    throw new Error(`Icon not found: "${src}"`);
  }

  const parsed = parseSVGContent(svg);

  if (!parsed) {
    throw new Error(`Failed to parse icon SVG for: "${src}"`);
  }

  return parsed;
}
