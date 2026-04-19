import { z } from 'astro/zod';

export type In<T> = z.input<T extends () => any ? ReturnType<T> : T>;
export type Out<T> = z.infer<T extends () => any ? ReturnType<T> : T>;

export const author = () =>
  z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.any().optional(),
    socialLinks: z.record(z.string(), z.string()).default({}),
  });

export type AuthorInput = In<typeof author>;
export type Author = Out<typeof author>;

export const expressiveCodeConfig = () =>
  z.object({
    themeDark: z.string().optional(),
    themeLight: z.string().optional(),
  });

export type ExpressiveCodeConfigInput = In<typeof expressiveCodeConfig>;
export type ExpressiveCodeConfig = Out<typeof expressiveCodeConfig>;

export const externalSite = () =>
  z.object({
    name: z.string(),
    icon: z.any(),
  });

export type ExternalSiteInput = In<typeof externalSite>;
export type ExternalSite = Out<typeof externalSite>;

export const cssLength = (defaultValue?: string | number) =>
  z
    .number()
    .or(z.string())
    .optional()
    .transform((v) => {
      const conv = (iv: typeof v) => {
        if (typeof iv === 'number') {
          if (iv === 0) {
            return '0';
          } else {
            return `${iv}px`;
          }
        } else if (typeof iv === 'string') {
          return iv;
        }
      };

      return conv(v) ?? conv(defaultValue);
    });

export type CssLengthInput = In<typeof cssLength>;
export type CssLength = Out<typeof cssLength>;
