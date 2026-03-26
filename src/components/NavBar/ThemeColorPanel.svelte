<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { getAutoClose } from '../../client/toggler';

  const props = $props();
  const prefs = window.__PREFERENCES__;

  let displayNumHue = $state(prefs.themeHue.value);

  // Preference Synchronization
  const preferenceChangedListener = () => {
    displayNumHue = prefs.themeHue.value;
    if (elInput) elInput.value = prefs.themeHue.value.toString();
  };
  onMount(() => {
    prefs.themeHue.addEventListener('change', preferenceChangedListener);
  });
  onDestroy(() => {
    prefs.themeHue.removeEventListener('change', preferenceChangedListener);
  });

  let elSelf: HTMLDivElement;
  let elInput: HTMLInputElement;

  let setPreferenceTimeout: ReturnType<typeof setTimeout> | null = null;

  const oninput = (e: Event) => {
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
  }

  button {
    background-color: var(--primary-container);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2px 8px;
    font-size: inherit;
    font-family: inherit;
    transition: background-color var(--expressive-default-effects);

    &:hover {
      background-color: var(--secondary-container-hover);
    }
  }
</style>
