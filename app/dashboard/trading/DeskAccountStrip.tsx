import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropAccountSummary } from "@/lib/hsc/client";

import { absMoney, money, pnlClass, type DeskBalance } from "./desk-types";

export function DeskAccountStrip({
  accounts,
  accountId,
  onAccountChange,
  balance,
}: {
  accounts: PropAccountSummary[];
  accountId: string;
  onAccountChange: (id: string) => void;
  balance: DeskBalance | null;
}) {
  const selected = accounts.find((a) => a.id === accountId);
  const pnl = Number(balance?.unrealized_pnl ?? 0);

  return (
    <section className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Account</p>
            {selected?.is_test && <Badge variant="secondary">Notional</Badge>}
          </div>
          <Select value={accountId} onValueChange={onAccountChange}>
            <SelectTrigger className="w-full max-w-full sm:w-[320px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.is_test ? "Test account" : a.tier_id} · {absMoney(a.account_size, 0)} · {a.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {balance && (
          <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-3 sm:w-auto sm:grid-cols-5 sm:gap-x-6">
            <StripStat label="Equity" value={absMoney(balance.equity ?? balance.account_size)} />
            <StripStat label="Cash" value={absMoney(balance.cash)} />
            <StripStat label="Used margin" value={absMoney(balance.used_margin)} />
            <StripStat label="uPnL" value={money(pnl)} className={pnlClass(pnl)} />
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={balance.status} />
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

function StripStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${className ?? ""}`}>{value}</dd>
    </div>
  );
}
