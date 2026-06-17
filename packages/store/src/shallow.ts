// Shallow equality helper

export type EqualityFn<U> = (a: U, b: U) => boolean

export function shallow<U>(a: U, b: U): boolean {
  if (Object.is(a, b)) return true

  if (typeof a !== 'object' || a === null) return false
  if (typeof b !== 'object' || b === null) return false

  const aKeys = Object.keys(a as any)
  const bKeys = Object.keys(b as any)
  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false
    if (!Object.is((a as any)[key], (b as any)[key])) return false
  }

  return true
}
