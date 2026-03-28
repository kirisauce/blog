import { getCollection, type CollectionEntry } from 'astro:content';

export const tagMap = await (async () => {
  const tagMap = new Map<string, CollectionEntry<'blog'>[]>();

  const posts = await getCollection('blog');

  posts.forEach((post) =>
    post.data.tags.forEach((tag) => {
      if (tagMap.has(tag)) {
        tagMap.get(tag)!.push(post);
      } else {
        tagMap.set(tag, [post]);
      }
    }),
  );

  return tagMap;
})();

export const categoryMap = await (async () => {
  const categoryMap = new Map<string, CollectionEntry<'blog'>[]>();

  const posts = await getCollection('blog');

  posts.forEach((post) => {
    if (post.data.category) {
      if (categoryMap.has(post.data.category)) {
        categoryMap.get(post.data.category)!.push(post);
      } else {
        categoryMap.set(post.data.category, [post]);
      }
    }
  });

  return categoryMap;
})();
