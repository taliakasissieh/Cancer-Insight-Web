'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18n';

function abbreviate(n) {
  if (n == null) return '';
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Counts per year. Bars with a `url` open the search behind them (PubMed year queries);
 * bars without one are plain. `unit` names what is counted (records, trials…).
 */
export default function YearChart({ years = [], label, unit, linkSite = 'PubMed' }) {
  const { t, num } = useI18n();
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
  if (!data.length) return <p className="muted small">{t('chart.yearsUnavailable')}</p>;
  const chartLabel = label || t('chart.yearsLabel');
  const unitText = unit || t('chart.records');
  const H = W < 420 ? 180 : 210;
  const shortYears = W / data.length < 40;
  const padB = 26;
  const padT = 18;
  const max = Math.max(1, ...data.map(d => d.count));
  const slot = W / data.length;
  const bw = Math.min(40, slot * 0.64);

  return (
    <figure className="yearChart" style={{ margin: 0 }} ref={ref} dir="ltr">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="group"
        aria-label={chartLabel}
      >
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
          const desc = t('chart.yearDesc', {
            year: String(d.year),
            partial: d.partial ? t('chart.inProgress') : '',
            count: num(d.count),
            unit: unitText,
            open: d.url ? t('chart.opens', { site: linkSite }) : '',
          })
            .replace(/\s+/g, ' ')
            .trim();
          const Wrap = d.url ? 'a' : 'g';
          const wrapProps = d.url
            ? { href: d.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': desc }
            : { role: 'img', 'aria-label': desc };
          return (
            <Wrap key={d.year} {...wrapProps}>
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
            </Wrap>
          );
        })}
      </svg>
    </figure>
  );
}
