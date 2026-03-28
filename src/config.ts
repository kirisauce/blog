import * as cfg from './types/config';

export const site = cfg.defineSiteConfig({
  title: "kirisauce's blog",
  titleTemplate: "kirisauce's blog",
});

export const navbar = cfg.defineNavBarConfig({
  icon: 'mdi:home-variant-outline',
  homeText: 'Home',
});

export const theme = cfg.defineThemeConfig({
  expressiveCode: {
    themeDark: 'andromeeda',
    themeLight: 'rose-pine-dawn',
  },
  defaultHue: 0,
});

export const author = cfg.defineAuthorConfig({
  defaultAuthor: 'kirisauce',
  authors: {
    kirisauce: {
      name: 'kirisauce',
      bio: 'xun',
      avatar:
        'rawimage|https://avatars.githubusercontent.com/u/81839503?v=4&size=64',
      socialLinks: {
        github: 'https://github.com/kirisauce',
        wechat: 'https://wx.qq.com/',
      },
    },
  },
});

export const layout = cfg.defineLayoutConfig({
  basic: {
    aside: 'left',
  },
});
