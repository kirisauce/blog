/**
 * Web Components 注册入口。
 *
 * 导入 Svelte 组件并自动注册为自定义元素。
 * 在 HeadBase.astro 中以 ?inline 方式内联到 <head>。
 */

// 导入 GitHubCard 组件，触发 customElement 注册
import '../components/GitHubCard.svelte';
