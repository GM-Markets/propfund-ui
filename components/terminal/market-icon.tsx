import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import type { AssetClass, Market } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

const marketIconVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold leading-none tracking-tight",
  {
    variants: {
      assetClass: {
        crypto: "bg-warning/15 text-warning",
        forex: "bg-primary/15 text-primary",
        commodities: "bg-[hsl(38_60%_50%/0.15)] text-[hsl(38_70%_62%)]",
        equities: "bg-success/15 text-success",
      } satisfies Record<AssetClass, string>,
      size: {
        sm: "size-6 text-[9px]",
        md: "size-8 text-[10px]",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

/**
 * Letter mark for a market (no third-party logos). Memoized: it sits in every
 * markets row, position row and price header, none of which change when the
 * price next to it does.
 */
export const MarketIcon = React.memo(function MarketIcon({
  market,
  size,
  className,
}: { market: Pick<Market, "symbol" | "assetClass"> } & Pick<VariantProps<typeof marketIconVariants>, "size"> & {
    className?: string;
  }) {
  return (
    <span aria-hidden="true" className={cn(marketIconVariants({ assetClass: market.assetClass, size }), className)}>
      {market.symbol.slice(0, 3)}
    </span>
  );
});
