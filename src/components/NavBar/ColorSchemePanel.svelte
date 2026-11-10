<script lang="ts">
  import IconLight from '~icons/mdi/white-balance-sunny?raw';
  import IconDark from '~icons/mdi/moon-and-stars?raw';
  import IconAuto from '~icons/mdi/gear-outline?raw';
  import { type ColorSchemePreference } from '../../types/client';
  import { getAutoClose } from '../../client/toggler';
  import { onDestroy, onMount } from 'svelte';
  import {
    getGlobalPreferences,
    preferencesReadyThen,
  } from '../../client/utils';

  const props = $props();
  let elSelf: HTMLDivElement;

  let currentScheme: ColorSchemePreference = $state('auto');

  // Preference Synchronization
  const preferenceChangedListener = () => {
    const prefs = getGlobalPreferences();
    currentScheme = prefs.colorScheme.value;
  };
  onMount(() => {
    preferencesReadyThen(() => {
      const prefs = getGlobalPreferences();
      preferenceChangedListener();
      prefs.colorScheme.addEventListener('change', preferenceChangedListener);
    });
  });
  onDestroy(() => {
    const prefs = getGlobalPreferences();
    prefs.colorScheme.removeEventListener('change', preferenceChangedListener);
  });

  const switchColorScheme = (scheme: ColorSchemePreference) => {
    const prefs = getGlobalPreferences();
    if (prefs.colorScheme.value !== scheme) {
      prefs.colorScheme.value = scheme;
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
  role="group"
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
    view-transition-name: nav-panel-color-scheme;

    > div:first-child {
      font-weight: bold;
      font-size: 16px;
      letter-spacing: 0.08em;
      padding: 2px 6px 8px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--border);
    }

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
          transform var(--expressive-default-spatial);
      }

      &.active {
        cursor: default;
        color: var(--on-secondary-container);

        &::after {
          background-color: var(--secondary-container);
          box-shadow: inset 0 0 0 2px var(--primary);
        }
      }

      span {
        display: flex;
        z-index: 5;
      }

      &:hover:not(.active)::after {
        background-color: var(--secondary-container);
        transform: scale(1.02);
      }

      &:active:not(.active)::after {
        transform: scale(0.98);
      }
    }
  }
</style>
