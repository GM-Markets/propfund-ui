"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { getKycSessionAction, simulateKycAction } from "@/app/actions/onboarding";
import { DevOutcomeDialog } from "@/components/dev-outcome-dialog";
import { ErrorBanner } from "@/components/Form";
import { Button } from "@/components/ui/button";
import { friendlyError } from "@/lib/errors";

export function KycStartButton({ devSimulate = false }: { devSimulate?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function start() {
    setError(null);
    if (devSimulate) {
      setDialogOpen(true);
      return;
    }
    setPending(true);
    try {
      const r = await getKycSessionAction();
      if (r.ok && r.data?.url) {
        window.location.assign(r.data.url);
        return;
      }
      if (r.ok && r.data?.status === "verified") {
        router.refresh();
        return;
      }
      if (!r.ok) setError(friendlyError(r.code, r.message));
      else setError("Stripe Identity did not return a verification URL.");
    } finally {
      setPending(false);
    }
  }

  async function simulate(outcome: "success" | "failure") {
    setError(null);
    setPending(true);
    try {
      const r = await simulateKycAction(outcome);
      if (!r.ok) {
        setError(friendlyError(r.code, r.message));
        return;
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <ErrorBanner>{error}</ErrorBanner>
      <Button onClick={start} loading={pending && !dialogOpen}>
        <ShieldCheck />
        {devSimulate ? "Simulate verification" : pending ? "Preparing…" : "Begin verification"}
      </Button>
      <DevOutcomeDialog
        open={dialogOpen}
        pending={pending}
        title="Simulate KYC"
        description="Development only. Choose the verification outcome to apply to this account."
        onOpenChange={setDialogOpen}
        onChoose={(outcome) => void simulate(outcome)}
      />
    </div>
  );
}
