# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VitePress-based tech blog called "皮特ᴾᵗ的博客充电栈" (Peter's Blog Tech Stack), focusing on quantum computing, AI, and cloud-native technologies. The blog uses the @sugarat/theme for enhanced blogging features and includes various VitePress plugins for extended functionality.

## Development Commands

```bash
# Start development server
pnpm dev

# Build the site for production
pnpm build

# Preview the built site locally
pnpm serve

# Install dependencies
pnpm install
```

## Architecture Overview

### Core Structure
- **VitePress Configuration**: `docs/.vitepress/config.mts` - Main VitePress configuration with Chinese localization
- **Blog Theme**: `docs/.vitepress/blog-theme.ts` - Custom theme configuration using @sugarat/theme
- **Custom Theme**: `docs/.vitepress/theme/index.ts` - Theme extensions and plugin integrations
- **Content**: `docs/posts/` - Blog posts organized by category (ai, quantum, programming, etc.)
- **Static Assets**: `docs/assets/`, `docs/public/` - Images, JavaScript files, and other static resources

### Key Features
- **Multi-category Blog**: Posts organized in directories like `ai/`, `quantum/`, `kubevirt/`, `programming/`, etc.
- **Enhanced Plugins**: 
  - Mermaid diagrams support
  - Code block folding
  - Music player integration
  - Enhanced readabilities
  - Progress bar (nprogress)
  - Comment system via Giscus
  - Math equation support (MathJax3)
  - Footnotes support
- **Interactive Games**: Special page "逮住那只猫！" with Phaser.js integration
- **Search**: Pagefind-based offline search functionality
- **Responsive Design**: Mobile-optimized with custom styling

### Content Management
- Blog posts are Markdown files in `docs/posts/[category]/`
- Each category has its own subdirectory (ai, quantum, programming, etc.)
- Posts support frontmatter for metadata
- Assets are stored in `docs/assets/` and referenced via CDN (jsdelivr)

### Theme Customization
- Custom SCSS styling in `docs/.vitepress/theme/style.scss`
- Component overrides in `docs/.vitepress/theme/components/`
- Utility functions in `docs/.vitepress/theme/utils/`
- Music playlist configuration in theme index file

### Deployment
- GitHub Actions workflow: `.github/workflows/pages-build-site.yml`
- Uses pnpm for package management
- Deploys to GitHub Pages automatically on main branch push
- Build output: `docs/.vitepress/dist/`

## Important Notes

- Package manager: **pnpm** (v8.15.4)
- Node.js version: 20
- The site uses Chinese (zh-CN) as primary language
- Custom ads integration via external script
- Friend links and social features configured in blog theme
- Comment system requires GitHub repository setup (hyperter96/tech-blog)