import { z } from 'astro/zod';

// ----- Site Config -----

export const zSiteConfig = z.object({
  title: z.string(),
  titleTemplate: z.string().optional(),
  lang: z.string().default('en'),

  coverImageStyle: z
    .enum(['static', 'parallax', 'half-parallax'])
    .default('parallax'),
});

export type SiteConfig = z.infer<typeof zSiteConfig>;
export type SiteConfigInput = z.input<typeof zSiteConfig>;
export const defineSiteConfig = (config: SiteConfigInput): SiteConfig =>
  zSiteConfig.parse(config);

// ----- NavBar Config -----

export const zNavBarConfig = z.object({
  icon: z.string().optional(),
  homeText: z.string().optional(),
});

export type NavBarConfig = z.infer<typeof zNavBarConfig>;
export type NavBarConfigInput = z.input<typeof zNavBarConfig>;

export const defineNavBarConfig = (config: NavBarConfigInput): NavBarConfig =>
  zNavBarConfig.parse(config);
