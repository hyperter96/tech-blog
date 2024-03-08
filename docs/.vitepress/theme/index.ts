import BlogTheme from '@sugarat/theme'
// import giscusTalk from 'vitepress-plugin-comment-with-giscus';
// import { useData, useRoute } from 'vitepress';
// 自定义样式重载
import './style.scss'

// 自定义主题色
// import './user-theme.css'

import vitepressMusic from 'vitepress-plugin-music'
import 'vitepress-plugin-music/lib/css/index.css'

const playlist = [
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
    enhanceApp: (ctx) => {
      vitepressMusic(playlist)
    }
  }
// export default BlogTheme;
