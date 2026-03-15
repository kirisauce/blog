import { defineNavBarConfig, defineSiteConfig } from './types/config';

export const site = defineSiteConfig({
  title: "kirisauce's blog",
  titleTemplate: "kirisauce's blog",
});

export const navbar = defineNavBarConfig({
  icon: 'mdi:home-variant-outline',
  homeText: 'Home',
});
