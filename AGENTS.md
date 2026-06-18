# AGENTS.md — Astro Cakes 🍰

> Astro 6 + Svelte 5 博客模板，灵感来源于 Fuwari。
> 使用 Bun 作为运行时构建工具。

---

## Build / Test / Lint

```bash
bun install          # 安装依赖
bun run dev          # 启动开发服务器 (localhost:4321)
bun run build        # 生产构建 → dist/
bun run preview      # 预览构建产物
bun run astro        # Astro CLI 透传
```

- **格式化**: 项目使用 Prettier，配置文件 `.prettierrc`，插件包括 `prettier-plugin-astro` 和 `prettier-plugin-svelte`。
- **Lint / 测试**: 项目未配置任何 lint 或测试框架。构建错误会在 `bun run build` 或 `bun run dev` 时被 Astro/Vite 捕获。
- **SSR 预览**: 纯静态站点，无 SSR 模式。

---

## 架构

```
astro-cakes/
├── fonts/          Maple Mono 字体文件 (.woff2)
├── public/         静态资源 (favicon)
└── src/
    ├── astro.ts                 构建时集成：在后处理 HTML 中注入 async/blocking render 脚本
    ├── config.ts                站点配置入口（导出 site/navbar/theme/author/layout）
    ├── content.config.ts        内容集合定义：博客文章的 Zod schema
    ├── client/                  客户端运行时
    │   ├── preference.ts        localStorage 偏好存储（带跨标签页同步）
    │   ├── toggler.ts           通用显隐切换动画系统（支持预设/自动关闭）
    │   ├── utils.ts             视图过渡辅助函数
    │   └── run/                 启动时立即执行的脚本
    │       ├── preference.ts    localStorage 偏好初始化
    │       ├── utils.ts         navigate 桥接
    │       └── github-card.ts   GitHub 仓库卡片懒加载（IntersectionObserver + API fetch）
    ├── components/
    │   ├── Cards/               侧边栏/文章列表卡片
    │   │   ├── AuthorCard       作者信息卡
    │   │   ├── CategoriesCard   分类树（可折叠）
    │   │   ├── PostLinkCard     文章摘要卡片（带动画覆盖层）
    │   │   ├── TagsCard         标签列表
    │   │   └── TocCard          目录卡片（包裹 TableOfContents）
    │   ├── MetaWidgets/         元数据展示组件
    │   │   ├── CategoryBreadcrumb  分类面包屑导航
    │   │   ├── Meta             通用元数据行
    │   │   ├── StatsMeta        阅读时间/字数统计
    │   │   ├── TagsMeta         标签行
    │   │   └── TimeMeta         时间显示
    │   ├── NavBar/              导航栏组件
    │   │   ├── ColorSchemePanel.svelte   颜色模式切换面板
    │   │   ├── MenuButton.svelte         下拉菜单按钮
    │   │   └── ThemeColorPanel.svelte    主题色相滑块
    │   ├── json-ld/             结构化数据 (BlogPosting, WebSite)
    │   ├── *.astro              通用组件（HeadBase, Icon, PostContent 等）
    │   └── *.svelte             TableOfContents, TreeList（递归树组件）
    ├── content/posts/           博客文章（Markdown/MDX）
    ├── layouts/                 Astro 布局
    │   ├── BasicLayout.astro    HTML 骨架 + 封面图 + 导航 + 页脚
    │   ├── BlogPost.astro       文章布局（含 TOC/作者侧边栏）
    │   └── Home.astro           首页布局（文章列表卡片）
    ├── pages/                   路由页面
    │   ├── index.astro          首页
    │   ├── blog/
    │   │   ├── index.astro      博客列表（同首页）
    │   │   └── [...slug].astro  文章详情（动态路由）
    │   ├── category/[...category].astro  分类页面（动态路由，支持嵌套）
    │   └── tag/                 标签页面
    ├── server/
    │   ├── icon-loader.ts       共享图标加载工具（与 Icon.astro 共用 @iconify/utils 管道）
    │   ├── utils.ts             服务端工具：从文件系统获取日期、解析 Markdown 摘要
    │   └── mdext/               Markdown 扩展（remark 插件集）
    │       ├── index.ts         统一入口
    │       ├── command-parser.ts 通用 ::cmd[arg]{attrs} 语法解析器
    │       ├── inline-icon.ts   ::i[src]{attrs} 内联图标插件
    │       ├── github-card.ts   ::github[owner/repo] GitHub 仓库卡片插件
    │       └── parse-attrs.ts   属性字符串 key="val" 解析器
    ├── styles/                  样式（Stylus）
    │   ├── color.styl           OKLCH 调色板（浅色/深色双主题，色相可调）
    │   ├── variables.styl       CSS 变量 + 动画曲线 token
    │   ├── global.styl          全局样式 + View Transition 规则
    │   └── markdown/            Markdown 渲染样式
    │       ├── common.styl      通用 Markdown 样式
    │       ├── github-card.styl GitHub 仓库卡片样式（浅色半透明磨砂玻璃）
    │       └── title.css        标题样式
    ├── types/                   TypeScript 类型定义（config 的 Zod schema）
    ├── utils/                   共享工具
    │   ├── configtool.ts        获取默认作者信息
    │   ├── consts.ts            M3 动画常量
    │   ├── format.ts            日期/持续时长/字数格式化
    │   ├── other.ts             工具函数（generateId, Switcher）
    │   ├── page-indices.ts      标签/分类索引构建（树形结构）
    │   ├── reactive.ts          响应式系统（Ref, Computed）
    │   ├── transition.ts        Astro 视图过渡动画
    │   └── url.ts               URL 前缀构造器
    └── vite/                    Vite 插件
        ├── index.ts             dynamicStyle：运行时加载 Stylus 样式到 JS 模块
        └── rehype-heading-anchor.ts  Remark 插件：为标题注入锚点链接
```

