import { z } from 'astro/zod';
import * as types from './config-types';
import type { In, Out } from './config-types';
export * from './config-types';

const optionalObject = <Obj extends z.ZodObject>(obj: Obj) =>
  obj.optional().transform((x) => obj.parse(x ?? {}));

// ----- Site Config -----

const builtinSites: Record<string, types.ExternalSite> = {
  github: {
    name: 'GitHub',
    icon: 'mdi:github',
  },
  twitter: {
    name: 'Twitter',
    icon: 'mdi:twitter',
  },
  qq: {
    name: 'QQ',
    icon: 'mdi:penguin',
  },
  wechat: {
    name: 'WeChat',
    icon: 'mdi:wechat',
  },
};

export const siteConfig = () =>
  z.object({
    title: z.string(),
    titleTemplate: z.string().optional(),
    description: z.string().optional(),
    lang: z.string().default('en'),

    defaultCover: z.any().optional(),
    coverImageStyle: z
      .enum(['static', 'parallax', 'half-parallax'])
      .default('parallax'),

    externalSites: z
      .record(z.string(), types.externalSite())
      .optional()
      .transform((userSites) => ({
        ...builtinSites,
        ...userSites,
      })),

    copyrightBeginYear: z.number().optional(),
    copyrightAuthor: z
      .string()
      .optional()
      .describe(
        `The author name to be displayed in the copyright notice.\nIf not specified, \`author.defaultAuthor\` will be used instead.`,
      ),

    birthDate: z.date().optional(),
  });

export type SiteConfigInput = In<typeof siteConfig>;
export type SiteConfig = Out<typeof siteConfig>;
export const defineSiteConfig = (config: SiteConfigInput): SiteConfig =>
  siteConfig().parse(config);

// ----- NavBar Config -----

export const navBarConfig = () =>
  z.object({
    icon: z.string().optional(),
    homeText: z.string().optional(),
  });

export type NavBarConfigInput = In<typeof navBarConfig>;
export type NavBarConfig = Out<typeof navBarConfig>;

export const defineNavBarConfig = (config: NavBarConfigInput): NavBarConfig =>
  navBarConfig().parse(config);

// ----- Theme Config -----

export const themeConfig = () =>
  z.object({
    expressiveCode: types.expressiveCodeConfig().default({}),
    defaultHue: z.number().min(0).max(359).default(0),

    themeName: z.string().default('Cakes🍰'),
    themeUrl: z.string().default('https://github.com/kirisauce/astro-cakes'),
  });

export type ThemeConfigInput = In<typeof themeConfig>;
export type ThemeConfig = Out<typeof themeConfig>;

export const defineThemeConfig = (config: ThemeConfigInput): ThemeConfig =>
  themeConfig().parse(config);

// ----- Author Config -----

export const authorConfig = () =>
  z.object({
    defaultAuthor: z.string().optional(),
    defaultAvatarIcon: z.string().default('mdi:android'),
    authors: z.record(z.string(), types.author()).default({}),
  });

export type AuthorConfigInput = In<typeof authorConfig>;
export type AuthorConfig = Out<typeof authorConfig>;
export const defineAuthorConfig = (config: AuthorConfigInput): AuthorConfig =>
  authorConfig().parse(config);

// ----- Layout Config -----

export const layoutConfig = () => {
  const zBasic = z.object({
    aside: z.enum(['left', 'right']).default('left'),
  });

  const zPageFooter = z.object({
    showCopyright: z.boolean().default(true),
    showThemeName: z.boolean().default(true),
    showElapsedSinceBirth: z.boolean().default(true),
    realtimeElapsedSinceBirth: z.boolean().default(true),
  });

  const zHome = z.object({
    latestPostsLimit: z.number().default(20),
  });

  const zComponentSub = {
    PostLinkCard: z.object({
      coverPosition: z.enum(['left', 'right']).default('right'),
      hoverScale: z.number().nullable().default(1.01),
      slideLayerStyle: z
        .enum(['uncover', 'squeeze', 'popout', 'none'])
        .default('popout'),
      slideLayerInitialWidth: types.cssLength(2),
      slideLayerPosition: z.enum(['left', 'right']).default('right'),
      slideLayerOffset: types.cssLength(28),
      slideLayerClickOffset: types.cssLength(40),
    }),
  };

  const zComponent = z.object({
    PostLinkCard: optionalObject(zComponentSub.PostLinkCard),
  });

  return z.object({
    basic: optionalObject(zBasic),
    pageFooter: optionalObject(zPageFooter),
    home: optionalObject(zHome),
    component: optionalObject(zComponent),
  });
};

export type LayoutConfigInput = In<typeof layoutConfig>;
export type LayoutConfig = Out<typeof layoutConfig>;

export const defineLayoutConfig = (config: LayoutConfigInput): LayoutConfig =>
  layoutConfig().parse(config);
