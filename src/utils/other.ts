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

export class Switcher<T extends string | number | symbol, D> {
  #value: T;
  #defaultValue: D | undefined;

  constructor(value: T, defaultValue?: D) {
    this.#value = value;
    this.#defaultValue = defaultValue;
  }

  on<V>(compareValue: T, v1: V): V | D | undefined {
    return this.#value === compareValue ? v1 : this.#defaultValue;
  }

  onMap<M extends Partial<Record<T, any>>>(map: M): M[keyof M] | D | undefined {
    return (
      (Object.entries(map).find(([k, v]) => k === this.#value)?.[1] as
        | M[T]
        | undefined) ?? this.#defaultValue
    );
  }
}

export const apply = <T, R>(v: T, fn: (v: T) => R) => fn(v);
