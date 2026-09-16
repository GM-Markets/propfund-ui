"use client";

import * as React from "react";
import { ArrowDownToLine, CreditCard, Info, QrCode } from "lucide-react";

import { AddressQr } from "@/components/dashboard/address-qr";
import { DepositStatusBadge, PaymentStatusBadge, TestModeBadge } from "@/components/dashboard/badges";
import { ExternalTextLink, MobileCard, Row, SectionHeading, formatTokenAmount } from "@/components/dashboard/primitives";
import { WalletSkeleton } from "@/components/dashboard/skeletons";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime, formatUsd, truncateAddress } from "@/lib/propfund/format";
import { useDeposits, usePayments, useWallet } from "@/lib/propfund/hooks";
import { CHAINS, DEFAULT_CHAIN, TOKENS, explorerAddressUrl, explorerTxUrl, getChain, getPackage } from "@/lib/propfund/rules";
import type { ChainId, Deposit, Payment } from "@/lib/propfund/types";
import { PAYMENT_METHOD_LABEL } from "@/lib/propfund/view/labels";

/** Wallet (PRD §10.5). */
export function WalletView() {
  const wallet = useWallet();
  const deposits = useDeposits();
  const payments = usePayments();
  const [chain, setChain] = React.useState<ChainId>(DEFAULT_CHAIN);
  const [showQr, setShowQr] = React.useState(false);

  if (wallet === undefined || deposits === undefined || payments === undefined) return <WalletSkeleton />;

  const chainInfo = getChain(chain);
  const chainOptions = CHAINS.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 p-5 sm:p-6 lg:col-span-2" data-testid="wallet-address-card">
          <SectionHeading
            as="h2"
            title="Propfund wallet"
            description="The same address on Arbitrum, Ethereum, Base and BNB Chain"
            className="mb-3"
          />
          {wallet.address ? (
            <>
              <div className="break-all rounded-lg border border-border bg-muted/20 px-3 py-2.5 font-mono text-sm" data-testid="wallet-address">
                {wallet.address}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value={wallet.address} label="Copy address" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={showQr}
                  aria-controls="wallet-qr"
                  onClick={() => setShowQr((v) => !v)}
                >
                  <QrCode />
                  {showQr ? "Hide QR code" : "Show QR code"}
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href={explorerAddressUrl(chain, wallet.address)} target="_blank" rel="noopener noreferrer">
                    View on {chainInfo.name} explorer
                  </a>
                </Button>
              </div>
              {showQr && (
                <div id="wallet-qr" className="mt-4 inline-flex rounded-lg bg-white p-3">
                  <AddressQr value={wallet.address} size={148} label="Propfund wallet QR code" />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Your Propfund wallet is being created. Check back in a moment.</p>
          )}
          <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Payouts are paid in USDC on Arbitrum, to this wallet by default.
          </p>
        </Card>

        <Card className="min-w-0 p-5" data-testid="deposit-credit-card">
          <h2 className="text-sm font-semibold">Deposit balance</h2>
          <p className="text-xs text-muted-foreground">Credit from overpaid deposits</p>
          <div className="mt-4 font-mono text-3xl font-semibold tabular-nums">{formatUsd(wallet.depositCreditUsd, 2)}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Applied automatically to your next challenge. It can&apos;t be withdrawn.
          </p>
        </Card>
      </div>

      <section>
        <SectionHeading title="Balances" description="USDC and USDT in your Propfund wallet, per chain" />
        <SegmentedControl<ChainId> aria-label="Chain" value={chain} onValueChange={setChain} options={chainOptions} size="sm" className="sm:max-w-md" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TOKENS.map((token) => {
            const amount = wallet.balances.find((b) => b.chain === chain && b.token === token)?.amount ?? 0;
            return (
              <Card key={token} className="p-5" data-testid={`balance-${chain}-${token}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{token}</span>
                  <span className="text-xs text-muted-foreground">{chainInfo.name}</span>
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{formatTokenAmount(amount, token)}</div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading title="Deposit history" description="Stablecoin payments for challenges" action={<TestModeBadge />} />
        <DepositHistory deposits={deposits} />
      </section>

      <section>
        <SectionHeading title="Payment history" description="Every challenge payment, by card or stablecoin" />
        <PaymentHistory payments={payments} />
      </section>
    </div>
  );
}

function depositAmount(d: Deposit): number {
  return d.amountReceivedUsd ?? d.amountDueUsd;
}

function DepositTx({ d }: { d: Deposit }) {
  if (!d.txHash) return <span className="text-muted-foreground">—</span>;
  return <ExternalTextLink href={explorerTxUrl(d.chain, d.txHash)}>{truncateAddress(d.txHash, 6, 4)}</ExternalTextLink>;
}

function DepositHistory({ deposits }: { deposits: Deposit[] }) {
  if (deposits.length === 0) {
    return <EmptyState icon={ArrowDownToLine} title="No deposits yet" description="USDC and USDT payments will show here." />;
  }
  return (
    <>
      <Card className="hidden overflow-hidden md:block" data-testid="deposit-history-table">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Token</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="whitespace-nowrap" title={formatDateTime(d.createdAt)}>
                  {formatDate(d.createdAt)}
                </TableCell>
                <TableCell>{getChain(d.chain).name}</TableCell>
                <TableCell>{d.token}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatUsd(depositAmount(d), 2)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <DepositTx d={d} />
                </TableCell>
                <TableCell>
                  <DepositStatusBadge status={d.status} confirmations={d.confirmations} required={d.requiredConfirmations} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ul className="flex flex-col gap-3 md:hidden" data-testid="deposit-history-cards">
        {deposits.map((d) => (
          <li key={d.id}>
            <MobileCard>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {formatTokenAmount(depositAmount(d), d.token)}
                </span>
                <DepositStatusBadge status={d.status} confirmations={d.confirmations} required={d.requiredConfirmations} />
              </div>
              <dl className="mt-2">
                <Row label="Date" value={formatDate(d.createdAt)} />
                <Row label="Chain" value={getChain(d.chain).name} />
                <Row label="Transaction" value={<DepositTx d={d} />} />
              </dl>
            </MobileCard>
          </li>
        ))}
      </ul>
    </>
  );
}

function paymentPackage(p: Payment): string {
  const pkg = getPackage(p.packageId);
  return `${pkg?.name ?? p.packageId}${p.pricing === "rebuy" ? " · rebuy" : ""}`;
}

function PaymentAmount({ p }: { p: Payment }) {
  return (
    <span className="font-mono tabular-nums">
      {formatUsd(p.amountUsd, 2)}
      {p.creditAppliedUsd > 0 && (
        <span className="block text-xs text-muted-foreground">+ {formatUsd(p.creditAppliedUsd, 2)} balance</span>
      )}
    </span>
  );
}

function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <EmptyState icon={CreditCard} title="No payments yet" description="Challenge payments by card or stablecoin will show here." />;
  }
  return (
    <>
      <Card className="hidden overflow-hidden md:block" data-testid="payment-history-table">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{formatDate(p.createdAt)}</TableCell>
                <TableCell>{paymentPackage(p)}</TableCell>
                <TableCell>{PAYMENT_METHOD_LABEL[p.method]}</TableCell>
                <TableCell className="text-right">
                  <PaymentAmount p={p} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={p.status} />
                    {p.failureReason && <span className="text-xs text-muted-foreground">{p.failureReason}</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ul className="flex flex-col gap-3 md:hidden" data-testid="payment-history-cards">
        {payments.map((p) => (
          <li key={p.id}>
            <MobileCard>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{paymentPackage(p)}</span>
                <PaymentStatusBadge status={p.status} />
              </div>
              <dl className="mt-2">
                <Row label="Date" value={formatDate(p.createdAt)} />
                <Row label="Method" value={PAYMENT_METHOD_LABEL[p.method]} />
                <Row label="Amount" value={<PaymentAmount p={p} />} />
              </dl>
            </MobileCard>
          </li>
        ))}
      </ul>
    </>
  );
}
