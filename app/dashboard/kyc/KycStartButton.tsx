"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SumsubWebSdk from "@sumsub/websdk-react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { getSumsubTokenAction } from "@/app/actions/onboarding";
import { ErrorBanner } from "@/components/Form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { friendlyError } from "@/lib/errors";

export function KycStartButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function start() {
    setError(null);
    setPending(true);
    try {
      const r = await getSumsubTokenAction();
      if (r.ok && r.data) {
        setToken(r.data.token);
        setOpen(true);
      } else if (!r.ok) {
        setError(friendlyError(r.code, r.message));
      }
    } finally {
      setPending(false);
    }
  }

  async function refreshToken(): Promise<string> {
    const r = await getSumsubTokenAction();
    return r.ok && r.data ? r.data.token : "";
  }

  return (
    <div>
      <ErrorBanner>{error}</ErrorBanner>
      <Button onClick={start} loading={pending}>
        <ShieldCheck />
        {pending ? "Preparing…" : "Begin verification"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              Complete the steps below. This window updates automatically when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto rounded-lg">
            {token && (
              <SumsubWebSdk
                accessToken={token}
                expirationHandler={refreshToken}
                config={{ lang: "en" }}
                options={{ addViewportTag: false, adaptIosWebView: true }}
                onMessage={(type: string) => {
                  if (type === "idCheck.onApplicantStatusChanged") {
                    router.refresh();
                  }
                }}
                onError={() => {
                  toast.error("The verification widget hit an error. Please try again.");
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
