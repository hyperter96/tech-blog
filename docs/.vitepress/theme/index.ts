import { h } from 'vue'
import BlogTheme from '@sugarat/theme'

// 自定义样式重载
import './style.scss'
import { useData, useRoute } from 'vitepress';
import codeblocksFold from 'vitepress-plugin-codeblocks-fold'; // import method
import 'vitepress-plugin-codeblocks-fold/style/index.scss'; // import style
import { integrateReadabilities } from "./utils/client";
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
import vitepressNprogress from 'vitepress-plugin-nprogress'
import 'vitepress-plugin-nprogress/lib/css/index.css'
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
    Layout: integrateReadabilities(BlogTheme.Layout),
    enhanceApp: (ctx) => {
      vitepressMusic(playlist)
      vitepressNprogress(ctx)
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
    },
    setup() {
      // get frontmatter and route
      const { frontmatter } = useData();
      const route = useRoute();
      // basic use
      codeblocksFold({ route, frontmatter }, true, 400);
    }
  }
// export default BlogTheme;
