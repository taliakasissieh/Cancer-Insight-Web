/* CSV helpers shared by the browser exports and the open-data API.
   Cells that start with = + - @ tab or CR are prefixed with ' so spreadsheets do not run them. */

export function csvCell(value) {
  let s = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Rows to CSV text with a UTF-8 byte-order mark (so Excel reads non-English text correctly). */
export function toCsv(rows) {
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}
