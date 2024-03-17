import { h } from 'vue'
import BlogTheme from '@sugarat/theme'
// import giscusTalk from 'vitepress-plugin-comment-with-giscus';
// import { useData, useRoute } from 'vitepress';
// 自定义样式重载
import './style.scss'

// 自定义主题色
// import './user-theme.css'
import type { Options } from '@nolebase/vitepress-plugin-enhanced-readabilities'
import { 
  NolebaseEnhancedReadabilitiesMenu, 
  NolebaseEnhancedReadabilitiesScreenMenu, 
  InjectionKey,
} from '@nolebase/vitepress-plugin-enhanced-readabilities'
import '@nolebase/vitepress-plugin-enhanced-readabilities/dist/style.css'
import vitepressMusic from 'vitepress-plugin-music'
import 'vitepress-plugin-music/lib/css/index.css'

const playlist = [
  {
    name: '一起看星星（治愈曲）',
    author: '杜贴心',
    file: 'https://hyper2t.github.io/mp3/一起看星星.mp3',
    hide: false,
  },
  {
    name: '安静思考（纯音乐）',
    author: '龙小彤',
    file: 'https://hyper2t.github.io/mp3/安静思考.mp3',
    hide: false,
  },
  {
    name: '将故事写成我们（钢琴曲）',
    author: '林俊杰',
    file: 'https://hyper2t.github.io/mp3/将故事写成我们.mp3',
    hide: false,
  },
  {
    name: '瞬间的永恒（纯音乐）',
    author: '赵海洋',
    file: 'https://hyper2t.github.io/mp3/瞬间的永恒.mp3',
    hide: false,
  },
  {
    name: '点星',
    author: 'MT1990',
    file: 'https://hyper2t.github.io/mp3/点星MT1990.mp3',
    hide: false,
  }
]
export default {
    ...BlogTheme,
    Layout: () => {
      return h(BlogTheme.Layout, undefined, {
        // 为较宽的屏幕的导航栏添加阅读增强菜单
        'nav-bar-content-after': () => h(NolebaseEnhancedReadabilitiesMenu), 
        // 为较窄的屏幕（通常是小于 iPad Mini）添加阅读增强菜单
        'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu), 
      })
    },
    enhanceApp: (ctx) => {
      vitepressMusic(playlist)
      ctx.app.provide(InjectionKey, {
        locales: { // 配置国际化
          'zh-CN': { // 配置简体中文
            title: { 
              title: '阅读增强插件', 
            } 
          }, 
          'en': { // 配置英文
            title: { 
              title: 'Enhanced Readabilities Plugin', 
            } 
          } 
        } 
      } as Options)
    }
  }
// export default BlogTheme;
