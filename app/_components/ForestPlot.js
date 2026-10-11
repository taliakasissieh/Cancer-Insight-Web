'use client';

/*
  Representation profile drawn as a forest plot: one row per measure, a marker at
  share(cancer) / share(oncology) on a log scale, and a vertical line at 1× ("same share as
  oncology overall"). The shaded band marks ratios below 0.5×, where the Gap Atlas reports
  lower representation. Each row links to the PubMed query behind it.
*/

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18n';
import { fmtRatio, fmtShare } from '../../lib/format';

const MIN = 0.1;
const MAX = 10;
const TICKS = [0.1, 0.33, 0.5, 1, 2, 3, 10];
const TICKS_NARROW = [0.1, 0.5, 1, 2, 10];

/* The SVG is drawn at the container's real width so text stays at its real size. */
function useWidth(initial) {
  const ref = useRef(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setWidth(Math.max(280, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export default function ForestPlot({
  rows,
  groups,
  title,
  compact = false,
  idPrefix = 'fp',
}) {
  const { t, locale } = useI18n();
  const rtl = locale === 'ar';
  const [ref, W] = useWidth(compact ? 480 : 760);
  const narrow = W < 560;
  const labelW = narrow ? Math.min(132, Math.round(W * 0.36)) : compact ? 150 : 250;
  const valueW = compact || narrow ? 50 : 120;
  const showShare = !compact && !narrow;
  const x0 = labelW + 10;
  const x1 = W - valueW - 10;
  const rowH = compact ? 26 : 30;
  const ticks = narrow || compact ? TICKS_NARROW : TICKS;
  const headH = 22;
  const top = showShare ? 18 : 8;

  const x = r => {
    const v = Math.min(MAX, Math.max(MIN, r));
    return (
      x0 + ((Math.log10(v) - Math.log10(MIN)) / (Math.log10(MAX) - Math.log10(MIN))) * (x1 - x0)
    );
  };

  const ordered = [];
  for (const g of groups || [{ id: null, label: null }]) {
    const items = rows.filter(r => (g.id ? r.group === g.id : true));
    if (!items.length) continue;
    if (g.label) ordered.push({ kind: 'group', label: g.label, key: `g-${g.id}` });
    for (const r of items) ordered.push({ kind: 'row', ...r, key: r.id });
  }

  let y = top;
  const placed = ordered.map(item => {
    const h = item.kind === 'group' ? headH : rowH;
    const out = { ...item, y, h };
    y += h;
    return out;
  });
  const plotBottom = y + 4;
  const H = plotBottom + 30;

  const titleId = `${idPrefix}-title`;

  return (
    <div className="forest" ref={ref} dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-labelledby={titleId}>
        <title id={titleId}>{title || t('atlas.profileTitle')}</title>
        <rect
          className="fpZone"
          x={x(MIN)}
          y={top}
          width={x(0.5) - x(MIN)}
          height={plotBottom - top}
        />
        {ticks.map(tick => (
          <g key={tick}>
            <line
              className={tick === 1 ? 'fpNull' : 'fpGrid'}
              x1={x(tick)}
              x2={x(tick)}
              y1={top}
              y2={plotBottom}
              strokeDasharray={tick === 1 ? undefined : '3 4'}
            />
            <text className="fpTick" x={x(tick)} y={plotBottom + 16} textAnchor="middle">
              {tick === 1 && !narrow ? t('atlas.plot.same') : `${tick}×`}
            </text>
          </g>
        ))}
        {showShare && (
          <>
            <text className="fpTick" x={x1 + 62} y={top - 0} textAnchor="end" dy="-1">
              {t('atlas.plot.ratio')}
            </text>
            <text className="fpTick" x={W - 4} y={top - 0} textAnchor="end" dy="-1">
              {t('atlas.plot.share')}
            </text>
          </>
        )}
        {!compact && !narrow && (
          <>
            <text className="fpTick" x={x0} y={H - 1} textAnchor="start">
              {t('atlas.plot.lowerSide')}
            </text>
            <text className="fpTick" x={x1} y={H - 1} textAnchor="end">
              {t('atlas.plot.higherSide')}
            </text>
          </>
        )}

        {placed.map(item => {
          if (item.kind === 'group') {
            return (
              <text key={item.key} className="fpGroup" x={0} y={item.y + item.h - 6}>
                {item.label}
              </text>
            );
          }
          const cy = item.y + item.h / 2;
          const has = item.ratio != null && Number.isFinite(item.ratio);
          const cx = has ? x(item.ratio) : null;
          const lower = item.status === 'lower' || item.status === 'much-lower';
          const context = item.status === 'context';
          const grey = item.status === 'insufficient' || item.status === 'unavailable';
          const fill =
            item.status === 'much-lower'
              ? 'var(--ochre-strong)'
              : lower
                ? 'var(--ochre)'
                : 'var(--ink)';
          const value = has ? fmtRatio(item.ratio) : '—';
          const aria = `${
            has
              ? t('atlas.plot.ariaValue', { label: item.label, value })
              : `${item.label}: ${t('atlas.plot.notAvailable')}`
          }${
            item.share != null
              ? t('atlas.plot.ariaShares', {
                  share: fmtShare(item.share, undefined, locale),
                  baselineShare: fmtShare(item.baselineShare, undefined, locale),
                })
              : ''
          }${context ? t('atlas.plot.ariaContext') : ''}${t('atlas.plot.ariaOpen')}`;

          const content = (
            <g className="fpRow">
              <rect
                className="fpRowBg"
                x={0}
                y={item.y}
                width={W}
                height={item.h}
                fill="transparent"
                rx="4"
              />
              <text
                className="fpLabel"
                x={8}
                y={cy + 4.5}
                direction={rtl ? 'rtl' : 'ltr'}
                textAnchor={rtl ? 'end' : 'start'}
              >
                {narrow || compact ? item.short || item.label : item.label}
              </text>
              {has && (
                <line
                  x1={x(1)}
                  x2={cx}
                  y1={cy}
                  y2={cy}
                  stroke={lower ? 'var(--ochre)' : 'var(--rule-strong)'}
                  strokeWidth="2"
                />
              )}
              {has && !context && !grey && (
                <rect x={cx - 5.5} y={cy - 5.5} width="11" height="11" fill={fill} rx="1.5" />
              )}
              {has && (context || grey) && (
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="var(--paper)"
                  stroke="var(--muted)"
                  strokeWidth="2"
                />
              )}
              {has && item.ratio > MAX && (
                <text className="fpTick" x={x(MAX) + 4} y={cy + 4}>
                  ›
                </text>
              )}
              {has && item.ratio < MIN && (
                <text className="fpTick" x={x(MIN) - 10} y={cy + 4}>
                  ‹
                </text>
              )}
              <text
                className="fpValue"
                x={showShare ? x1 + 62 : W - 4}
                y={cy + 4.5}
                textAnchor="end"
                fontWeight={lower ? 700 : 400}
              >
                {value}
              </text>
              {showShare && item.share != null && (
                <text className="fpTick" x={W - 4} y={cy + 4.5} textAnchor="end">
                  {fmtShare(item.share, undefined, locale)}
                </text>
              )}
            </g>
          );

          return item.url ? (
            <a
              key={item.key}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={aria}
            >
              {content}
            </a>
          ) : (
            <g key={item.key} aria-label={aria} role="img">
              {content}
            </g>
          );
        })}
      </svg>
      <div className="fpLegend" aria-hidden="true" dir={rtl ? 'rtl' : 'ltr'}>
        <span>
          <i className="fpKey similar" /> {t('atlas.plot.keySimilar')}
        </span>
        <span>
          <i className="fpKey lower" /> {t('atlas.plot.keyLower')}
        </span>
        <span>
          <i className="fpKey context" /> {t('atlas.plot.keyContext')}
        </span>
        <span>
          <i className="fpKey zone" /> {t('atlas.plot.keyZone')}
        </span>
      </div>
    </div>
  );
}
