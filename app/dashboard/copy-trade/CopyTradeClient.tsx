"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { toast } from "sonner";

import { AgreementSignCard } from "@/components/agreement-sign-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { friendlyError } from "@/lib/errors";
import {
  VantaBrowserError,
  browserAuth,
  browserCopyTrade,
  percentToScaleBps,
  scaleBpsToPercent,
  type BrowserMe,
  type CopyFill,
  type CopyMarkets,
  type CopySubscription,
  type CopyTradeStatus,
} from "@/lib/vanta/browser";

const LEADER_RE = /^0x[a-fA-F0-9]{40}$/;
const FILLS_MS = 5_000;

function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function money(n: number): string {
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function pickAccount(me: BrowserMe, preferred?: string) {
  return me.prop_accounts.find((a) => a.id === preferred) ?? me.prop_accounts[0];
}

export function CopyTradeClient({
  initialAccountId,
  initialMe,
}: {
  initialAccountId?: string;
  initialMe?: BrowserMe | null;
}) {
  const seeded = initialMe ? pickAccount(initialMe, initialAccountId) : undefined;
  const [me, setMe] = useState<BrowserMe | null>(initialMe ?? null);
  const [accountId, setAccountId] = useState(seeded?.id ?? initialAccountId ?? "");
  const [subs, setSubs] = useState<CopySubscription[]>([]);
  const [fills, setFills] = useState<CopyFill[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leader, setLeader] = useState("");
  const [allocUsd, setAllocUsd] = useState(
    seeded ? String(Math.round(Number(seeded.account_size) * 0.25)) : "",
  );
  const [scalePct, setScalePct] = useState("100");
  const [maxLev, setMaxLev] = useState("5");
  const [markets, setMarkets] = useState<CopyMarkets>("perp");
  const [signed, setSigned] = useState(initialMe?.agreement_signed ?? false);

  const accounts = useMemo(() => me?.prop_accounts ?? [], [me]);
  const selected = useMemo(() => accounts.find((a) => a.id === accountId) ?? accounts[0], [accounts, accountId]);
  const wallet = Number(selected?.account_size ?? 0);
  const allocNum = Number(allocUsd);
  const allocPct = wallet > 0 && Number.isFinite(allocNum) ? Math.min(100, Math.max(0, (allocNum / wallet) * 100)) : 0;
  const live = subs.filter((s) => s.status !== "stopped");
  const stopped = subs.filter((s) => s.status === "stopped");

  async function loadMe() {
    const row = await browserAuth.me();
    setMe(row);
    setSigned(row.agreement_signed);
    const next = row.prop_accounts.find((a) => a.id === (accountId || initialAccountId)) ?? row.prop_accounts[0];
    if (next) {
      setAccountId(next.id);
      setAllocUsd(String(Math.round(Number(next.account_size) * 0.25)));
    }
    return next?.id;
  }

  async function loadSubs(id: string) {
    setSubs(await browserCopyTrade.list(id));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = initialMe ? (seeded?.id ?? accountId) : await loadMe();
        if (!cancelled && id) await loadSubs(id);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof VantaBrowserError ? friendlyError(e.code, e.message) : "Could not load copy trade. Is the gateway running?");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accountId || loading) return;
    void loadSubs(accountId).catch((e) => {
      toast.error(e instanceof VantaBrowserError ? friendlyError(e.code, e.message) : "Could not list subscriptions.");
    });
    setSelectedId(null);
    setFills([]);
    if (selected) setAllocUsd(String(Math.round(Number(selected.account_size) * 0.25)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function pull() {
      try {
        const rows = await browserCopyTrade.fills(selectedId!);
        if (!cancelled) setFills(rows);
      } catch {
        /* keep last rows */
      }
    }
    void pull();
    const t = setInterval(() => void pull(), FILLS_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [selectedId]);

  async function start() {
    const address = leader.trim();
    if (!LEADER_RE.test(address)) {
      toast.error("Enter a 0x Hyperliquid address.");
      return;
    }
    if (!Number.isFinite(allocNum) || allocNum < 10) {
      toast.error("Choose how much of this desk to copy with (at least $10).");
      return;
    }
    if (wallet > 0 && allocNum > wallet + 1e-8) {
      toast.error("Allocation cannot exceed this desk's balance.");
      return;
    }
    const pct = Number(scalePct);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 1000) {
      toast.error("Scale must be between 1% and 1000%.");
      return;
    }
    const lev = Number(maxLev);
    if (!Number.isFinite(lev) || lev < 1 || lev > 50) {
      toast.error("Max leverage must be 1–50.");
      return;
    }
    if (!accountId) return;
    setSaving(true);
    try {
      const row = await browserCopyTrade.start(accountId, {
        leader_address: address,
        scale_bps: percentToScaleBps(pct),
        alloc_usd: allocNum,
        markets,
        max_leverage: lev,
      });
      setSubs((prev) => [row, ...prev.filter((s) => s.id !== row.id)]);
      setLeader("");
      setSelectedId(row.id);
      toast.success("Copying this address on the current desk.");
    } catch (e) {
      toast.error(e instanceof VantaBrowserError ? friendlyError(e.code, e.message) : "Could not start copy trade.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: CopyTradeStatus) {
    try {
      const row = await browserCopyTrade.setStatus(id, status);
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...row } : s)));
    } catch (e) {
      toast.error(e instanceof VantaBrowserError ? friendlyError(e.code, e.message) : "Could not update subscription.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Repeat2}
        title="No desk to copy onto"
        description="Claim a test account or buy a challenge first."
        action={
          <Button asChild>
            <Link href="/dashboard/checkout">Go to checkout</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {!signed && (
        <AgreementSignCard
          version={me?.agreement_version ?? "2026-09-01"}
          onSigned={() => setSigned(true)}
        />
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Desk</CardTitle>
          {selected?.is_test && <Badge variant="secondary">Notional</Badge>}
        </CardHeader>
        <CardContent>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.is_test ? "Test account" : a.tier_id} · ${Number(a.account_size).toLocaleString()} · {a.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow an address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="leader">Hyperliquid address</Label>
            <Input
              id="leader"
              placeholder="0x…"
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label>Markets to copy</Label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1" role="tablist" aria-label="Markets to copy">
              {(
                [
                  { id: "perp", label: "Perps" },
                  { id: "spot", label: "Spot" },
                  { id: "all", label: "All" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={markets === opt.id}
                  onClick={() => setMarkets(opt.id)}
                  className={
                    markets === opt.id
                      ? "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                      : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {markets === "perp"
                ? "Only Hyperliquid perps are copied."
                : markets === "spot"
                  ? "Only USDC spots are copied."
                  : "Perps and spots from this address are copied."}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Label htmlFor="alloc">Desk value to copy</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {wallet > 0
                    ? `This desk is ${money(wallet)}. Copying stops once this budget is used.`
                    : "Choose how much of this desk can be used."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">USDC</span>
                <Input
                  id="alloc"
                  className="w-32 font-mono"
                  inputMode="decimal"
                  value={allocUsd}
                  onChange={(e) => setAllocUsd(e.target.value)}
                />
              </div>
            </div>
            {wallet > 0 && (
              <>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={Math.round(allocPct) || 1}
                  aria-label="Percent of desk to copy with"
                  onChange={(e) => setAllocUsd(String(Math.round((wallet * Number(e.target.value)) / 100)))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      size="sm"
                      variant={Math.round(allocPct) === pct ? "default" : "outline"}
                      onClick={() => setAllocUsd(String(Math.round((wallet * pct) / 100)))}
                    >
                      {pct}%
                    </Button>
                  ))}
                  <span className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
                    {money(Number.isFinite(allocNum) ? allocNum : 0)} · {Math.round(allocPct)}%
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[7rem_6rem_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="scale">Leader scale %</Label>
              <Input id="scale" inputMode="decimal" value={scalePct} onChange={(e) => setScalePct(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lev">Max lev</Label>
              <Input id="lev" inputMode="numeric" value={maxLev} onChange={(e) => setMaxLev(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void start()} loading={saving} disabled={!signed}>
                Start
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Leader scale is size vs each fill (100% = 1:1). Only new fills after you start are copied, up to the desk
            budget.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {live.length === 0 ? (
            <EmptyState
              icon={Repeat2}
              title="Not copying anyone"
              description="Paste a leader address to mirror their fills on this desk."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leader</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Markets</TableHead>
                  <TableHead>Scale</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {live.map((row) => (
                  <TableRow
                    key={row.id}
                    className={selectedId === row.id ? "bg-muted/40" : "cursor-pointer"}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <TableCell className="font-mono text-xs">{shortAddr(row.leader_address)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {Number(row.alloc_usd) > 0 ? money(Number(row.alloc_usd)) : "No cap"}
                    </TableCell>
                    <TableCell>
                      {row.markets === "perp" ? "Perps" : row.markets === "spot" ? "Spot" : "All"}
                    </TableCell>
                    <TableCell>{scaleBpsToPercent(row.scale_bps)}%</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {row.status === "active" ? (
                          <Button variant="ghost" size="sm" onClick={() => void setStatus(row.id, "paused")}>
                            Pause
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => void setStatus(row.id, "active")}>
                            Resume
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => void setStatus(row.id, "stopped")}>
                          Stop
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {stopped.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">{stopped.length} stopped</p>
          )}
        </CardContent>
      </Card>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Copied fills</CardTitle>
          </CardHeader>
          <CardContent>
            {fills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fills copied yet. New leader trades appear here.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Copied</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fills.map((fill) => (
                    <TableRow key={fill.id}>
                      <TableCell className="font-medium">{fill.coin}</TableCell>
                      <TableCell className="capitalize">{fill.side}</TableCell>
                      <TableCell className="font-mono text-xs">{money(fill.leader_notional)}</TableCell>
                      <TableCell className="font-mono text-xs">{money(fill.follower_value)}</TableCell>
                      <TableCell>
                        <StatusBadge status={fill.status} />
                        {fill.error ? <span className="ml-2 text-xs text-destructive">{fill.error}</span> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
