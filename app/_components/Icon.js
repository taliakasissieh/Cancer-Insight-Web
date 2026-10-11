/* Inline SVG icon set (decorative by default: aria-hidden). */

const PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.35-4.35',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  bookmark: 'M6 4h12v16l-6-4-6 4V4Z',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  download: 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14',
  chevron: 'm6 9 6 6 6-6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  alert:
    'M12 9v4m0 4h.01M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z',
  check: 'm5 12 4.5 4.5L19 7',
  filter: 'M4 5h16l-6 7.5V19l-4-2v-4.5L4 5Z',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  image: 'M4 5h16v14H4zM4 15l4.5-4.5L13 15l2.5-2.5L20 17M15.5 9.5h.01',
  arrowLeft: 'M19 12H5m6-6-6 6 6 6',
  quote: 'M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6',
};

export default function Icon({ name, size = 18, filled = false, className = '', title }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}
