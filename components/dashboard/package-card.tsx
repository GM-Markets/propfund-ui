import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/propfund/format";
import { DAILY_LOSS_PCT, MAX_LOSS_PCT, TARGET_PCT } from "@/lib/propfund/rules";
import type { ChallengePackage } from "@/lib/propfund/types";
import type { CheckoutView } from "@/lib/propfund/view/checkout";
import { cn } from "@/lib/utils";

const pct = (f: number) => `${Math.round(f * 100)}%`;

export function PackageCard({
  pkg,
  view,
  selected,
  onSelect,
}: {
  pkg: ChallengePackage;
  view: CheckoutView;
  selected: boolean;
  onSelect: () => void;
}) {
  const { price, rebuyOpen } = view;
  return (
    <Card
      className={cn(
        "flex h-full flex-col p-5 transition-colors",
        selected ? "border-primary/60 shadow-glow" : "hover:border-primary/30",
      )}
      data-testid={`package-${pkg.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{pkg.name}</h3>
        {rebuyOpen && <Badge className="px-2 text-[10px]">20% off</Badge>}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
        {formatUsd(pkg.accountSize)}
      </div>

      <div className="mt-4 min-h-[3.25rem]">
        {rebuyOpen ? (
          <>
            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <s className="text-sm text-muted-foreground" aria-label={`Full fee ${formatUsd(price.fullFee)}`}>
                {formatUsd(price.fullFee)}
              </s>
              <span className="text-lg font-semibold" aria-label={`Rebuy fee ${formatUsd(price.rebuyFee)}`}>
                {formatUsd(price.rebuyFee)}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-primary">{price.discountLabel}</div>
          </>
        ) : (
          <>
            <div className="font-mono text-lg font-semibold tabular-nums">{formatUsd(price.fullFee)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">One-time fee</div>
          </>
        )}
      </div>

      <dl className="mt-4 flex-1 border-t border-border pt-3 text-xs">
        <div className="flex justify-between gap-2 py-1">
          <dt className="text-muted-foreground">Daily loss ({pct(DAILY_LOSS_PCT)})</dt>
          <dd className="font-mono tabular-nums">{formatUsd(pkg.dailyLossLimit)}</dd>
        </div>
        <div className="flex justify-between gap-2 py-1">
          <dt className="text-muted-foreground">Max loss ({pct(MAX_LOSS_PCT)})</dt>
          <dd className="font-mono tabular-nums">{formatUsd(pkg.maxLossLimit)}</dd>
        </div>
        <div className="flex justify-between gap-2 py-1">
          <dt className="text-muted-foreground">Target ({pct(TARGET_PCT)})</dt>
          <dd className="font-mono tabular-nums">{formatUsd(pkg.target)}</dd>
        </div>
      </dl>

      <Button
        type="button"
        className="mt-4 w-full"
        variant={selected ? "default" : "secondary"}
        onClick={onSelect}
        aria-label={`Select ${pkg.name} ${formatUsd(pkg.accountSize)}`}
      >
        Select
      </Button>
    </Card>
  );
}
