import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
  // 只对 GitHubCard 启用 CE 编译：全局开启会把 unplugin-icons 等虚拟模块
  // 一并拖进 custom element 检查，产生大量无法修复的警告
  vitePlugin: {
    dynamicCompileOptions({ filename }) {
      if (filename.endsWith('GitHubCard.svelte')) {
        return { customElement: true };
      }
    },
  },
};
