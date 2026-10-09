'use client';

import { useEffect, useRef, useState } from 'react';
import { fmtInt } from '../../lib/format';

function abbreviate(n) {
  if (n == null) return '';
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** PubMed records per publication year; each bar opens its year query. */
export default function YearChart({ years = [], label = 'PubMed records per publication year' }) {
  const ref = useRef(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(e => {
      const w = Math.round(e[0].contentRect.width);
      if (w > 0) setW(Math.max(260, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const data = years.filter(y => y.count != null);
  if (!data.length) return <p className="muted small">Yearly counts are unavailable right now.</p>;
  const H = W < 420 ? 180 : 210;
  const shortYears = W / data.length < 40;
  const padB = 26;
  const padT = 18;
  const max = Math.max(1, ...data.map(d => d.count));
  const slot = W / data.length;
  const bw = Math.min(40, slot * 0.64);

  return (
    <figure className="yearChart" style={{ margin: 0 }} ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-label={label}>
        <defs>
          <pattern
            id="ycHatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="#ffffff" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#1FA8A6" strokeWidth="2.5" />
          </pattern>
        </defs>
        <line className="ycBase" x1="0" x2={W} y1={H - padB} y2={H - padB} />
        {data.map((d, i) => {
          const h = ((H - padB - padT) * d.count) / max;
          const cx = slot * i + slot / 2;
          const y = H - padB - h;
          const desc = `${d.year}${d.partial ? ' (year in progress)' : ''}: ${fmtInt(d.count)} records. Opens the PubMed search.`;
          return (
            <a
              key={d.year}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={desc}
            >
              <title>{desc}</title>
              <rect
                className={d.partial ? 'ycPartial' : 'ycBar'}
                x={cx - bw / 2}
                y={y}
                width={bw}
                height={Math.max(1, h)}
                rx="2"
              />
              <text className="ycValue" x={cx} y={y - 5} textAnchor="middle">
                {abbreviate(d.count)}
              </text>
              <text className="ycAxis" x={cx} y={H - 8} textAnchor="middle">
                {shortYears ? `’${String(d.year).slice(-2)}` : d.year}
              </text>
            </a>
          );
        })}
      </svg>
    </figure>
  );
}
