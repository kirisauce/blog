import type { ColorSchemePreference } from '../../types/client';
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
    c.colorScheme.addEventListener('change', () => {
      const newClass = c.colorScheme.value;
      const oldClass = c.colorScheme.oldValue;
      mayStartViewTransition(() => {
        document.documentElement.classList.remove(oldClass);
        document.documentElement.classList.add(newClass);
      });
    });
    document.documentElement.classList.add(c.colorScheme.value);
  }
})(window.__CAKES__);
