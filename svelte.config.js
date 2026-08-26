import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
  // 配合 GitHubCard.svelte 内的 <svelte:options customElement>，
  // 缺少此项时 vite-plugin-svelte 抛 options_missing_custom_element 警告
  compilerOptions: {
    customElement: true,
  },
};
