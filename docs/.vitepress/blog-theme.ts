// 主题独有配置
import { getThemeConfig } from '@sugarat/theme/node'

// 开启RSS支持（RSS配置）
// import type { Theme } from '@sugarat/theme'

// const baseUrl = 'https://sugarat.top'
// const RSS: Theme.RSSOptions = {
//   title: '粥里有勺糖',
//   baseUrl,
//   copyright: 'Copyright (c) 2018-present, 粥里有勺糖',
//   description: '你的指尖,拥有改变世界的力量（大前端相关技术分享）',
//   language: 'zh-cn',
//   image: 'https://img.cdn.sugarat.top/mdImg/MTY3NDk5NTE2NzAzMA==674995167030',
//   favicon: 'https://sugarat.top/favicon.ico',
// }

// 所有配置项，详见文档: https://theme.sugarat.top/
const blogTheme = getThemeConfig({
  // 开启RSS支持
  // RSS,

  // 搜索
  // 默认开启pagefind离线的全文搜索支持（如使用其它的可以设置为false）
  // 如果npx pagefind 时间过长，可以手动将其安装为项目依赖 pnpm add pagefind
  // search: false,

  // 页脚
  footer: {
    // message: '下面 的内容和图标都是可以修改的噢（当然本条内容也是可以隐藏的）',
    copyright: 'MIT License | 皮特ᴾᵗ',
    // icpRecord: {
    //   name: '蜀ICP备19011724号',
    //   link: 'https://beian.miit.gov.cn/'
    // },
    // securityRecord: {
    //   name: '公网安备xxxxx',
    //   link: 'https://www.beian.gov.cn/portal/index.do'
    // },
  },

  // 主题色修改
  themeColor: 'vp-green',

  // 文章默认作者
  author: '皮特ᴾᵗ',

  // 友链
  friend: [
    {
      nickname: '皮特ᴾᵗ',
      des: '你的指尖用于改变世界的力量',
      avatar:
        'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog@gh-pages/selfie.jpeg',
      url: 'https://tech.hyperter.top',
    },
    {
      nickname: '洋洋得意',
      des: '每一帧都是热爱',
      avatar: 'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/yyliao.jpg',
      url: 'https://www.douyin.com/user/MS4wLjABAAAA3944Q_PGRxLuxLSdOlxOoDzJFnDXlpgyr-CO2aJ7tV8?vid=7336569870861045055',
    },
    {
      nickname: '意琦行',
      des: '指月小筑(探索云原生)',
      avatar: 'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/yiqixing.jpg',
      url: 'https://www.lixueduan.com/',
    }
  ],

  comment: {
    repo: 'hyperter96/tech-blog',
    repoId: 'R_kgDOLckbDg',
    category: 'General',
    categoryId: 'DIC_kwDOLckbDs4CdyEa',
    // 自定义展示内容
    label: '评论',
    icon: `<svg enable-background="new 0 0 512 512" height="512px" id="Layer_1" version="1.1" viewBox="0 0 512 512" width="512px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M170.476,166.19h155.097c4.285,0,7.76-3.469,7.76-7.754s-3.475-7.765-7.76-7.765H170.476c-4.285,0-7.754,3.48-7.754,7.765  S166.191,166.19,170.476,166.19z"/><path d="M348.088,203.362H202.74c-4.284,0-7.759,3.469-7.759,7.754s3.475,7.765,7.759,7.765h145.348c4.284,0,7.754-3.48,7.754-7.765  S352.372,203.362,348.088,203.362z"/><path d="M306.695,256.052H170.476c-4.285,0-7.754,3.469-7.754,7.754c0,4.284,3.469,7.754,7.754,7.754h136.219  c4.279,0,7.754-3.47,7.754-7.754C314.448,259.521,310.974,256.052,306.695,256.052z"/><path d="M396.776,86.288H115.225c-29.992,0-54.403,22.562-54.403,50.308v154.83c0,27.735,24.411,50.297,54.403,50.297h166.034  l119.812,83.989v-84.135c27.996-2.038,50.108-23.753,50.108-50.151v-154.83C451.179,108.85,426.768,86.288,396.776,86.288z   M427.906,291.426c0,14.902-13.972,27.025-31.131,27.025h-18.978v62.523l-89.193-62.523h-173.38  c-17.164,0-31.131-12.123-31.131-27.025v-154.83c0-14.913,13.967-27.035,31.131-27.035h281.551  c17.159,0,31.131,12.123,31.131,27.035V291.426z"/></svg>`,
    mobileMinify: false,
    inputPosition: 'bottom',
    lang: 'zh-CN',
    mapping: 'pathname',
  },
  hotArticle: {
    title: '🔥 精选文章',
    nextText: '换一组',
    pageSize: 3,
    empty: '暂无精选内容',
  },
  // 公告
  popover: {
    title: '公告',
    mobileMinify: true,
    body: [
      { type: 'text', content: '👇微信扫码添加好友👇' },
      {
        type: 'image',
        src: 'https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/qrcode3.png'
      },
      {
        type: 'button',
        content: '云原生文档',
        link: 'https://ikubevirt.cn'
      },
      {
        type: 'button',
        content: '生活博客',
        props: {
          type: 'success'
        },
        link: 'https://life.hyperter.top',
      }
    ],
    duration: -1
  },
})

export { blogTheme }
