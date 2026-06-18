/**
 * mdext — Markdown Extensions
 *
 * 自定义 Markdown 扩展集合。
 * 每个扩展对应一种短语法命令（如 ::i 内联图标），
 * 以 remark 插件形式提供。
 *
 * 如需添加新扩展，在此处统一导出。
 */

export { default as remarkInlineIcon } from './inline-icon';
export { default as remarkGithubCard } from './github-card';
