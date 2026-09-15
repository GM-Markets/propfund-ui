"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  createCheckoutAction,
  createFreeAccountAction,
  forgetDeskReadsAction,
  listPropAccountsAction,
  simulateCheckoutAction,
} from "@/app/actions/onboarding";
import { AgreementSignCard } from "@/components/agreement-sign-card";
import { DevOutcomeDialog } from "@/components/dev-outcome-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

export type Tier = {
  id: string;
  label: string;
  account_size: number;
  amount_cents: number;
  asset_class: string;
  market?: string;
  popular?: boolean;
  features: string[];
};

export function CheckoutPicker({
  tiers,
  agreementSigned,
  agreementVersion,
  devSimulate = false,
}: {
  tiers: Tier[];
  agreementSigned: boolean;
  agreementVersion: string;
  devSimulate?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [signed, setSigned] = useState(agreementSigned);
  const [simOpen, setSimOpen] = useState(false);
  const [simTier, setSimTier] = useState<Tier | null>(null);
  const [simPending, setSimPending] = useState(false);
  const baselineIds = useRef<Set<string>>(new Set());

  async function ensureAgreement(): Promise<boolean> {
    if (signed) return true;
    toast.error(friendlyError("V2_AGREEMENT_REQUIRED"));
    return false;
  }

  async function waitForNewAccount() {
    setPayOpen(false);
    setProvisioning(true);
    const deadline = Date.now() + 30_000;
    let newId: string | null = null;
    while (Date.now() < deadline) {
      const r = await listPropAccountsAction();
      if (r.ok && r.data) {
        const fresh = r.data.find((a) => !baselineIds.current.has(a.id));
        if (fresh) {
          newId = fresh.id;
          break;
        }
      }
      await new Promise((res) => setTimeout(res, 1500));
    }
    setProvisioning(false);
    if (newId) {
      await forgetDeskReadsAction();
      await router.refresh();
      toast.success("Account ready.");
      router.push(`/dashboard/trading?prop=${newId}`);
    } else {
      toast("Payment is processing — the account will appear on the dashboard shortly.");
      router.push("/dashboard");
    }
  }

  async function pick(tier: Tier) {
    setPending(tier.id);
    try {
      if (tier.amount_cents > 0 && !(await ensureAgreement())) return;
      const pre = await listPropAccountsAction();
      baselineIds.current = new Set(pre.ok && pre.data ? pre.data.map((a) => a.id) : []);

      if (tier.amount_cents === 0) {
        const r = await createFreeAccountAction({
          tier_id: tier.id,
          asset_class: tier.asset_class,
          account_size: tier.account_size,
          market: tier.market,
        });
        if (r.ok && r.data) {
          toast.success("Free account provisioned.");
          await router.refresh();
          router.push(`/dashboard/trading?prop=${r.data.id}`);
        } else if (!r.ok) {
          toast.error(friendlyError(r.code, r.message));
        }
        return;
      }

      if (devSimulate) {
        setSimTier(tier);
        setSimOpen(true);
        return;
      }

      const r = await createCheckoutAction({
        tier_id: tier.id,
        market: tier.market ?? tier.asset_class,
        asset_class: tier.asset_class,
        account_size: tier.account_size,
        amount_cents: tier.amount_cents,
      });
      if (!r.ok) {
        toast.error(friendlyError(r.code, r.message));
        return;
      }
      setPayOpen(true);
    } finally {
      setPending(null);
    }
  }

  async function simulate(outcome: "success" | "failure") {
    if (!simTier) return;
    setSimPending(true);
    try {
      const r = await simulateCheckoutAction({
        outcome,
        tier_id: simTier.id,
        market: simTier.market ?? simTier.asset_class,
        asset_class: simTier.asset_class,
        account_size: simTier.account_size,
        amount_cents: simTier.amount_cents,
      });
      if (!r.ok) {
        toast.error(friendlyError(r.code, r.message));
        return;
      }
      setSimOpen(false);
      await router.refresh();
      if (outcome === "success" && r.data?.account) {
        toast.success("Account ready.");
        router.push(`/dashboard/trading?prop=${r.data.account.id}`);
        return;
      }
      toast.error("Simulated payment failed — no account created.");
    } finally {
      setSimPending(false);
    }
  }

  return (
    <div>
      {!signed && (
        <div className="mb-6">
          <AgreementSignCard version={agreementVersion} onSigned={() => setSigned(true)} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.id} className={cn("flex flex-col", t.popular && "border-primary/40 shadow-glow")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.label}</CardTitle>
                {t.popular && (
                  <Badge>
                    <Sparkles className="size-3" /> Popular
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {t.amount_cents === 0 ? "Free" : `$${(t.amount_cents / 100).toFixed(0)}`}
                </span>
                {t.amount_cents > 0 && <span className="text-sm text-muted-foreground">one-time</span>}
              </div>
              <p className="text-xs capitalize text-muted-foreground">{t.asset_class}</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => pick(t)}
                loading={pending === t.id}
                variant={t.popular ? "default" : "outline"}
                className="w-full"
              >
                {t.amount_cents === 0 ? "Start free" : devSimulate ? "Simulate purchase" : "Buy challenge"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog
        open={payOpen || provisioning}
        onOpenChange={(o) => {
          if (!o && !provisioning) setPayOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{provisioning ? "Provisioning your account" : "Complete payment"}</DialogTitle>
            <DialogDescription>
              {provisioning
                ? "Waiting for Privy to confirm the challenge payment."
                : "Pay with your connected Privy wallet. The desk provisions when the payment webhook lands."}
            </DialogDescription>
          </DialogHeader>
          {provisioning ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Almost there…</p>
            </div>
          ) : (
            <Button className="w-full" onClick={() => void waitForNewAccount()}>
              I&apos;ve completed payment — check status
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <DevOutcomeDialog
        open={simOpen}
        pending={simPending}
        title="Simulate payment"
        description="Development only. Success creates the challenge account. Failure records a failed payment and leaves the desk unchanged."
        onOpenChange={setSimOpen}
        onChoose={(outcome) => void simulate(outcome)}
      />
    </div>
  );
}
