<script lang="ts" module>
  export interface TreeNode {
    label: string;
    href?: string;
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
  }: {
    items: TreeNode[];
    depth?: number;
    currentPath?: string[];
  } = $props();

  let expanded = $state<Record<number, boolean>>({});

  function toggle(index: number) {
    expanded[index] = !expanded[index];
  }
</script>

<ul class="tree-list" class:root={depth === 0} style="--depth: {depth}">
  {#each items as item, i (item.label + i)}
    <li class="tree-item" class:has-children={item.children && item.children.length > 0}>
      <div class="item-row">
        {#if item.children && item.children.length > 0}
          <button
            class="expand-btn"
            aria-label={expanded[i] ? 'Collapse' : 'Expand'}
            aria-expanded={!!expanded[i]}
            onclick={() => toggle(i)}
          >
            <svg
              class="chevron"
              class:expanded={!!expanded[i]}
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

        {#if item.href && !pathsEqual(item.path, currentPath)}
          <a href={item.href} class="item-label link">
            {item.label}
          </a>
        {:else}
          <span class="item-label" class:active={pathsEqual(item.path, currentPath)}>
            {item.label}
          </span>
        {/if}
      </div>

      {#if item.children && item.children.length > 0 && expanded[i]}
        <div transition:slide={{ duration: 200 }}>
          <TreeList items={item.children} depth={depth + 1} {currentPath} />
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