### 数据流

1. **构建时**：`astro build` → 读取 `src/content/posts/` 下的 Markdown/MDX → 通过 Zod schema 校验 → 生成静态 HTML 页面。
2. **内容处理**：`src/server/utils.ts` 中的 `processPost()` 将文章条目与文件系统日期、Markdown 摘要合并。
3. **分类/标签索引**：`src/utils/page-indices.ts` 在模块加载时从 `getCollection('blog')` 构建 `tagMap` 和 `categoryMap`（树形结构）。
4. **客户端初始化**：`src/client/run/preference.ts` 在 `<head>` 中内联执行，初始化 localStorage 偏好、色相 CSS 变量、颜色切换和 Expressive Code 主题绑定。
5. **View Transitions**：Astro 内置视图过渡 + `PostLinkCard` 中自定义的 `clicked-cover`/`clicked-title` 命名过渡实现平滑页面切换。

---

## Key Files & Directories

| 路径                            | 作用                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `astro.config.mts`              | Astro 配置（集成、Vite 插件、字体、Markdown）                                                          |
| `svelte.config.js`              | Svelte 预处理（vitePreprocess）                                                                        |
| `ec.config.mjs`                 | Expressive Code 代码高亮配置（主题、行号）                                                             |
| `src/config.ts`                 | **站点配置总入口**：修改站点标题/描述/作者/社交链接/布局                                               |
| `src/content.config.ts`         | 博客 Frontmatter schema 定义                                                                           |
| `src/astro.ts`                  | 构建时 HTML 后处理器（async script 注入）                                                              |
| `src/vite/index.ts`             | `virtual:dynamic-style` 插件（JS 驱动 CSS）                                                            |
| `src/server/icon-loader.ts`     | 共享图标加载工具（Icon.astro 和 remark 插件共用管道）                                                  |
| `src/server/mdext/`             | 自定义 Markdown 扩展，提供 `::i[src]{attrs}` 内联图标语法和 `::github[owner/repo]` GitHub 仓库卡片语法 |
| `src/client/run/github-card.ts` | GitHub 卡片客户端懒加载（IntersectionObserver + fetch API + 三态渲染）                                 |
| `src/styles/color.styl`         | OKLCH 调色板（修改主题色）                                                                             |
| `src/styles/variables.styl`     | CSS 变量和动画曲线定义                                                                                 |
| `fonts/config.json`             | 字体子集配置文件                                                                                       |
| `.prettierrc`                   | Prettier 格式化配置                                                                                    |

---

## Coding Conventions

