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

export class CategoryMap<T> {
  list: T[];
  submap: Map<string, CategoryMap<T>> | undefined;

  constructor(posts?: T[]) {
    this.list = posts ?? [];
    this.submap = new Map();
  }

  collectValues(): T[] {
    if (this.submap) {
      return this.list.concat(
        this.submap
          .values()
          .flatMap((map) => map.collectValues())
          .toArray(),
      );
    } else {
      return this.list;
    }
  }

  index(path: string[] | undefined): CategoryMap<T> | undefined {
    if (path === undefined || path.length === 0) {
      return this;
    } else {
      let n = 0;
      let curNode: CategoryMap<T> = this;
      while (n < path.length) {
        const key = path[n];
        if (!curNode.submap) {
          return undefined;
        }
        if (!curNode.submap.has(key)) {
          return undefined;
        }
        curNode = curNode.submap.get(key)!;
        n++;
      }
      return curNode;
    }
  }

  indexOrCreate(path: string[] | undefined) {
    if (path === undefined || path.length === 0) {
      return this;
    } else {
      if (!this.submap) {
        this.submap = new Map();
      }
      let n = 0;
      let curNode: CategoryMap<T> = this;
      while (n < path.length) {
        const key = path[n];
        if (!curNode.submap) {
          curNode.submap = new Map();
        }
        if (!curNode.submap.has(key)) {
          curNode.submap.set(key, new CategoryMap());
        }
        curNode = curNode.submap.get(key)!;
        n++;
      }

      return curNode;
    }
  }

  push(value: T) {
    this.list.push(value);
  }

  pushToOrCreate(path: string[] | undefined, value: T): CategoryMap<T> {
    const submap = this.indexOrCreate(path);
    submap.push(value);
    return submap;
  }
}

export const parseCategoryIndex = (category: string) => {
  const result: Array<string> = [];
  let lastSlash = 0;
  let searchBegin = 0;
  while (true) {
    if (searchBegin >= category.length) {
      throw new Error('Category cannot end with /');
    }

    const newI = category.indexOf('/', searchBegin);
    if (newI < 0) {
      result.push(category.substring(lastSlash).replaceAll('//', '/'));
      break;
    } else if (newI === 0) {
      throw new Error('Category cannot start with /');
    }

    if (category[newI + 1] === '/') {
      searchBegin = newI + 2;
      continue;
    }

    result.push(category.substring(lastSlash, newI).replaceAll('//', '/'));
    searchBegin = newI + 1;
    lastSlash = searchBegin;
  }

  return result;
};

export const joinCategoryPath = (path: string[]) =>
  path.map((seg) => seg.replaceAll('/', '%2f')).join('/');

export const categoryMap = await (async () => {
  const categoryMap = new CategoryMap<CollectionEntry<'blog'>>();

  const posts = await getCollection('blog');

  posts.forEach((post) => {
    if (!post.data.category) {
      return;
    }

    const parsed = parseCategoryIndex(post.data.category);
    categoryMap.pushToOrCreate(parsed, post);
  });

  return categoryMap;
})();

export const flattenCategoryMap = await (async () => {
  // 递归收集所有分类路径
  const collectAllPaths = (
    map: typeof categoryMap,
    currentPath: string[] = [],
  ): Array<{
    path: string[];
    node: CategoryMap<CollectionEntry<'blog'>>;
  }> => {
    if (!map.submap || map.submap.size == 0) {
      return [];
    }

    const result: ReturnType<typeof collectAllPaths> = [];

    for (const [key, subMap] of map.submap.entries()) {
      const newPath = [...currentPath, key];
      // 添加当前路径
      result.push({
        path: newPath,
        node: subMap,
      });
      // 递归添加子路径
      result.push(...collectAllPaths(subMap, newPath));
    }

    return result;
  };

  return collectAllPaths(categoryMap);
})();
