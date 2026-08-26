import type { navigate } from 'astro:transitions/client';
import { StoredPreference } from '../client/preference';
import type { Computed } from '../utils/reactive';
import type { ThemeConfig } from './config';

declare class StoredPreference<T> implements EventTarget {}

export type ColorScheme = 'light' | 'dark';
export type ColorSchemePreference = 'light' | 'dark' | 'auto';

export type PreferenceTable = {
  colorScheme: StoredPreference<ColorSchemePreference>;
  themeHue: StoredPreference<number>;
};

export type CakesTable = {
  colorScheme: Computed<ColorScheme>;

  navigate: typeof navigate;
};

export type ConfigTable = {
  readonly theme: ThemeConfig;
};

declare global {
  interface Window {
    __PREFERENCES__: PreferenceTable;
    __CAKES__: CakesTable;
    __CONFIG__: ConfigTable;
  }
}
