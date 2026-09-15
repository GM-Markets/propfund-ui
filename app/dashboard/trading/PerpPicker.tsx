"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { displayCoin, formatPx, type DeskMarket } from "./desk-types";

export function PerpPicker({
  markets,
  value,
  onChange,
  noun = "perps",
}: {
  markets: DeskMarket[];
  value: string;
  onChange: (coin: string) => void;
  noun?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const selected = markets.find((m) => m.coin === value);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return markets;
    return markets.filter((m) => {
      const label = displayCoin(m.coin).toLowerCase();
      return label.includes(needle) || m.coin.toLowerCase().includes(needle);
    });
  }, [markets, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm"
      >
        <span className="min-w-0 flex-1 truncate font-medium">{displayCoin(value)}</span>
        {selected && selected.mid > 0 ? (
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {formatPx(selected.mid)}
          </span>
        ) : null}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${markets.length} ${noun}`}
              className="w-full bg-transparent py-1 text-sm outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matching {noun}</li>
            ) : (
              filtered.map((m) => (
                <li key={m.coin}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={m.coin === value}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-accent",
                      m.coin === value && "bg-accent",
                    )}
                    onClick={() => {
                      onChange(m.coin);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    <span className="min-w-0 truncate font-medium">{displayCoin(m.coin)}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {m.mid > 0 ? formatPx(m.mid) : "—"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
