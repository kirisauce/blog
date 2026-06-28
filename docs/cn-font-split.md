# `src/astro/cn-font.ts` 模块文档

## 作用

`cn-font`模块用于集成[cn-font-split](https://github.com/KonghaYao/cn-font-split)项目，以切分中文字体按需加载，加快加载速度。
此模块以Astro Integration形式提供（可以理解成Astro的插件）。

## 使用

> 这里假设你要打包的字体放在`fonts/Yozai-Regular.ttf`

首先，使用你的包管理器安装`cn-font-split`包

```bash
# for bun
bun add -d cn-font-split

# for pnpm
pnpm add -D cn-font-split
```

安装完成后，在`astro.config.mts`导入主题的Astro Integration模块。

```ts
import { cnFontSplit } from './src/astro/cn-font';
```

修改Astro的配置，添加Integration

```diff
    export default defineConfig({
      ...
      integration: [
        ...
++      cnFontSplit({ name: 'Yozai', input: 'fonts/Yozai-Regular.ttf' }),
      ],
      ...
    })
```

详细配置如下：

```ts
export interface CnFontSplitOptions {
  /** 字体名称 */
  name: string;

  /** 要的包的字体文件 */
  input: string;

  /** 字体的FontFamily */
  family?: string;

  /** 是否减少日志输出，默认true */
  silent?: boolean;
}
```

重启开发服务器后，用对应的`font-family`引用字体即可。css由插件通过Vite自动注入。
