import type { CollectionEntry, InferEntrySchema } from 'astro:content';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString as markdownToString } from 'mdast-util-to-string';

const DESCRIPTION_MAX_LENGTH = 100;

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

const parseMarkdownPipeline = await unified().use(remarkParse);

export const getPostDescription = (
  post: InferEntrySchema<'blog'>,
  content?: string,
): string | undefined => {
  if (post.description !== undefined && post.description !== null) {
    return post.description;
  } else if (content) {
    const processed = parseMarkdownPipeline.parse(content);
    const rmed = markdownToString(processed).replace(/\s+/g, ' ').trim();
    return rmed.length > DESCRIPTION_MAX_LENGTH
      ? rmed.slice(0, DESCRIPTION_MAX_LENGTH) + '...'
      : rmed;
  } else {
    return undefined;
  }
};

export interface ProcessedPost {
  post: CollectionEntry<'blog'>;
  updateDate?: Date;
  pubDate?: Date;
  description: string | undefined;
  data: InferEntrySchema<'blog'>;
}

export const processPost = (post: CollectionEntry<'blog'>): ProcessedPost => {
  return {
    post,
    updateDate: getPostUpdateDateSync(post.data, post.filePath),
    pubDate: getPostPubDateSync(post.data, post.filePath),
    description: getPostDescription(post.data, post.body),
    data: post.data,
  };
};
