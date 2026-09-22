/** Wordmark: a hill with a crown on the summit. */
export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6fb9f" />
            <stop offset="1" stopColor="#9fcc43" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="31" height="31" rx="10" fill="rgba(212,244,124,0.08)" stroke="rgba(212,244,124,0.35)" />
        <path d="M5 24 13 13l3.5 4.5L19.5 14 27 24H5Z" fill="url(#logo-g)" />
        <path d="m12.5 10 1.8-2.6L16 9.2l1.7-1.8 1.8 2.6-.6 2H13.1l-.6-2Z" fill="#e6fb9f" />
      </svg>
      <span className="logo-word">KOTH</span>
    </span>
  );
}
