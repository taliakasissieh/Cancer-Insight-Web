import CountLink from './CountLink';
import { fmtShare } from '../../lib/format';

/** Horizontal share bars; counts link to PubMed. */
export default function ShareList({ rows, showShare = true }) {
  const max = Math.max(0.0001, ...rows.map(r => r.share || 0));
  return (
    <ul className="shareList">
      {rows.map(r => (
        <li key={r.id || r.label} className="shareRow">
          <span>{r.label}</span>
          <span className="shareTrack" aria-hidden="true">
            <span
              className="shareFill"
              style={{ width: `${Math.max(1.5, ((r.share || 0) / max) * 100)}%`, display: 'block' }}
            />
          </span>
          <span className="shareValue">
            <CountLink count={r.count} url={r.url} />
            {showShare && r.share != null && <span className="muted">{fmtShare(r.share)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
