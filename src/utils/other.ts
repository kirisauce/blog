import type { InferEntrySchema } from 'astro:content';
import fs from 'fs/promises';
import fsSync from 'fs';

const DESCRIPTION_MAX_LINES = 5;

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

export const getPostDescription = (
  post: InferEntrySchema<'blog'>,
  content?: string,
): string | undefined => {
  if (post.description !== undefined && post.description !== null) {
    return post.description;
  } else if (content) {
    return content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .slice(0, DESCRIPTION_MAX_LINES)
      .join('\n');
  } else {
    return undefined;
  }
};
