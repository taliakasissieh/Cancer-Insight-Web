import { fmtInt } from '../../lib/format';

/** A PubMed record count that opens the exact query that produced it. */
export default function CountLink({ count, url, children, label }) {
  const text = children ?? fmtInt(count);
  if (count == null) return <span className="num muted">unavailable</span>;
  if (!url) return <span className="num">{text}</span>;
  return (
    <a
      className="countLink"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label || 'Open this exact search on PubMed'}
    >
      {text}
      <span className="visuallyHidden"> (opens the PubMed search in a new tab)</span>
    </a>
  );
}
