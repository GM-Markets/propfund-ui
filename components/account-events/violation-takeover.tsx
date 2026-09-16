"use client";

import { Ban, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APPEAL_CONTACT_EMAIL } from "@/lib/propfund/config";
import { formatDateTime, formatUsd } from "@/lib/propfund/format";
import { VIOLATIONS } from "@/lib/propfund/rules";
import type { ViolationCode } from "@/lib/propfund/types";

import { FactGrid, TakeoverShell } from "./takeover-shell";

/**
 * Violation screen (PRD §9): code, plain-language reason, voided amount and
 * the appeal contact. No rebuy.
 */
export function ViolationTakeover({
  code,
  reason,
  voidedUsd,
  at,
  onDismiss,
}: {
  code: ViolationCode;
  reason: string;
  voidedUsd: number;
  at: number;
  onDismiss: () => void;
}) {
  const violation = VIOLATIONS[code];
  return (
    <TakeoverShell
      testId="violation-takeover"
      icon={Ban}
      tone="danger"
      eyebrow={`Violation ${code}`}
      title={violation.title}
      description={reason || violation.reason}
      onDismiss={onDismiss}
      dismissLabel="Close"
      footer={
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline">
            <a href={`mailto:${APPEAL_CONTACT_EMAIL}?subject=${encodeURIComponent(`Appeal: violation ${code}`)}`}>
              <Mail /> Appeal by email
            </a>
          </Button>
          <Button type="button" variant="secondary" onClick={onDismiss}>
            Close
          </Button>
        </div>
      }
    >
      <FactGrid
        items={[
          { label: "Code", value: code },
          { label: "Confirmed (UTC)", value: formatDateTime(at).replace(" UTC", "") },
          { label: "Payouts voided", value: formatUsd(voidedUsd, 2), tone: voidedUsd > 0 ? "danger" : undefined },
          { label: "Accounts", value: "Terminated" },
        ]}
      />

      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li>All accounts on your profile are closed and any payout under review is voided.</li>
        <li>Fees aren&apos;t refunded, and this profile can&apos;t buy a new challenge.</li>
      </ul>

      <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
        To appeal, email <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${APPEAL_CONTACT_EMAIL}`}>{APPEAL_CONTACT_EMAIL}</a>{" "}
        with violation code {code}.
      </p>
    </TakeoverShell>
  );
}
