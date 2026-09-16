"use client";

import * as React from "react";
import { toast } from "sonner";

import { actions, useAccount, useRebuyOffer, useTakeover } from "@/lib/propfund/hooks";

import { BreachTakeover } from "./breach-takeover";
import { GraduationTakeover } from "./graduation-takeover";
import { ViolationTakeover } from "./violation-takeover";

/**
 * Shows the pending breach / graduation / violation screen, once per event.
 * Dismissing clears it through the service (`dismissTakeover`), so it doesn't
 * return on reload or on another screen.
 */
export function AccountEventTakeover() {
  const takeover = useTakeover();
  const rebuy = useRebuyOffer();
  const [hiddenAt, setHiddenAt] = React.useState<number | null>(null);

  const breachAccount = useAccount(takeover?.kind === "breach" ? takeover.accountId : null);
  const fundedAccount = useAccount(takeover?.kind === "graduation" ? takeover.fundedAccountId : null);
  const challengeAccount = useAccount(takeover?.kind === "graduation" ? takeover.challengeAccountId : null);

  const dismiss = React.useCallback(() => {
    if (!takeover) return;
    // Hide immediately; the service call confirms "seen" in the background.
    setHiddenAt(takeover.at);
    actions.dismissTakeover().catch((e: unknown) => {
      setHiddenAt(null);
      toast.error(e instanceof Error ? e.message : "Couldn't close this screen. Please try again.");
    });
  }, [takeover]);

  if (!takeover || hiddenAt === takeover.at) return null;

  switch (takeover.kind) {
    case "breach":
      return breachAccount ? <BreachTakeover account={breachAccount} rebuyOpen={!!rebuy} onDismiss={dismiss} /> : null;
    case "graduation":
      return fundedAccount ? <GraduationTakeover funded={fundedAccount} challenge={challengeAccount} onDismiss={dismiss} /> : null;
    case "violation":
      return (
        <ViolationTakeover code={takeover.code} reason={takeover.reason} voidedUsd={takeover.voidedUsd} at={takeover.at} onDismiss={dismiss} />
      );
  }
}
