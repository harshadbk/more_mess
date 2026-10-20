/** Tiny className joiner — skips falsy values. */
export const cn = (...classes) => classes.filter(Boolean).join(' ')
