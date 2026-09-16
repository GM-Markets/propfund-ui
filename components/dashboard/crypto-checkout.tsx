"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CandlestickChart, Info, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { AddressQr } from "@/components/dashboard/address-qr";
import { ExternalTextLink, Row, formatTokenAmount } from "@/components/dashboard/primitives";
import { Stepper } from "@/components/dashboard/stepper";
import { withToast } from "@/components/dashboard/with-toast";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUsd, truncateAddress } from "@/lib/propfund/format";
import { actions, useDeposit, useWallet } from "@/lib/propfund/hooks";
import {
  CHAINS,
  DEFAULT_CHAIN,
  DEPOSIT_WARNING,
  NETWORK_FEE_NOTE,
  TOKENS,
  explorerTxUrl,
  getChain,
} from "@/lib/propfund/rules";
import type { ChainId, ChallengePackage, Deposit, DepositSource, TokenSymbol } from "@/lib/propfund/types";
import { depositOutcome, depositSteps } from "@/lib/propfund/view/deposit-steps";

type Tab = "wallet" | "external";

const CHAIN_OPTIONS = CHAINS.map((c) => ({ value: c.id, label: c.name }));
const TOKEN_OPTIONS = TOKENS.map((t) => ({ value: t, label: t }));

/** Stablecoin checkout (PRD §4): chain → token → from your wallet / send from anywhere → live status. */
export function CryptoCheckout({
  pkg,
  amountDueUsd,
  agreedToTerms,
  onClose,
  onDepositChange,
}: {
  pkg: ChallengePackage;
  amountDueUsd: number;
  agreedToTerms: boolean;
  onClose: () => void;
  /** True while a deposit is in progress or settled (the sheet hides its Back button). */
  onDepositChange?: (hasDeposit: boolean) => void;
}) {
  const wallet = useWallet();
  const [chain, setChain] = React.useState<ChainId>(DEFAULT_CHAIN);
  const [token, setToken] = React.useState<TokenSymbol>("USDC");
  const [tab, setTab] = React.useState<Tab>("wallet");
  const [depositId, setDepositId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const deposit = useDeposit(depositId);

  if (wallet === undefined) return <Skeleton className="h-80 rounded-xl" aria-hidden="true" />;

  const chainName = getChain(chain).name;
  const balance = wallet.balances.find((b) => b.chain === chain && b.token === token)?.amount ?? 0;
  const enough = balance + 1e-9 >= amountDueUsd;

  async function start(source: DepositSource) {
    setPending(true);
    const res = await withToast(
      () => actions.createCryptoDeposit({ packageId: pkg.id, chain, token, source, agreedToTerms }),
      source === "external"
        ? { loading: "Preparing your deposit address…", success: "Deposit address ready" }
        : { loading: "Confirming the transfer in your wallet…", success: "Transfer sent. Waiting for confirmations." },
    );
    setPending(false);
    if (!res.ok) return;
    setDepositId(res.value.id);
    onDepositChange?.(true);
    if (source !== "external") notifyWhenSettled(res.value.id);
  }

  if (depositId && deposit) {
    return (
      <DepositProgress
        deposit={deposit}
        pkg={pkg}
        onRestart={() => {
          setDepositId(null);
          onDepositChange?.(false);
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Chain</div>
        <SegmentedControl<ChainId>
          aria-label="Chain"
          size="sm"
          value={chain}
          onValueChange={setChain}
          options={CHAIN_OPTIONS}
        />
      </div>
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Token</div>
        <SegmentedControl<TokenSymbol>
          aria-label="Token"
          size="sm"
          value={token}
          onValueChange={setToken}
          options={TOKEN_OPTIONS}
          className="max-w-48"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallet">From your wallet</TabsTrigger>
          <TabsTrigger value="external">Send from anywhere</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="flex flex-col gap-4">
          <dl className="rounded-lg border border-border p-3">
            <Row
              label="Propfund wallet"
              value={<span className="font-mono">{wallet.address ? truncateAddress(wallet.address) : "Being created…"}</span>}
            />
            <Row
              label={`Balance on ${chainName}`}
              value={
                <span className="font-mono tabular-nums">
                  {formatTokenAmount(balance, token)}
                </span>
              }
            />
            <Row
              label="Transfer"
              value={
                <span className="font-mono font-medium tabular-nums">
                  {formatTokenAmount(amountDueUsd, token)}
                </span>
              }
            />
          </dl>
          {!enough && (
            <p className="flex gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Your Propfund wallet doesn&apos;t have enough {token} on {chainName}. Pick another chain or token, or send
              from anywhere.
            </p>
          )}
          <Button
            type="button"
            onClick={() => void start("propfund_wallet")}
            disabled={!enough || !wallet.address}
            loading={pending}
          >
            Confirm transfer
          </Button>
        </TabsContent>

        <TabsContent value="external" className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Get your deposit address, then send exactly{" "}
            <span className="font-mono text-foreground">
              {formatTokenAmount(amountDueUsd, token)}
            </span>{" "}
            on {chainName} from any wallet or exchange.
          </p>
          <WarningNote />
          <Button type="button" onClick={() => void start("external")} loading={pending}>
            Get deposit address
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WarningNote() {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
      <p className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {DEPOSIT_WARNING}
      </p>
      <p className="mt-1.5 pl-6 text-xs text-warning/80">{NETWORK_FEE_NOTE}</p>
    </div>
  );
}

/** Toast once a deposit settles (the stepper already updates live). */
function notifyWhenSettled(depositId: string) {
  actions
    .waitForDeposit(depositId)
    .then((d) => {
      if (d.status === "confirmed") toast.success("Deposit confirmed. Your challenge account is ready.");
      else if (d.status === "underpaid") toast.error("We received less than the amount due. It was added to your deposit balance.");
    })
    .catch(() => {
      // Signed out or data reset while waiting: nothing to report.
    });
}

function DepositProgress({
  deposit,
  pkg,
  onRestart,
  onClose,
}: {
  deposit: Deposit;
  pkg: ChallengePackage;
  onRestart: () => void;
  onClose: () => void;
}) {
  const [sending, setSending] = React.useState(false);
  const chainName = getChain(deposit.chain).name;
  const amount = formatTokenAmount(deposit.amountDueUsd, deposit.token);
  const outcome = depositOutcome(deposit);
  const done = deposit.status === "confirmed" && !!deposit.accountId;

  async function simulateTransfer() {
    setSending(true);
    const res = await withToast(() => actions.simulateDepositConfirmations(deposit.id), {
      loading: "Sending test transfer…",
      success: "Transfer seen on chain. Confirming.",
    });
    setSending(false);
    if (res.ok) notifyWhenSettled(deposit.id);
  }

  return (
    <div className="flex flex-col gap-5" data-testid="deposit-progress">
      <div className="text-sm">
        {amount} on {chainName}
      </div>

      {deposit.status === "waiting" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-start">
            <div className="rounded-lg bg-white p-2">
              <AddressQr value={deposit.address} size={132} label="Deposit address QR code" />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="text-xs text-muted-foreground">Deposit address ({chainName})</div>
              <div className="mt-1 break-all font-mono text-sm" data-testid="deposit-address">
                {deposit.address}
              </div>
              <CopyButton value={deposit.address} label="Copy address" className="mt-3" />
            </div>
          </div>
          <dl className="rounded-lg border border-border p-3">
            <Row label="Send exactly" value={<span className="font-mono font-medium tabular-nums">{amount}</span>} />
            <Row label="Network" value={chainName} />
          </dl>
          <WarningNote />
        </div>
      )}

      {deposit.txHash && (
        <dl className="rounded-lg border border-border p-3">
          <Row
            label="Transaction"
            value={
              <ExternalTextLink href={explorerTxUrl(deposit.chain, deposit.txHash)} className="text-sm">
                {truncateAddress(deposit.txHash, 8, 6)}
              </ExternalTextLink>
            }
          />
          {deposit.amountReceivedUsd != null && (
            <Row
              label="Received"
              value={
                <span className="font-mono tabular-nums">
                  {formatTokenAmount(deposit.amountReceivedUsd, deposit.token)}
                </span>
              }
            />
          )}
        </dl>
      )}

      <Stepper steps={depositSteps(deposit)} label="Deposit status" />

      {outcome.kind === "overpaid" && (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          You sent more than the fee. {formatUsd(outcome.creditUsd, 2)} was added to your deposit balance for your next
          purchase.
        </p>
      )}
      {outcome.kind === "underpaid" && (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          We received less than the {formatUsd(deposit.amountDueUsd, 2)} due, so no account was created.{" "}
          {formatUsd(outcome.creditUsd, 2)} was added to your deposit balance. Start the checkout again to use it.
        </p>
      )}
      {outcome.kind === "expired" && (
        <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          This deposit address request was replaced by a newer checkout.
        </p>
      )}

      {deposit.status === "waiting" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => void simulateTransfer()} loading={sending} className="sm:flex-1">
            <Send />
            Send test transfer
          </Button>
          <Button type="button" variant="outline" onClick={onRestart} className="sm:flex-1">
            <RotateCcw />
            Change chain or token
          </Button>
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <div className="text-sm font-medium text-success">Your {pkg.name} challenge is ready</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatUsd(pkg.accountSize)} simulated account. Trade it by hand in the terminal.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link href="/dashboard/terminal" onClick={onClose}>
              <CandlestickChart />
              Open terminal
            </Link>
          </Button>
        </div>
      )}

      {(deposit.status === "underpaid" || deposit.status === "expired") && (
        <Button type="button" variant="outline" onClick={onRestart}>
          Start again
        </Button>
      )}
    </div>
  );
}
