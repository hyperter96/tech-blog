---
head:
  - - script
    - src: '/tech-blog/assets/js/phaser.min.js'
  - - script
    - src: '/tech-blog/assets/js/catch-the-cat.js'
  - - script
    - src: '/tech-blog/assets/js/game.js'
      defer: 'defer'
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/catch-the-cat.jpg
tags:
 - 其它
---

# 逮住那只猫！

## 游戏规则

1. 点击小圆点，围住小猫。
2. 你点击一次，小猫走一次。
3. 直到你把小猫围住（赢），或者小猫走到边界并逃跑（输）。
---

<div align="center">
    <div id="catch-the-cat"></div>
</div>

{{ head }}

<script setup>
    import { useData } from 'vitepress'
    const { head }= useData()
</script>