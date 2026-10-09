/* Brand mark: white medical plus in a teal rounded square. */
export default function Logo({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="logoMark"
    >
      <rect width="32" height="32" rx="8" fill="#1FA8A6" />
      <rect x="13.6" y="7" width="4.8" height="18" rx="1.2" fill="#fff" />
      <rect x="7" y="13.6" width="18" height="4.8" rx="1.2" fill="#fff" />
    </svg>
  );
}
