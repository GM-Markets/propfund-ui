"use client";

import { cn } from "@/lib/utils";

import { PerpPicker } from "./PerpPicker";
import { formatPx, marketLabel, type DeskMarket, type MarketType } from "./desk-types";

const TABS: { id: MarketType; label: string }[] = [
  { id: "perp", label: "Perp" },
  { id: "spot", label: "Spot" },
  { id: "outcome", label: "Outcomes" },
];

export function DeskHeaderStrip({
  pair,
  marketType,
  markets,
  onPairChange,
  onMarketTypeChange,
}: {
  pair: string;
  marketType: MarketType;
  markets: DeskMarket[];
  onPairChange: (pair: string) => void;
  onMarketTypeChange: (type: MarketType) => void;
}) {
  const selected = markets.find((m) => m.coin === pair);
  const mid = selected?.mid ?? 0;
  const maxLev = selected?.max_leverage;

  return (
    <header className="desk-header-strip">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-0.5" role="tablist" aria-label="Market type">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={marketType === tab.id}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              marketType === tab.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-accent",
            )}
            onClick={() => onMarketTypeChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="desk-header-picker">
        <PerpPicker
          markets={markets}
          value={pair}
          onChange={onPairChange}
          noun={marketType === "perp" ? "perps" : marketType === "spot" ? "spots" : "outcomes"}
        />
      </div>
      <dl className="desk-header-stat">
        <dt>Mark</dt>
        <dd>{mid > 0 ? formatPx(mid) : "—"}</dd>
      </dl>
      {marketType === "perp" && maxLev ? (
        <dl className="desk-header-stat">
          <dt>Max lev</dt>
          <dd>{maxLev}x</dd>
        </dl>
      ) : (
        <dl className="desk-header-stat">
          <dt>{marketType === "outcome" ? "Contract" : "Pair"}</dt>
          <dd>{selected ? marketLabel(selected) : pair}</dd>
        </dl>
      )}
    </header>
  );
}
