"use client";

import * as React from "react";
import { Camera, CheckCircle2, FileText, Globe, ShieldCheck } from "lucide-react";

import { TestModeBadge } from "@/components/dashboard/badges";
import { Stepper } from "@/components/dashboard/stepper";
import { useIsDesktop } from "@/components/dashboard/use-media-query";
import { withToast } from "@/components/dashboard/with-toast";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/propfund/format";
import { actions } from "@/lib/propfund/hooks";
import { KYC_STATUS_LABEL } from "@/lib/propfund/rules";
import type { Kyc, KycStatus } from "@/lib/propfund/types";
import { KYC_STEPS, type KycStepId } from "@/lib/propfund/view/labels";
import { cn } from "@/lib/utils";

const KYC_VARIANT: Record<KycStatus, NonNullable<BadgeProps["variant"]>> = {
  not_started: "outline",
  in_review: "warning",
  verified: "success",
  needs_info: "warning",
  rejected: "secondary",
};

const COUNTRIES = [
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Japan",
  "Mexico",
  "Netherlands",
  "Singapore",
  "Spain",
  "United Arab Emirates",
  "United Kingdom",
];

const STEP_ICON: Record<KycStepId, typeof FileText> = { document: FileText, selfie: Camera, residence: Globe };

/**
 * Identity verification as the first step of the first payout (PRD §8).
 * Not started → Verify identity (simulated: ID, selfie, residence) → In review
 * → Verified / Needs more info (resubmit) / Rejected (retry).
 */
export function IdentityStep({ kyc, barred }: { kyc: Kyc; barred: boolean }) {
  const [open, setOpen] = React.useState(false);
  if (kyc.status === "verified") return null;

  const canSubmit = !barred && (kyc.status === "not_started" || kyc.status === "needs_info" || kyc.status === "rejected");
  const cta = kyc.status === "needs_info" ? "Resubmit" : kyc.status === "rejected" ? "Try again" : "Verify identity";

  return (
    <Card className="p-5 sm:p-6" data-testid="identity-step">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">Identity verification</h2>
            <p className="text-sm text-muted-foreground">Needed once, before your first payout</p>
          </div>
        </div>
        <Badge variant={KYC_VARIANT[kyc.status]} data-testid="kyc-status">
          {KYC_STATUS_LABEL[kyc.status]}
        </Badge>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        {kyc.status === "not_started" && (
          <p>
            Three short steps: a government ID, a selfie and your country of residence. Your funded account keeps trading
            while it&apos;s checked, and later payouts reuse it.
          </p>
        )}
        {kyc.status === "in_review" && (
          <p>
            Submitted{kyc.submittedAt ? ` ${formatDateTime(kyc.submittedAt)}` : ""}. We&apos;ll update this page when the
            check finishes. You can keep trading meanwhile.
          </p>
        )}
        {kyc.status === "needs_info" && (
          <p>{kyc.note ?? "We need a little more information."} Resubmit to continue.</p>
        )}
        {kyc.status === "rejected" && (
          <p>
            {kyc.note ?? "We couldn't verify your identity."}
            {!barred && " Your funded account keeps trading; you can request a payout once verification passes."}
          </p>
        )}
      </div>

      {canSubmit && (
        <Button type="button" className="mt-5 w-full sm:w-auto" onClick={() => setOpen(true)}>
          {cta}
        </Button>
      )}

      <IdentityFlowSheet open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function IdentityFlowSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const isDesktop = useIsDesktop();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? "right" : "bottom"} className="gap-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        {open && <IdentityFlow onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function IdentityFlow({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState<Record<KycStepId, boolean>>({ document: false, selfie: false, residence: false });
  const [country, setCountry] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  const step = KYC_STEPS[index];
  const Icon = STEP_ICON[step.id];
  const allDone = done.document && done.selfie && done.residence;

  function complete(id: KycStepId) {
    setDone((d) => ({ ...d, [id]: true }));
    if (index < KYC_STEPS.length - 1) setIndex(index + 1);
  }

  async function submit() {
    setSubmitting(true);
    const res = await withToast(() => actions.startKyc(), {
      loading: "Submitting identity verification…",
      success: "Submitted. Identity verification is in review.",
    });
    setSubmitting(false);
    if (res.ok) onDone();
  }

  return (
    <>
      <SheetHeader className="pb-4">
        <div className="flex items-center gap-2 pr-8">
          <SheetTitle>Verify identity</SheetTitle>
          <TestModeBadge className="ml-auto" />
        </div>
        <SheetDescription>
          Handled by our identity verification provider. Needed once, before your first payout.
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="pb-6">
        <Stepper
          label="Identity verification steps"
          steps={KYC_STEPS.map((s, i) => ({
            id: s.id,
            label: s.label,
            detail: done[s.id] ? "Done" : undefined,
            state: done[s.id] ? "complete" : i === index ? "current" : "upcoming",
          }))}
          spinCurrent={false}
        />

        {!allDone ? (
          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {step.label}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            {step.id === "residence" ? (
              <div className="mt-4 flex flex-col gap-3">
                <Label htmlFor="kyc-country" className="text-xs text-muted-foreground">
                  Country of residence
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="kyc-country">
                    <SelectValue placeholder="Choose a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" disabled={!country} onClick={() => complete("residence")}>
                  Continue
                </Button>
              </div>
            ) : (
              <Button type="button" className="mt-4 w-full" onClick={() => complete(step.id)}>
                {step.id === "document" ? "Add test ID photo" : "Take test selfie"}
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            All three steps are ready to submit.
          </div>
        )}
      </SheetBody>
      <SheetFooter>
        {index > 0 && !allDone && (
          <Button type="button" variant="ghost" onClick={() => setIndex(index - 1)}>
            Back
          </Button>
        )}
        <Button type="button" disabled={!allDone} loading={submitting} onClick={() => void submit()} className={cn(!allDone && "sm:ml-auto")}>
          Submit for review
        </Button>
      </SheetFooter>
    </>
  );
}
