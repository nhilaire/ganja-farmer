import type { en } from './en';

// The English dictionary is the reference (the language of the original game): every other language must have exactly the same keys, functions and
// list shapes (with any text). A missing or extra key in a translation is a compile error.
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;

export type Strings = Widen<typeof en>;
