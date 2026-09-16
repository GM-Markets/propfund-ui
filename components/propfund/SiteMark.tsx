/**
 * The Propfund logo on the public site: the googly-eye tile, and the wordmark
 * whose "o" is a third eye. Both scale with the surrounding font size.
 */
export function SiteTile({ size = 26 }: { size?: number }) {
  return (
    <svg className="wordmark-tile" width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="pf-site-tile" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#f5acd6" />
          <stop offset="52%" stopColor="#c9b6ff" />
          <stop offset="100%" stopColor="#a8ddff" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#pf-site-tile)" />
      <circle cx="166" cy="262" r="104" fill="#ffffff" />
      <circle cx="346" cy="262" r="104" fill="#ffffff" />
      <circle cx="140" cy="236" r="46" fill="#141413" />
      <circle cx="320" cy="236" r="46" fill="#141413" />
    </svg>
  );
}

export function SiteWordmark() {
  return (
    <span className="wordmark-word">
      pr<span className="wordmark-eye" aria-hidden="true" />pfund
    </span>
  );
}
