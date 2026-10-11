/* Fill a translated template whose {placeholders} are React nodes (links, emphasis).
   Plain JS (no JSX) so it works in server components, client components and tests. */

import { Fragment, createElement } from 'react';

export function richText(template, parts = {}) {
  const pieces = String(template).split(/(\{\w+\})/g);
  return pieces.map((piece, i) => {
    const m = piece.match(/^\{(\w+)\}$/);
    const content = m && parts[m[1]] !== undefined ? parts[m[1]] : piece;
    return createElement(Fragment, { key: i }, content);
  });
}
