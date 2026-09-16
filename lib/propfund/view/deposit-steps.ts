/**
 * Live deposit status stepper (PRD §4): Waiting for deposit → Confirming
 * (n of N confirmations) → Confirmed → Account created. Pure.
 */
import { confirmationsLabel, settleDeposit } from "@/lib/propfund/rules";
import type { Deposit } from "@/lib/propfund/types";

export type StepState = "complete" | "current" | "upcoming" | "attention";

export type DepositStep = {
  id: "waiting" | "confirming" | "confirmed" | "account";
  label: string;
  state: StepState;
};

type DepositLike = Pick<
  Deposit,
  "status" | "confirmations" | "requiredConfirmations" | "accountId" | "amountDueUsd" | "amountReceivedUsd"
>;

export function depositSteps(d: DepositLike): DepositStep[] {
  const n = Math.min(d.confirmations, d.requiredConfirmations);
  const N = d.requiredConfirmations;

  const waiting: DepositStep = { id: "waiting", label: "Waiting for deposit", state: "upcoming" };
  const confirming: DepositStep = { id: "confirming", label: "Confirming", state: "upcoming" };
  const confirmed: DepositStep = { id: "confirmed", label: "Confirmed", state: "upcoming" };
  const account: DepositStep = { id: "account", label: "Account created", state: "upcoming" };

  switch (d.status) {
    case "waiting":
      waiting.state = "current";
      break;
    case "confirming":
      waiting.state = "complete";
      confirming.state = "current";
      confirming.label = confirmationsLabel(n, N);
      break;
    case "confirmed":
      waiting.state = "complete";
      confirming.state = "complete";
      confirming.label = confirmationsLabel(N, N);
      confirmed.state = "complete";
      account.state = d.accountId ? "complete" : "current";
      break;
    case "underpaid":
      waiting.state = "complete";
      confirming.state = "complete";
      confirming.label = confirmationsLabel(N, N);
      confirmed.state = "attention";
      confirmed.label = "Received less than the amount due";
      break;
    case "expired":
      waiting.state = "attention";
      waiting.label = "Expired: replaced by a newer checkout";
      break;
  }
  return [waiting, confirming, confirmed, account];
}

export type DepositOutcome =
  | { kind: "pending" }
  | { kind: "exact" }
  | { kind: "overpaid"; creditUsd: number }
  | { kind: "underpaid"; creditUsd: number }
  | { kind: "expired" };

/** What happened to the money once the deposit settles (overpayment → deposit balance). */
export function depositOutcome(d: DepositLike): DepositOutcome {
  if (d.status === "expired") return { kind: "expired" };
  if (d.status === "waiting" || d.status === "confirming" || d.amountReceivedUsd == null) return { kind: "pending" };
  const settled = settleDeposit(d.amountDueUsd, d.amountReceivedUsd);
  if (!settled.accepted) return { kind: "underpaid", creditUsd: settled.creditUsd };
  if (settled.creditUsd > 0) return { kind: "overpaid", creditUsd: settled.creditUsd };
  return { kind: "exact" };
}
