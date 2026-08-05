import { cn } from "@/lib/utils";
import {
  BRAND_CYAN_HSL,
  BRAND_MARK_GRAD_ID,
  BRAND_MARK_LETTER,
  BRAND_NAME,
  BRAND_PRIMARY_BRIGHT_HSL,
  BRAND_PRIMARY_DEEP_HSL,
  type BrandKind,
} from "@/lib/brand";

/**
 * PropFund logo lockup. The mark is a rounded sapphire→cyan tile with the
 * Greek capital Phi (Φ); the wordmark uses currentColor so it inherits text
 * color from the shell.
 *
 * - `showWordmark={false}` renders the mark only (collapsed sidebar).
 * - `brand="hyperscaled"` renders the Hyperscaled lockup (docs/API surfaces).
 */
export function Brand({
  className,
  showWordmark = true,
  brand = "propfund",
}: {
  className?: string;
  showWordmark?: boolean;
  brand?: BrandKind;
}) {
  if (brand === "hyperscaled") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/hyperscaled-wordmark.svg"
        alt="Hyperscaled"
        className={cn("h-6 w-auto", className)}
      />
    );
  }

  const gradId = showWordmark ? `${BRAND_MARK_GRAD_ID}-full` : `${BRAND_MARK_GRAD_ID}-mark`;

  const gradient = (
    <defs>
      <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor={`hsl(${BRAND_PRIMARY_DEEP_HSL})`} />
        <stop offset="55%" stopColor={`hsl(${BRAND_PRIMARY_BRIGHT_HSL})`} />
        <stop offset="100%" stopColor={`hsl(${BRAND_CYAN_HSL})`} />
      </linearGradient>
    </defs>
  );

  const mark = (
    <g>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#${gradId})`} />
      <text
        x="16"
        y="16.5"
        fill="white"
        fillOpacity="0.96"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, Georgia, serif"
        fontSize="18"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {BRAND_MARK_LETTER}
      </text>
    </g>
  );

  if (!showWordmark) {
    return (
      <svg
        viewBox="0 0 32 32"
        className={cn("h-7 w-auto", className)}
        role="img"
        aria-label={BRAND_NAME}
      >
        {gradient}
        {mark}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 148 32"
      className={cn("h-6 w-auto", className)}
      role="img"
      aria-label={BRAND_NAME}
    >
      {gradient}
      {mark}
      <text
        x="40"
        y="22"
        fill="currentColor"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontSize="16"
        fontWeight="600"
        letterSpacing="-0.03em"
      >
        {BRAND_NAME}
      </text>
    </svg>
  );
}
