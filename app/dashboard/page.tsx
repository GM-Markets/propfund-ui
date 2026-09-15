import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, Wallet } from "lucide-react";

import { AgreementSignCard } from "@/components/agreement-sign-card";
import { DocsLink } from "@/components/docs/docs-link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as hsc from "@/lib/hsc/client";

export default async function DashboardHome() {
  const [meResult, kyc] = await Promise.all([
    hsc.auth.me().then((data) => ({ ok: true as const, data })).catch((e) => ({
      ok: false as const,
      message: e instanceof hsc.HscApiError ? `${e.code}: ${e.message}` : "Could not load your account.",
    })),
    hsc.kyc.status().catch(() => null),
  ]);
  if (!meResult.ok) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="The desk profile request failed. Refresh, or sign in again if this keeps happening."
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Could not load /v2/me</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="font-mono text-foreground">{meResult.message}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Retry</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const me = meResult.data;
  const accounts = me.prop_accounts ?? [];

  const name = (me.source || me.user_id).slice(0, 10);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Your trading account at a glance."
        actions={
          <>
            <DocsLink href="/docs" label="Docs" />
            <Button asChild>
              <Link href="/dashboard/checkout">
                Buy a challenge <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      {!me.agreement_signed && (
        <div className="mb-6">
          <AgreementSignCard version={me.agreement_version ?? "2026-09-01"} />
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Identity"
          value={<StatusBadge status={kyc?.kyc_status} />}
          icon={ShieldCheck}
          hint={
            kyc && kyc.kyc_status !== "verified" ? (
              <Link href="/dashboard/kyc" className="text-primary hover:underline">
                Complete verification →
              </Link>
            ) : (
              "You're verified and ready to trade."
            )
          }
        />
        <StatCard
          label="Prop accounts"
          value={accounts.length}
          icon={CreditCard}
          hint={
            <Link href="/dashboard/checkout" className="text-primary hover:underline">
              Add an account →
            </Link>
          }
        />
        <StatCard
          label="Account ID"
          value={<span className="font-mono text-sm">{me.user_id.slice(0, 8)}…</span>}
          icon={Wallet}
          hint="Your unique trader identifier."
        />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your prop accounts</h2>
        </div>
        {accounts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No prop accounts yet"
            description="Your $10K notional test account should appear on first login. Buy a challenge anytime."
            action={
              <Button asChild>
                <Link href="/dashboard/checkout">Browse challenges</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {a.is_test ? "Test account" : a.tier_id}
                    </CardTitle>
                    {a.is_test && <Badge variant="secondary">Notional</Badge>}
                  </div>
                  <StatusBadge status={a.status} />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {a.asset_class} · ${Number(a.account_size).toLocaleString()}
                    {a.is_test ? " cash" : ""}
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/trading?prop=${a.id}`}>
                      Trade <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
