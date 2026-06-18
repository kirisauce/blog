<script lang="ts" module>
  export interface TreeNode {
    label: string;
    href?: string;
    slug?: string;
    path?: string[];
    children?: TreeNode[];
  }

  function pathsEqual(a?: string[], b?: string[]): boolean {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((seg, i) => seg === b[i]);
  }
</script>

<script lang="ts">
  import { slide } from 'svelte/transition';
  import TreeList from './TreeList.svelte';

  const {
    items,
    depth = 0,
    currentPath,
    // 受控模式 props（TOC 用）
    expanded: externalExpanded,
    onToggle,
    activeSlug,
    onLinkClick,
  }: {
    items: TreeNode[];
    depth?: number;
    currentPath?: string[];
    /** 外部传入的展开状态（slug 为 key），传入时进入受控模式 */
    expanded?: Record<string, boolean>;
    /** 受控模式下的展开回调 */
    onToggle?: (slug: string) => void;
    /** 受控模式下当前活跃的标题 slug */
    activeSlug?: string;
    /** 受控模式下链接点击回调 */
    onLinkClick?: (e: MouseEvent, slug: string) => void;
  } = $props();

  /** 是否处于受控模式 */
  const controlled = $derived(externalExpanded !== undefined);

  // 非受控模式：内部状态
  let internalExpanded = $state<Record<number, boolean>>({});

  function toggleInternal(index: number) {
    internalExpanded[index] = !internalExpanded[index];
  }

  /** 统一判断节点是否展开 */
  function isItemExpanded(item: TreeNode, index: number): boolean {
    if (controlled && item.slug) {
      return !!externalExpanded?.[item.slug];
    }
    return !!internalExpanded[index];
  }

  /** 统一处理展开操作 */
  function handleToggle(item: TreeNode, index: number) {
    if (controlled && item.slug && onToggle) {
      onToggle(item.slug);
    } else {
      toggleInternal(index);
    }
  }

  /** 判断节点是否为当前活跃项 */
  function isItemActive(item: TreeNode): boolean {
    if (controlled && activeSlug !== undefined) {
      return item.slug === activeSlug;
    }
    return pathsEqual(item.path, currentPath);
  }

  /** 判断节点链接是否应渲染为普通文本（当前页） */
  function isCurrentPage(item: TreeNode): boolean {
    if (controlled) return false; // 受控模式下不隐藏链接
    return pathsEqual(item.path, currentPath);
  }
</script>

<ul class="tree-list" class:root={depth === 0} style="--depth: {depth}">
  {#each items as item, i (item.label + i)}
    {@const isExpanded = isItemExpanded(item, i)}
    <li
      class="tree-item"
      class:has-children={item.children && item.children.length > 0}
    >
      <div class="item-row">
        {#if item.children && item.children.length > 0}
          <button
            class="expand-btn"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
            onclick={() => handleToggle(item, i)}
          >
            <svg
              class="chevron"
              class:expanded={isExpanded}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        {:else}
          <span class="indent-spacer"></span>
        {/if}

        {#if item.href && !isCurrentPage(item)}
          <a
            href={item.href}
            class="item-label link"
            class:active={isItemActive(item)}
            onclick={(e) =>
              onLinkClick && item.slug ? onLinkClick(e, item.slug) : undefined}
          >
            {item.label}
          </a>
        {:else}
          <span class="item-label" class:active={isItemActive(item)}>
            {item.label}
          </span>
        {/if}
      </div>

      {#if item.children && item.children.length > 0 && isExpanded}
        <div transition:slide={{ duration: 200 }}>
          <TreeList
            items={item.children}
            depth={depth + 1}
            {currentPath}
            expanded={externalExpanded}
            {onToggle}
            {activeSlug}
            {onLinkClick}
          />
        </div>
      {/if}
    </li>
  {/each}
</ul>

<style lang="stylus">
  .tree-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .tree-item {
    display: flex;
    flex-direction: column;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    padding: 0;
    border: none;
    border-radius: 6px;
    color: var(--text-muted);
    background-color: transparent;
    cursor: pointer;
    transition:
      background-color var(--expressive-default-effects),
      transform var(--expressive-default-spatial);

    &:hover {
      background-color: var(--primary-container);
    }

    &:active {
      transform: scale(0.92);
    }
  }

  .chevron {
    transition: transform var(--expressive-default-spatial);

    &.expanded {
      transform: rotate(90deg);
    }
  }

  .indent-spacer {
    width: 24px;
    flex-shrink: 0;
  }

  .item-label {
    font-size: 1rem;
    color: var(--text);
    line-height: 1.4;

    &.link {
      text-decoration: none;
      padding: 2px 6px;
      border-radius: 4px;
      transition:
        background-color var(--expressive-default-effects),
        color var(--expressive-default-effects);

      &:hover {
        background-color: var(--primary-container);
        color: var(--on-primary-container);
      }
    }

    &.active {
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--on-primary-container);
      background-color: var(--primary-container);
      font-weight: 500;
    }
  }

  // Indent nested levels
  .tree-list:not(.root) {
    padding-left: 12px;
    border-left: 1.5px solid var(--border);
    margin-left: 11px;
  }
</style>
