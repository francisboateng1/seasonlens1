export function isValidDateString(value, format = 'YYYYMMDD') {
  if (typeof value !== 'string') return false;
  const match = value.match(format === 'YYYY-MM-DD' ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  return date.getUTCFullYear() === +y && date.getUTCMonth() === +m - 1 && date.getUTCDate() === +d;
}
export function toIsoDate(value) {
  if (typeof value !== 'string') return null;
  if (/^\d{8}$/.test(value)) return `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`;
  return isValidDateString(value, 'YYYY-MM-DD') ? value : null;
}
export function toPowerDate(value) { const iso = toIsoDate(value); return iso?.replaceAll('-', '') || null; }
export function utcDateOffset(days, from = new Date()) {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0,10);
}
