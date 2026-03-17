import type { ColorScheme, ColorSchemePreference } from '../../types/client';
import { computed } from '../../utils/reactive';
import { StoredPreference, type StoredPreferenceOptions } from '../preference';
import { mayStartViewTransition } from '../utils';

export const preference = <T>(
  key: string,
  options: StoredPreferenceOptions<T>,
) => new StoredPreference(key, options);

//
// Client Side Preferences
//

window.__PREFERENCES__ = {
  colorScheme: preference<ColorSchemePreference>('color-scheme', {
    default() {
      return 'auto';
    },
  }),
};

const matchDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

window.__CAKES__ = {
  colorScheme: computed(
    () => {
      const pref = window.__PREFERENCES__.colorScheme.value;
      if (pref === 'auto') {
        return matchDarkColorScheme.matches ? 'dark' : 'light';
      } else {
        return pref;
      }
    },
    {
      lazy: false,
      subscribes: [matchDarkColorScheme, window.__PREFERENCES__.colorScheme],
    },
  ),
};

((c: typeof window.__CAKES__) => {
  {
    const getEcTheme = (newClass: ColorScheme) =>
      newClass === 'dark'
        ? window.__CONFIG__.theme.expressiveCode.themeDark
        : window.__CONFIG__.theme.expressiveCode.themeLight;
    const doc = document.documentElement;

    c.colorScheme.addEventListener('change', () => {
      const newClass = c.colorScheme.value;
      const oldClass = c.colorScheme.oldValue;
      mayStartViewTransition(() => {
        doc.classList.remove(oldClass);
        doc.classList.add(newClass);

        const dataTheme = getEcTheme(newClass);
        if (dataTheme) {
          doc.setAttribute('data-theme', dataTheme);
        }
      });
    });

    // First-time initialization
    doc.classList.add(c.colorScheme.value);
    const dataTheme = getEcTheme(c.colorScheme.value);
    if (dataTheme) {
      doc.setAttribute('data-theme', dataTheme);
    }
  }
})(window.__CAKES__);
