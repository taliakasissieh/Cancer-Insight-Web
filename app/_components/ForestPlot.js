'use client';

/*
  Representation profile drawn as a forest plot: one row per measure, a marker at
  share(cancer) / share(oncology) on a log scale, and a vertical line at 1× ("same share as
  oncology overall"). The shaded band marks ratios below 0.5×, where the Gap Atlas reports
  lower representation. Each row links to the PubMed query behind it.
*/

import { useEffect, useRef, useState } from 'react';
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
  title = 'Representation relative to oncology overall',
  compact = false,
  idPrefix = 'fp',
}) {
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
    <div className="forest" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" aria-labelledby={titleId}>
        <title id={titleId}>{title}</title>
        <rect
          className="fpZone"
          x={x(MIN)}
          y={top}
          width={x(0.5) - x(MIN)}
          height={plotBottom - top}
        />
        {ticks.map(t => (
          <g key={t}>
            <line
              className={t === 1 ? 'fpNull' : 'fpGrid'}
              x1={x(t)}
              x2={x(t)}
              y1={top}
              y2={plotBottom}
              strokeDasharray={t === 1 ? undefined : '3 4'}
            />
            <text className="fpTick" x={x(t)} y={plotBottom + 16} textAnchor="middle">
              {t === 1 && !narrow ? '1× (same)' : `${t}×`}
            </text>
          </g>
        ))}
        {showShare && (
          <>
            <text className="fpTick" x={x1 + 62} y={top - 0} textAnchor="end" dy="-1">
              ratio
            </text>
            <text className="fpTick" x={W - 4} y={top - 0} textAnchor="end" dy="-1">
              share
            </text>
          </>
        )}
        {!compact && !narrow && (
          <>
            <text className="fpTick" x={x0} y={H - 1} textAnchor="start">
              ← lower share than oncology
            </text>
            <text className="fpTick" x={x1} y={H - 1} textAnchor="end">
              higher share →
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
          const aria = `${item.label}: ${has ? `${value} the oncology-wide share` : 'not available'}${
            item.share != null
              ? `, ${fmtShare(item.share)} of records versus ${fmtShare(item.baselineShare)} across oncology`
              : ''
          }${context ? ', expected for this cancer’s population' : ''}. Opens the PubMed search.`;

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
              <text className="fpLabel" x={8} y={cy + 4.5}>
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
                  {fmtShare(item.share)}
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
      <div className="fpLegend" aria-hidden="true">
        <span>
          <i className="fpKey similar" /> share relative to oncology
        </span>
        <span>
          <i className="fpKey lower" /> lower representation (&lt; 0.5×)
        </span>
        <span>
          <i className="fpKey context" /> explained by population or too few records
        </span>
        <span>
          <i className="fpKey zone" /> below 0.5×
        </span>
      </div>
    </div>
  );
}
