## Cakes! 🍰

[Cakes](https://github.com/kirisauce/astro-cakes) is a simple blog template for Astro, which is inspired by [Fuwari](https://github.com/saicaca/fuwari)

## Demo

[Here](https://kirisauce.netlify.app/) is my personal blog, which uses Cakes as the template.

## Usage

### 1.Prerequisites

To deplay/develop a astro project, one of the following JavaScript runtime is required:
 - [NodeJS](https://nodejs.org/)
 - [Deno](https://deno.land/)
 - [Bun](https://bun.sh/)

Here I use [Bun](https://bun.sh/) to develop this project, so I recommend it first.

Also, we recommend you to choose a suitable code editor, for editing markdown files.
[Visual Studio Code](https://code.visualstudio.com/) should be a good choice.

### 2.Set up Your Project

We have three options to create a new project based on Cakes.

1. Use [degit](https://github.com/Rich-Harris/degit) to scaffold the project:
   ```bash
   bun create degit kirisauce/astro-cakes my-astro-blog
   cd my-astro-blog
   bun install
   ```

2. Use [this template](https://github.com/kirisauce/astro-cakes/generate) on GitHub to generate a new repository.

3. Clone the repository directly:
   ```bash
   git clone https://github.com/kirisauce/astro-cakes.git my-astro-blog
   cd my-astro-blog
   bun install
   ```

### 3.Development

```bash
bun run dev
```

The development server will be available at `http://localhost:4321`.

### 4.Build for Production

```bash
bun run build
```

The built files will be placed in the `dist/` directory.

### 5.Preview the Build

```bash
bun run preview
```

## Configuration

Edit `src/config.ts` to customize:
- Site metadata (title, description, author)
- Social media links
- Navigation menu
- SEO settings

## Writing Content

Create Markdown/MDX files in `src/content/posts/` directory:

**Frontmatter example:**
```yaml
---
title: 'Your Post Title'
description: 'A brief description of your post'
date: '2024-01-01'
tags: [astro, tutorial, webdev]
---
```

Markdown/MDX files in this directory will be mapped to `/blog/` path of the static site.

## Deployment

Cakes can be deployed to various static hosting platforms:

- **Netlify**: Connect your repository for automatic deployments
- **Vercel**: Import your Git repository
- **Cloudflare Pages**: Connect your Git provider
- **GitHub Pages**: Use GitHub Actions for deployment

## Customization

### General Configuration
Edit `src/config.ts` to customize:
 - Site metadata (title, description, author)
 - Social media links
 - Other layout options

### Theming
Edit `src/styles/color.styl` to customize the color palette. Colors are defined using OKLCH color space for consistent perceptual appearance.

### Components
Components are organized by functionality:
- `Cards/` - Card components for posts and content
- `MetaWidgets/` - Metadata display widgets
- `NavBar/` - Navigation components

### Adding Features
Install Astro integrations via `astro add` or manually configure in `astro.config.mts`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Thanks

- Inspired by [Fuwari](https://github.com/saicaca/fuwari)
- Built with [Astro](https://astro.build)
- Icons by [Iconify](https://iconify.design)
- Font by [Maple Font](https://github.com/subframe7536/Maple-font)
- Code highlighting by [Expressive Code](https://expressive-code.com) 