- **语言**: TypeScript（严格模式），`astro/tsconfigs/strict` 扩展。
- **样式**: 使用 Stylus（`.styl`），变量以 `stylus` 方式定义，通过 `lang="stylus"` 在 Astro/Svelte 组件中作用域内使用。
- **Svelte 5 语法**: 使用 runes（`$state`、`$derived`、`$effect`、`$props`），不使用旧的 `export let` 或 `$:` 语法。
- **组件命名**: `.astro` 用于布局/模板组件（服务端渲染），`.svelte` 用于需要客户端交互的组件（下拉、树、滑块）。
- **响应式**: 自定义 `Ref<T>`/`Computed<T>` 类（基于 `EventTarget`），非 Svelte store。
- **配置**: 所有配置通过 Zod schema 定义在 `src/types/config.ts` 中，在 `src/config.ts` 中调用 `define*Config()` 填充，导出给整个项目使用。
- **动画 token**: 使用 `--expressive-*` 和 `--standard-*` CSS 变量，定义在 `variables.styl` 中，参考 `src/utils/consts.ts` 中的 `m3anim` 对象。
- **Icon**: Svelte 组件使用 `unplugin-icons`（`~icons/mdi/` 导入）。Markdown 中使用 `::i[icon-name]{attrs}` 语法通过 `remarkInlineIcon` 插件渲染内联 SVG。`Icon.astro` 组件和插件共用 `src/server/icon-loader.ts` 加载管道。

---

## Git Workflow

- **Branch**: `main`
- **提交风格**: 采用 Conventional Commits（`feat:`、`fix:`、`refactor:`、`deps:`），使用中文描述。
- **示例提交**: `feat(PostLinkCard): 调整PostLinkCard组件布局结构`、`deps: 更新依赖`

---

## CI/CD

- 项目没有配置 CI/CD（无 GitHub Actions 工作流）。
- 可以部署到 Netlify / Vercel / Cloudflare Pages / GitHub Pages。

---

## Tips for AI Agents

- **内容集合定义**在 `src/content.config.ts`，修改文章 schema 时同步更新。
- **配置是完全类型化的**：`src/types/config.ts` 中的 Zod schema 定义了 `siteConfig()` / `authorConfig()` / `themeConfig()` 等。不要在 `src/config.ts` 之外手动定义配置类型。
- **样式求变**时优先修改 `src/styles/color.styl`（调色板）和 `src/styles/variables.styl`（动画 token）。
- **Markdown 扩展 `src/server/mdext/`** 使用 `::命令名[参数]{属性}` 语法。当前支持 `::i` 命令（内联图标）和 `::github` 命令（GitHub 仓库卡片），通过 `command-parser.ts` 统一解析。添加新命令时：在 `mdext/` 新建插件文件 → `index.ts` 导出 → `astro.config.mts` remarkPlugins 注册。
- **图标相关修改**涉及三处：`Icon.astro`（Astro 组件）、`src/server/icon-loader.ts`（共享加载逻辑）、`src/server/mdext/inline-icon.ts`（remark 插件）。修改时需同步检查三者行为一致。
- **PostLinkCard 的交互覆盖层**由 `src/components/Cards/PostLinkCard.ts`（JS 模块动态生成 Stylus）驱动，通过 `virtual:dynamic-style` 插件加载。修改覆盖层行为时要同时关注 `.ts` 文件和 `.astro` 文件。
- **编译在 Bun 上验证**：`bun run build` 会执行完整构建。如果依赖安装后构建失败，检查 `astro.config.mts` 中 Vite `external` 配置是否遗漏了新依赖。
- **项目无 lint/test**：添加功能时建议自行添加类型检查（`tsc --noEmit`）作为验证步骤。
- **色相可调**：用户可以通过 UI 滑块（0-359）改变主题色相，值存储在 `localStorage` 的 `theme-hue` 键中，覆盖 `src/config.ts` 中的 `theme.defaultHue`。
- **字体文件**预生成并放在 `fonts/` 目录中，修改 `astro.config.mts` 中的字体配置后要确保对应的 `.woff2` 文件存在。
- **代码高亮**配置在 `ec.config.mjs` 中，主题色在 `src/styles/color.styl` 中通过 `--color-hue` CSS 变量驱动。
- **GitHub 卡片 `::github[owner/repo]`** 修改涉及三端：`src/server/mdext/github-card.ts`（remark 插件，生成占位 HTML）、`src/client/run/github-card.ts`（客户端懒加载，三态渲染）、`src/styles/markdown/github-card.styl`（半透明磨砂玻璃样式）。卡片图标（github/star/fork）在 `HeadBase.astro` 的 frontmatter 中通过 `loadIconSvg()` 构建时获取，注入到 `window.__CONFIG__.icons`；客户端通过 `icons?.github` / `icons?.star` / `icons?.fork` 访问，不加 class，颜色由 `fill="currentColor"` 继承父元素。
