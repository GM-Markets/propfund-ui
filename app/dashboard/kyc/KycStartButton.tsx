"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { getKycSessionAction } from "@/app/actions/onboarding";
import { ErrorBanner } from "@/components/Form";
import { Button } from "@/components/ui/button";
import { friendlyError } from "@/lib/errors";

export function KycStartButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setError(null);
    setPending(true);
    try {
      const r = await getKycSessionAction();
      if (r.ok && r.data?.url) {
        window.location.assign(r.data.url);
        return;
      }
      if (r.ok && r.data?.status === "verified") {
        window.location.reload();
        return;
      }
      if (!r.ok) setError(friendlyError(r.code, r.message));
      else setError("Stripe Identity did not return a verification URL.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <ErrorBanner>{error}</ErrorBanner>
      <Button onClick={start} loading={pending}>
        <ShieldCheck />
        {pending ? "Preparing…" : "Begin verification"}
      </Button>
    </div>
  );
}
