<script lang="ts">
  import IconLight from '~icons/mdi/white-balance-sunny?raw';
  import IconDark from '~icons/mdi/moon-and-stars?raw';
  import IconAuto from '~icons/mdi/gear-outline?raw';
  import { type ColorSchemePreference } from '../../types/client';
  import { getAutoClose } from '../../client/toggler';
  import { onDestroy, onMount } from 'svelte';

  const props = $props();
  const pref = window.__PREFERENCES__;
  let elSelf: HTMLDivElement;

  let currentScheme: ColorSchemePreference = $state(pref.colorScheme.value);

  // Preference Synchronization
  const preferenceChangedListener = () => {
    currentScheme = pref.colorScheme.value;
  };
  onMount(() => {
    pref.colorScheme.addEventListener('change', preferenceChangedListener);
  });
  onDestroy(() => {
    pref.colorScheme.removeEventListener('change', preferenceChangedListener);
  });

  const switchColorScheme = (scheme: ColorSchemePreference) => {
    if (pref.colorScheme.value !== scheme) {
      pref.colorScheme.value = scheme;
      currentScheme = scheme;
    }
  };
</script>

{#snippet SwitchButton(icon: any, text: string, scheme: ColorSchemePreference)}
  <button
    aria-label={`Switch color scheme to ${text}`}
    onclick={() => switchColorScheme(scheme)}
    class="cs-switch"
    class:active={currentScheme === scheme}
  >
    <span>{@html icon}</span>
    <span>{text}</span></button
  >
{/snippet}

<div
  id="nav-color-scheme-switch"
  data-toggle-preset="dropdown"
  data-toggler-state="hide"
  style:display="none"
  bind:this={elSelf}
  onpointerdown={(e) => getAutoClose(elSelf)?.ignore?.(e)}
  {...props}
>
  <div>Color Scheme</div>
  {@render SwitchButton(IconLight, 'Light', 'light')}
  {@render SwitchButton(IconDark, 'Dark', 'dark')}
  {@render SwitchButton(IconAuto, 'Auto', 'auto')}
</div>

<style lang="stylus">
  #nav-color-scheme-switch {
    display: flex;
    flex-direction: column;
    font-family: var(--font-monospace);
    gap: 4px;

    .cs-switch {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      color: inherit;
      padding: 6px;
      border-radius: 8px;
      border: none;
      font-family: inherit;
      background-color: transparent;
      cursor: pointer;
      font-size: 20px;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: @border-radius;
        transition:
          background-color var(--expressive-default-effects),
          transform var(--expressive-default-spital);
      }

      &.active {
        cursor: default;

        &::after {
          background-color: var(--secondary-container);
        }
      }

      span {
        display: flex;
        z-index: 5;
      }

      &:hover::after {
        background-color: var(--secondary-container);
      }
    }
  }
</style>
