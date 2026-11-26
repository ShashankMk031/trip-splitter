/**
 * Joins defined CSS class names safely under strict noUncheckedIndexedAccess.
 */
export function cx(...classes: ReadonlyArray<string | false | null | undefined>): string {
  return classes.filter((value): value is string => Boolean(value)).join(' ');
}
