import { defineConfig } from 'vitepress'

// 导入主题的配置
import { blogTheme } from './blog-theme'

// Vitepress 默认配置
// 详见文档：https://vitepress.dev/reference/site-config
export default defineConfig({
  // 继承博客主题(@sugarat/theme)
  extends: blogTheme,
  lang: 'zh-cn',
  title: '皮特ᴾᵗ的博客技术站',
  description: '热衷于云原生技术，一直为实现自我价值而执着！',
  base: "/tech-blog/", // 部署到github上时访问的根目录
  lastUpdated: true,
  // 详见：https://vitepress.dev/zh/reference/site-config#head
  head: [
    // 配置网站的图标（显示在浏览器的 tab 上）
    ['link', { rel: 'icon', href: '/tech-blog/favicon.ico' }],
  ],
  markdown: {
    image: {
      // 开启图片懒加载
      lazyLoading: true
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
    logo: '/selfie.jpeg',
    editLink: {
      pattern:
        'https://github.com/hyperter96/tech-blog/tree/main/docs/:path',
      text: '去 GitHub 上编辑内容'
    },
    nav: [
      { text: '首页', link: '/' },
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
  }
})
