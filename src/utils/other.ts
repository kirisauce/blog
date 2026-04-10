import type { HTMLAttributes } from 'astro/types';

export const generateId = () =>
  Math.random()
    .toString(36)
    .slice(2, 2 + 8);

export const flattenClassList = (
  classList: HTMLAttributes<'div'>['class:list'] | null,
): string[] => {
  if (classList === undefined || classList === null) {
    return [];
  }
  if (typeof classList === 'string') {
    return classList.split(' ').filter((className) => className.trim() !== '');
  }
  if (Object.hasOwn(classList, Symbol.iterator)) {
    return Array.from(classList as Iterable<any>).map((n) => String(n));
  } else {
    return Object.entries(classList)
      .filter(([className, enabled]) => enabled)
      .map(([className, enabled]) => className);
  }
};