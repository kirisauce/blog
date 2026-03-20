import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// const image = () => z.url().transform((url) => {
//   import.meta.glob(url, { base: path.resolve(__dirname, './assets') })
// })

const blog = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/posts" }),
  schema: ({ image }) => z.object({
    title: z.string().default("Untitled"),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    updateDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    category: z.string().optional(),

    coverImage: z.optional(image()),
    coverImageAlt: z.string().optional(),
  }),
})

export const collections = { blog }