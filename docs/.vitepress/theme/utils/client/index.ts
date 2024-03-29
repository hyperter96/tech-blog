import {
  Component,
  h,
} from "vue";
import { 
    NolebaseEnhancedReadabilitiesMenu, 
    NolebaseEnhancedReadabilitiesScreenMenu, 
  } from '@nolebase/vitepress-plugin-enhanced-readabilities'


export const integrateReadabilities = (App: Component) => {
    return () => h(App, undefined, {
        // 为较宽的屏幕的导航栏添加阅读增强菜单
        'nav-bar-content-after': () => h(NolebaseEnhancedReadabilitiesMenu), 
        // 为较窄的屏幕（通常是小于 iPad Mini）添加阅读增强菜单
        'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu), 
      });
};