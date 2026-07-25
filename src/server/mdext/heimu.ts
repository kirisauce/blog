/**
 * Remark 插件：`::heimu[text]` 黑幕语法。
 *
 * ```markdown
 * ::heimu[这是被隐藏的内容]
 * ```
 *
 * 生成黑幕文本效果：
 * - 背景纯黑，文字默认不可见（opacity: 0）
 * - 鼠标悬停时文字显现（opacity: 1）
 * - 单击可固定/取消固定文字的可见状态
 */

import { createCommandPlugin, escapeHtml } from './plugin-factory';

function buildHeimu(text: string): string {
  const escaped = escapeHtml(text.trim());
  if (escaped.length === 0) return '';

  return [
    '<span class="heimu">',
    '<span class="heimu-content" onclick="this.classList.toggle(\'visible\')">',
    escaped,
    '</span>',
    '</span>',
  ].join('');
}

export default createCommandPlugin('heimu', buildHeimu);
