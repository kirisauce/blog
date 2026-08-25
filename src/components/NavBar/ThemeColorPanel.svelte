<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { getAutoClose } from '../../client/toggler';

  const props = $props();
  const prefs = window.__PREFERENCES__;

  let displayNumHue = $state(prefs.themeHue.value);

  // Preference Synchronization
  const preferenceChangedListener = () => {
    displayNumHue = prefs.themeHue.value;
    if (elInput) {
      elInput.value = prefs.themeHue.value.toString();
      const pct = (prefs.themeHue.value / 359) * 100;
      elInput.style.setProperty('--hue-pct', `${pct}%`);
    }
  };
  onMount(() => {
    prefs.themeHue.addEventListener('change', preferenceChangedListener);
    if (elInput) {
      const pct = (prefs.themeHue.value / 359) * 100;
      elInput.style.setProperty('--hue-pct', `${pct}%`);
    }
  });
  onDestroy(() => {
    prefs.themeHue.removeEventListener('change', preferenceChangedListener);
  });

  let elSelf: HTMLDivElement;
  let elInput: HTMLInputElement;

  let setPreferenceTimeout: ReturnType<typeof setTimeout> | null = null;

  const oninput = (e: Event) => {
    const pct = (Number(elInput.value) / 359) * 100;
    elInput.style.setProperty('--hue-pct', `${pct}%`);
    if (setPreferenceTimeout === null) {
      setPreferenceTimeout = setTimeout(() => {
        prefs.themeHue.value = Number(elInput.value);
        setPreferenceTimeout = null;
      }, 200);
    }
  };
</script>

<div
  id="nav-theme-color-panel"
  data-toggle-preset="dropdown"
  data-toggler-state="hide"
  style:display="none"
  bind:this={elSelf}
  onpointerdown={(e) => getAutoClose(elSelf)?.ignore?.(e)}
  {...props}
>
  <div class="heading">
    Hue: {displayNumHue.toString().padStart(3, '0')}
    <button
      onclick={() =>
        (prefs.themeHue.value = window.__CONFIG__.theme.defaultHue)}
      >Reset</button
    >
  </div>
  <input
    type="range"
    min="0"
    max="359"
    value={prefs.themeHue.value}
    bind:this={elInput}
    {oninput}
  />
</div>

<style lang="stylus">
  #nav-theme-color-panel {
    display: flex;
    flex-direction: column;
    font-family: var(--font-monospace);
    font-size: 20px;
    gap: 8px;
    view-transition-name: nav-panel-theme-color;

    .heading {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.08em;
      padding: 2px 6px 8px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--border);
    }

    button {
      background-color: var(--secondary-container);
      color: var(--on-secondary-container);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2px 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition:
        background-color var(--expressive-default-effects),
        transform var(--expressive-default-effects);

      &:hover {
        background-color: var(--primary-container);
        color: var(--on-primary-container);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    input[type='range'] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 20px;
      background: transparent;
      cursor: pointer;
      margin: 0;
      padding: 0;

      &::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 3px;
        background: linear-gradient(
          to right,
          var(--primary) 0%,
          var(--primary) var(--hue-pct, 0%),
          var(--secondary-container) var(--hue-pct, 0%)
        );
        transition: background var(--expressive-default-effects);
      }

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        margin-top: -5px;
        border-radius: 50%;
        background-color: var(--primary);
        border: 2px solid var(--surface);
        box-shadow: 0 1px 4px var(--shadow);
        transition: transform var(--expressive-default-effects);

        &:hover {
          transform: scale(1.15);
        }
      }

      &::-moz-range-track {
        height: 6px;
        border-radius: 3px;
        background-color: var(--secondary-container);
      }

      &::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: var(--primary);
        border: 2px solid var(--surface);
        box-shadow: 0 1px 4px var(--shadow);
      }

      &:focus-visible {
        outline: none;

        &::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px var(--primary-container), 0 1px 4px var(--shadow);
        }
      }
    }
  }
</style>
