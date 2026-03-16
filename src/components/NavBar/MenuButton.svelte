<script lang="ts">
  import { toggle } from '../../client/toggler';

  const {
    target,
    children,
  }: {
    target: string;
    children?: any;
  } = $props();

  function onclick(event: Event) {
    const el = document.querySelector(target) as HTMLElement;
    if (!el) return;
    toggle(el, { autoCloseWhen: 'pointerdown' });
    event.stopPropagation();
  }
</script>

<button class="square-button" {onclick}>
  {@render children()}
</button>

<style lang="stylus">
  button {
    display: flex;
    color: inherit;
    flex-direction: row;
    align-items: center;
    padding: 6px;
    border: none;
    border-radius: 4px;
    background-color: transparent;
    transition: background-color var(--expressive-default-effects);
    border-radius: 6px;

    &:hover {
      background-color: var(--primary-container);
    }

    &:active {
      background-color: var(--secondary-container);
    }
  }
</style>
