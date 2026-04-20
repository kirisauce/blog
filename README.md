[English](https://github.com/kirisauce/astro-cakes/blob/main/README_en.md)

## Cakes! 🍰

[Cakes](https://github.com/kirisauce/astro-cakes) 是一个简单的 Astro 博客模板，灵感来自于 [Fuwari](https://github.com/saicaca/fuwari)

## 演示

[这里](https://kirisauce.netlify.app/) 是我的个人博客，使用 Cakes 作为模板。

## 使用方法

### 1. 前置要求

要部署/开发 Astro 项目，需要以下 JavaScript 运行时之一：

- [NodeJS](https://nodejs.org/)
- [Deno](https://deno.land/)
- [Bun](https://bun.sh/)

我开发使用 [Bun](https://bun.sh/), so 我个人比较推荐使用它。

另外建议下个代码编辑器来写Markdown, 推荐 ~~微 软 大 战 代 码~~[Visual Studio Code](https://code.visualstudio.com/)。

### 2. 初始化项目

有三种方式可以基于 Cakes 创建新项目。

1. 使用 [degit](https://github.com/Rich-Harris/degit) 搭建项目：
  ```bash
  bun create degit kirisauce/astro-cakes my-astro-blog
  cd my-astro-blog
  bun install
  ```
  ~~大D老师写的我也不知道对不对（~~

2. 使用 **Template**/**Fork** 生成新仓库。
  （看到右上角那个绿色的按钮/叉子按钮了吗？就是它！）

3. 直接Clone仓库：
  ```bash
  git clone https://github.com/kirisauce/astro-cakes.git my-astro-blog
  cd my-astro-blog
  bun install
  ```

### 3. 开发

```bash
bun run dev
```

开发服务器将在 `http://localhost:4321` 可用。

### 4. 生产构建

```bash
bun run build
```

构建的文件将放置在 `dist/` 目录中。

### 5. 预览构建

```bash
bun run preview
```

## 配置

编辑 `src/config.ts` 来定制：

- 站点元数据（标题、描述、作者）
- 社交媒体链接
- 还有其他设置

## 写作

在 `src/content/` 目录中创建 Markdown/MDX 文件：

**Frontmatter 示例：**

```yaml
---
title: '你的文章标题'
description: '文章的简要描述'
date: '2024-01-01'
tags: [astro, 教程, 网页开发]
---
```

## 部署

你可以把项目可以部署到各种静态托管平台 ~~白 嫖~~：

- **Netlify**：连接你的仓库实现自动部署
- **Vercel**：导入你的 Git 仓库
- **Cloudflare Pages**：连接你的 Git 提供商
- **GitHub Pages**：使用 GitHub Actions 进行部署

## 自定义

### 主题

编辑 `src/styles/color.styl` 来自定义调色板。颜色使用 OKLCH 色彩空间定义，确保一致的感知外观。

### 组件

组件按功能组织：

- `Cards/` - 文章和内容的卡片组件
- `MetaWidgets/` - 元数据显示小部件
- `NavBar/` - 导航组件

### 添加功能

通过 `astro add` 安装 Astro 集成，或在 `astro.config.mts` 中手动配置。

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 致谢

- 灵感来自于 [Fuwari](https://github.com/saicaca/fuwari)
- 由 [Astro](https://astro.build) 强力驱动
- 图标来自 [Iconify](https://iconify.design)
- 字体来自 [Maple Font](https://github.com/subframe7536/Maple-font)
- 代码高亮来自 [Expressive Code](https://expressive-code.com)
