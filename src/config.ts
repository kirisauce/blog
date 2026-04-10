import * as cfg from './types/config';

export const site = cfg.defineSiteConfig({
  title: "kirisauce's blog",
  titleTemplate: "kirisauce's blog",

  coverImageStyle: 'half-parallax',
  birthDate: new Date('2026-03-12T21:56:47+08:00'),
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
        bilibili: 'https://space.bilibili.com/398523275',
      },
    },
  },
});

export const layout = cfg.defineLayoutConfig({
  basic: {
    aside: 'left',
  },
});
