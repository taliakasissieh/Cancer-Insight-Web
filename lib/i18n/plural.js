/* Arabic count phrases: the noun form depends on the number (1, 2, 3–10, 11–99, 100+). */

const rules = new Intl.PluralRules('ar');
const nf = new Intl.NumberFormat('ar-u-nu-latn');

/**
 * arCount(5, { one: 'دولة واحدة', two: 'دولتان', few: '{n} دول', other: '{n} دولة' }) → "5 دول"
 * Missing forms fall back to `other`.
 */
export function arCount(n, forms) {
  const value = Number(n);
  const category = Number.isFinite(value) ? rules.select(value) : 'other';
  const template = forms[category] ?? forms.other;
  return template.replace('{n}', Number.isFinite(value) ? nf.format(value) : '—');
}
