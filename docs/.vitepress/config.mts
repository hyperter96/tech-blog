import { defineConfig } from 'vitepress'
import  footnote_plugin  from "markdown-it-footnote";
// 导入主题的配置
import { blogTheme } from './blog-theme'

// Vitepress 默认配置
// 详见文档：https://vitepress.dev/reference/site-config
export default defineConfig({
  // 继承博客主题(@sugarat/theme)
  extends: blogTheme,
  lang: 'zh-CN',
  title: '皮特ᴾᵗ的博客技术站',
  description: '热衷于网络安全、云原生技术，一直为实现自我价值而执着！',
  base: "/", // 部署到github上时访问的根目录
  lastUpdated: true,
  transformPageData(pageData, ctx) {
    pageData.frontmatter.head ??= []
    if (pageData.frontmatter.title == '逮住那只猫！'){
      pageData.frontmatter.head.push([
        'script',
        {
          src: 'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/js/phaser.min.js'
        }
      ])
      pageData.frontmatter.head.push([
        'script',
        {
          src: 'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/js/cat/catch-the-cat.js'
        }
      ])
      pageData.frontmatter.head.push([
        'script',
        {
          src: 'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/js/game.js'
        }
      ])
    }
  },
  // 详见：https://vitepress.dev/zh/reference/site-config#head
  head: [
    // 配置网站的图标（显示在浏览器的 tab 上）
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  markdown: {
    image: {
      // 开启图片懒加载
      lazyLoading: true
    },
    config:(md)=>{
      md.use(footnote_plugin)
    }
  },
  vite: { 
    ssr: { 
      noExternal: [ 
        // 如果还有别的依赖需要添加的话，并排填写和配置到这里即可
        '@nolebase/vitepress-plugin-enhanced-readabilities', 
      ], 
    }, 
  },
  themeConfig: {
    // 展示 2,3 级标题在目录中
    outline: {
      level: [2, 3],
      label: '目录'
    },
    // 默认文案修改
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '相关文章',
    lastUpdatedText: '上次更新于',

    // 设置logo
    logo: '/favicon.ico',
    editLink: {
      pattern:
        'https://github.com/hyperter96/tech-blog/tree/main/docs/:path',
      text: '去 GitHub 上编辑内容'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '面试', items: [
        { text: 'TCP篇', link: '/posts/interview/tcp.html'},
      ]},
      { text: '趣味', items: [
        { text: '逮住那只猫！', link: '/fun/catch-the-cat.html' },
      ]},
      { text: '关于我', link: '/aboutme.html' }
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/hyperter96/tech-blog'
      }
    ]
  },
})
