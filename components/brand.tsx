import { cn } from "@/lib/utils";
import { BRAND_NAME, type BrandKind } from "@/lib/brand";

/**
 * Official Propfund lockup. Light wordmark on dark chrome (dashboard / docs);
 * dark wordmark is used on paper (marketing login).
 */
export function Brand({
  className,
  showWordmark = true,
  brand = "propfund",
  variant = "onDark",
}: {
  className?: string;
  showWordmark?: boolean;
  brand?: BrandKind;
  variant?: "onDark" | "onPaper";
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

  if (!showWordmark) {
    const mark = variant === "onPaper" ? "/brand/propfund-mark-dark.svg" : "/brand/propfund-mark-light.svg";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mark} alt={BRAND_NAME} className={cn("h-7 w-auto", className)} />
    );
  }

  const wordmark =
    variant === "onPaper" ? "/brand/propfund-wordmark-dark.svg" : "/brand/propfund-wordmark-light.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={wordmark} alt={BRAND_NAME} className={cn("h-6 w-auto", className)} />
  );
}
