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

  let activeSlug = $state('');
  let autoExpanded = $state<Record<string, boolean>>({});
  let manualExpanded = $state<Record<string, boolean>>({});
  /** 合并后的展开状态：自动展开 + 手动展开 */
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
    if (manualExpanded[slug]) {
      const next = { ...manualExpanded };
      delete next[slug];
      manualExpanded = next;
    } else {
      manualExpanded = { ...manualExpanded, [slug]: true };
      // 从自动展开中移除，因为用户已手动接管
      if (autoExpanded[slug]) {
        const next = { ...autoExpanded };
        delete next[slug];
        autoExpanded = next;
      }
    }
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

  function updateActive(slug: string) {
    if (slug === activeSlug) return;

    // 清除自动展开状态（保留手动展开）
    autoExpanded = {};
    activeSlug = slug;

    // 自动展开当前活跃标题的祖先节点
    const ancestors = findAncestors(tree, slug);
    if (ancestors && ancestors.length > 0) {
      const updates: Record<string, boolean> = {};
      for (const a of ancestors) {
        if (!manualExpanded[a] && nodeHasChildren(tree, a)) {
          updates[a] = true;
        }
      }
      autoExpanded = updates;
    }
  }

  // 当 activeSlug 变化时，自动将当前目录项滚动到 toc-root 可视区域内
  $effect(() => {
    if (!autoScroll) return;
    const slug = activeSlug;
    const root = tocRoot;
    if (!slug || !root) return;

    requestAnimationFrame(() => {
      if (isHovering) return;
      const activeItem = root.querySelector<HTMLElement>('.item-label.active');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      for (const h of headings) {
        const el = document.getElementById(h.slug);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            current = h.slug;
          }
        }
      }
      if (current) {
        updateActive(current);
      }
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
        {activeSlug}
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
