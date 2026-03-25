import type { InferEntrySchema } from 'astro:content';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path/posix';

export const getPostPubDate = async (
  post: InferEntrySchema<'blog'>,
  filePath?: string,
): Promise<Date | undefined> => {
  if (post.pubDate) {
    return post.pubDate;
  }
  if (!filePath) {
    return undefined;
  }
  const stat = await fs.stat(filePath);
  return stat.birthtime;
};

export const getPostPubDateSync = (
  post: InferEntrySchema<'blog'>,
  filePath?: string,
): Date | undefined => {
  if (post.pubDate) {
    return post.pubDate;
  }
  if (!filePath) {
    return undefined;
  }
  const stat = fsSync.statSync(filePath);
  return stat.birthtime;
};

export const getPostUpdateDate = async (
  post: InferEntrySchema<'blog'>,
  filePath?: string,
): Promise<Date | undefined> => {
  if (post.updateDate) {
    return post.updateDate;
  }
  if (!filePath) {
    return undefined;
  }
  const stat = await fs.stat(filePath);
  return stat.mtime;
};

export const getPostUpdateDateSync = (
  post: InferEntrySchema<'blog'>,
  filePath?: string,
): Date | undefined => {
  if (post.updateDate) {
    return post.updateDate;
  }
  if (!filePath) {
    return undefined;
  }
  const stat = fsSync.statSync(filePath);
  return stat.mtime;
};

class UrlPrefixer {
  #base: string;

  constructor(base: string, subbase?: string) {
    if (subbase) {
      this.#base = path.resolve(base, subbase);
    } else {
      this.#base = base;
    }
  }

  with(target: string): string {
    return path.resolve(this.#base, target);
  }
}

export const blogurl = new UrlPrefixer(import.meta.env.BASE_URL, 'blog');
