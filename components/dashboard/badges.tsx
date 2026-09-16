"use client";

import { FlaskConical, Info } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OUTCOME_LABEL, PAYOUT_STATUS_LABEL, PHASE_LABEL } from "@/lib/propfund/rules";
import type { AccountStatus, DepositStatus, PaymentStatus, PayoutStatus, Phase } from "@/lib/propfund/types";
import { DEPOSIT_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/propfund/view/labels";
import { PAYOUT_STATUS_MEANING } from "@/lib/propfund/view/payouts";
import { cn } from "@/lib/utils";

type Variant = NonNullable<BadgeProps["variant"]>;

export function PhaseBadge({ phase, className }: { phase: Phase; className?: string }) {
  return (
    <Badge variant={phase === "funded" ? "success" : "default"} className={className}>
      {PHASE_LABEL[phase]}
    </Badge>
  );
}

const OUTCOME_VARIANT: Record<AccountStatus, Variant> = {
  active: "default",
  graduated: "success",
  breached: "destructive",
  terminated: "destructive",
  closed_inactive: "secondary",
};

export function OutcomeBadge({ status, className }: { status: AccountStatus; className?: string }) {
  return (
    <Badge variant={OUTCOME_VARIANT[status]} className={cn("whitespace-nowrap", className)}>
      {OUTCOME_LABEL[status]}
    </Badge>
  );
}

const PAYOUT_VARIANT: Record<PayoutStatus, Variant> = {
  under_review: "warning",
  paid: "success",
  voided: "destructive",
  returned: "secondary",
};

/** Payout status with its PRD §8 meaning in a tooltip. */
export function PayoutStatusBadge({ status, withTooltip = true }: { status: PayoutStatus; withTooltip?: boolean }) {
  const badge = (
    <Badge variant={PAYOUT_VARIANT[status]} className="whitespace-nowrap">
      {PAYOUT_STATUS_LABEL[status]}
      {withTooltip && <Info className="size-3 opacity-70" aria-hidden="true" />}
    </Badge>
  );
  if (!withTooltip) return badge;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${PAYOUT_STATUS_LABEL[status]}: ${PAYOUT_STATUS_MEANING[status]}`}
          >
            {badge}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 leading-relaxed">{PAYOUT_STATUS_MEANING[status]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const DEPOSIT_VARIANT: Record<DepositStatus, Variant> = {
  waiting: "outline",
  confirming: "warning",
  confirmed: "success",
  underpaid: "warning",
  expired: "secondary",
};

export function DepositStatusBadge({
  status,
  confirmations,
  required,
}: {
  status: DepositStatus;
  confirmations?: number;
  required?: number;
}) {
  const label =
    status === "confirming" && required != null
      ? `Confirming ${Math.min(confirmations ?? 0, required)}/${required}`
      : DEPOSIT_STATUS_LABEL[status];
  return (
    <Badge variant={DEPOSIT_VARIANT[status]} className="whitespace-nowrap">
      {label}
    </Badge>
  );
}

const PAYMENT_VARIANT: Record<PaymentStatus, Variant> = {
  pending: "warning",
  succeeded: "success",
  failed: "destructive",
  cancelled: "secondary",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={PAYMENT_VARIANT[status]} className="whitespace-nowrap">
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function TestModeBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={cn("whitespace-nowrap", className)}>
      <FlaskConical className="size-3" aria-hidden="true" />
      Test mode
    </Badge>
  );
}
