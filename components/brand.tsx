import { useId } from "react";

import { cn } from "@/lib/utils";
import { BRAND_INK, BRAND_LILAC, BRAND_MARK_GRAD_ID, BRAND_NAME, BRAND_PINK, BRAND_SKY } from "@/lib/brand";

/**
 * Propfund logo: a rounded tile carrying two googly eyes, beside the wordmark
 * whose "o" is a third eye. The eyes glance left, which is the whole brand.
 *
 * - `showWordmark={false}` renders the tile alone (favicon, avatar, tight bars).
 * - The wordmark inherits `currentColor`, so it works on any surface.
 */
export function Brand({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  if (!showWordmark) {
    return <BrandMark className={cn("size-7", className)} role="img" aria-label={BRAND_NAME} />;
  }

  return (
    // Tile and wordmark are both sized in em, so one `text-…` class scales the
    // whole lockup and the two can never wrap apart.
    <span
      className={cn("inline-flex shrink-0 items-center gap-[0.45em] whitespace-nowrap text-base", className)}
      role="img"
      aria-label={BRAND_NAME}
    >
      <BrandMark className="size-[1.75em] shrink-0" aria-hidden />
      <Wordmark className="text-[1em]" />
    </span>
  );
}

/** The tile alone. */
export function BrandMark({ className, ...rest }: React.ComponentProps<"svg">) {
  // Unique per instance: a shared gradient id breaks the fill when the first
  // SVG using it is hidden (e.g. the mobile mark on desktop).
  const gradId = `${BRAND_MARK_GRAD_ID}-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 512 512" className={className} {...rest}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={BRAND_PINK} />
          <stop offset="52%" stopColor={BRAND_LILAC} />
          <stop offset="100%" stopColor={BRAND_SKY} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill={`url(#${gradId})`} />
      <circle cx="166" cy="262" r="104" fill="#ffffff" />
      <circle cx="346" cy="262" r="104" fill="#ffffff" />
      <circle cx="140" cy="236" r="46" fill={BRAND_INK} />
      <circle cx="320" cy="236" r="46" fill={BRAND_INK} />
    </svg>
  );
}

/**
 * "propfund" with the o drawn as an eye. Sized in em, so it scales with the
 * surrounding text; `text-…` classes set the size.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap text-base font-semibold tracking-tight text-current",
        className,
      )}
    >
      pr
      <WordmarkEye />
      pfund
    </span>
  );
}

function WordmarkEye() {
  return (
    <span
      aria-hidden="true"
      className="relative mx-[0.04em] inline-block size-[0.78em] shrink-0 translate-y-[0.02em] rounded-full bg-white ring-1 ring-inset ring-black/10"
    >
      <span
        className="absolute left-[0.13em] top-[0.15em] size-[0.34em] rounded-full"
        style={{ backgroundColor: BRAND_INK }}
      />
    </span>
  );
}
