<script lang="ts" module>
  import type { TreeNode } from './TreeList.svelte';

  export interface TocHeading {
    text: string;
    slug: string;
    depth: number;
  }

  /** 将扁平标题数组构建为层级树结构 */
  function buildTree(headings: TocHeading[]): TreeNode[] {
    const root: TreeNode[] = [];
    const stack: { node: TreeNode; level: number }[] = [];

    for (const h of headings) {
      const node: TreeNode = {
        label: h.text,
        slug: h.slug,
        href: `#${h.slug}`,
        children: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= h.depth) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        stack[stack.length - 1].node.children!.push(node);
      }
      stack.push({ node, level: h.depth });
    }

    return root;
  }

  /** 查找目标标题的所有祖先节点路径 */
  function findAncestors(
    nodes: TreeNode[],
    target: string,
    path: string[] = [],
  ): string[] | null {
    for (const node of nodes) {
      if (node.slug === target) return path;
      if (node.children) {
        const result = findAncestors(node.children, target, [
          ...path,
          node.slug!,
        ]);
        if (result) return result;
      }
    }
    return null;
  }

  /** 判断节点是否拥有子节点 */
  function nodeHasChildren(nodes: TreeNode[], slug: string): boolean {
    for (const node of nodes) {
      if (node.slug === slug) return (node.children?.length ?? 0) > 0;
      if (node.children) {
        const found = nodeHasChildren(node.children, slug);
        if (found) return true;
      }
    }
    return false;
  }
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import TreeList from './TreeList.svelte';

  const {
    headings,
    autoScroll = true,
  }: { headings: TocHeading[]; autoScroll?: boolean } = $props();

  const tree = $derived(buildTree(headings));

  let anchorSlug = $state('');
  /** 当前与滚动容器可视范围相交的标题集合，可多项同时高亮 */
  let visibleSlugs = $state<Set<string>>(new Set());
  let manualExpanded = $state<Record<string, boolean>>({});

  /** 高亮集合：视口内标题 + 它们的各级祖先（上一级跟着亮） */
  const highlightSlugs = $derived.by(() => {
    const all = new Set(visibleSlugs);
    for (const slug of visibleSlugs) {
      const ancestors = findAncestors(tree, slug);
      if (!ancestors) continue;
      for (const a of ancestors) all.add(a);
    }
    return all;
  });

  /** 自动展开视口内标题的祖先链，保证高亮项在目录中可见 */
  const autoExpanded = $derived.by(() => {
    const updates: Record<string, boolean> = {};
    for (const slug of visibleSlugs) {
      const ancestors = findAncestors(tree, slug);
      if (!ancestors) continue;
      for (const a of ancestors) {
        if (!manualExpanded[a] && nodeHasChildren(tree, a)) {
          updates[a] = true;
        }
      }
    }
    return updates;
  });

  /** 合并后的展开状态：手动状态优先于自动展开 */
  const expanded = $derived({ ...autoExpanded, ...manualExpanded });

  let scrollCleanup: (() => void) | null = null;

  /** toc-root DOM 引用，供 $effect 中 scrollIntoView 使用 */
  let tocRoot: HTMLDivElement | null = $state(null);
  /** 用户是否 hover 在 TOC 上，hover 时跳过自动滚动 */
  let isHovering = false;

  function handleMouseEnter() {
    isHovering = true;
  }
  function handleMouseLeave() {
    isHovering = false;
  }

  function toggleManual(slug: string) {
    // 固定为相反状态，手动展开/折叠优先于自动行为
    manualExpanded = { ...manualExpanded, [slug]: !expanded[slug] };
  }

  function handleLinkClick(e: MouseEvent, slug: string) {
    e.preventDefault();
    const el = document.getElementById(slug);
    if (el) {
      const scrollContainer = document.getElementById('page');
      if (scrollContainer) {
        const elTop = el.getBoundingClientRect().top;
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const offset = elTop - containerTop + scrollContainer.scrollTop - 80;
        scrollContainer.scrollTo({ top: offset, behavior: 'smooth' });
      }
      history.replaceState(null, '', `#${slug}`);
    }
  }

  function setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const s of a) if (!b.has(s)) return false;
    return true;
  }

  function updateAnchor(slug: string) {
    if (slug === anchorSlug) return;
    anchorSlug = slug;
  }

  /** 仅在集合内容变化时更新，避免滚动事件高频触发无效重渲染 */
  function setVisible(next: Set<string>) {
    if (setsEqual(visibleSlugs, next)) return;
    visibleSlugs = next;
  }

  // 当锚点变化时，自动将锚点项滚动到 toc-root 可视区域内
  $effect(() => {
    if (!autoScroll) return;
    const slug = anchorSlug;
    const root = tocRoot;
    if (!slug || !root) return;

    requestAnimationFrame(() => {
      if (isHovering) return;
      const anchorItem = root.querySelector<HTMLElement>('.item-label.anchor');
      if (!anchorItem) return;
      // 只在 toc-root 内滚动锚点项至可见；不能用 scrollIntoView——
      // 它会连带滚动祖先滚动容器（.page），目录卡不在视口时整页视角会被拉走
      const rootRect = root.getBoundingClientRect();
      const itemRect = anchorItem.getBoundingClientRect();
      if (itemRect.top < rootRect.top) {
        root.scrollTo({
          top: root.scrollTop + itemRect.top - rootRect.top,
          behavior: 'smooth',
        });
      } else if (itemRect.bottom > rootRect.bottom) {
        root.scrollTo({
          top: root.scrollTop + itemRect.bottom - rootRect.bottom,
          behavior: 'smooth',
        });
      }
    });
  });

  onMount(() => {
    const scrollContainer = document.getElementById('page');
    if (!scrollContainer) return;

    const onScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const threshold = containerRect.top + 100;
      let current = '';
      const visible = new Set<string>();
      for (const h of headings) {
        const el = document.getElementById(h.slug);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          current = h.slug;
        }
        // 与滚动容器可视范围相交即视为在视图内
        if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
          visible.add(h.slug);
        }
      }
      // 屏上没有任何标题（长段落中）时，兜底点亮最后越过的锚点项
      if (visible.size === 0 && current) {
        visible.add(current);
      }
      setVisible(visible);
      updateAnchor(current);
    };

    scrollContainer.addEventListener('scroll', onScroll, {
      passive: true,
    });
    // 初始检查
    onScroll();

    scrollCleanup = () => {
      scrollContainer.removeEventListener('scroll', onScroll);
    };
  });

  onDestroy(() => {
    scrollCleanup?.();
  });
</script>

<!-- TOC 目录树 -->
<div
  class="toc-root"
  role="navigation"
  aria-label="Table of contents"
  bind:this={tocRoot}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <div class="toc-body">
    {#if tree.length > 0}
      <TreeList
        items={tree}
        {expanded}
        activeSlugs={highlightSlugs}
        {anchorSlug}
        onToggle={toggleManual}
        onLinkClick={handleLinkClick}
      />
    {/if}
  </div>
</div>

<style lang="stylus">
  .toc-root {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: unquote("color-mix(in srgb, var(--text) 15%, transparent) transparent");

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: unquote("color-mix(in srgb, var(--text) 15%, transparent)");
      border-radius: 3px;
    }
  }
</style>
