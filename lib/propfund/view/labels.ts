/** Display labels for deposit and payment records (PRD §4, §10 Wallet). */
import type { DepositSource, DepositStatus, FillKind, PaymentMethod, PaymentStatus } from "@/lib/propfund/types";

export const DEPOSIT_STATUS_LABEL: Record<DepositStatus, string> = {
  waiting: "Waiting for deposit",
  confirming: "Confirming",
  confirmed: "Confirmed",
  underpaid: "Underpaid",
  expired: "Expired",
};

export const DEPOSIT_SOURCE_LABEL: Record<DepositSource, string> = {
  propfund_wallet: "Propfund wallet",
  connected_wallet: "Connected wallet",
  external: "Sent from another wallet",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  card: "Card",
  crypto: "USDC / USDT",
  credit: "Deposit balance",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const KYC_STEPS = [
  { id: "document", label: "Government ID", description: "A photo of your passport, national ID card or driving licence." },
  { id: "selfie", label: "Selfie", description: "A short live selfie to match your ID." },
  { id: "residence", label: "Country of residence", description: "Where you live today." },
] as const;

export type KycStepId = (typeof KYC_STEPS)[number]["id"];

export const FILL_KIND_LABEL: Record<FillKind, string> = {
  open: "Open",
  increase: "Increase",
  reduce: "Reduce",
  close: "Close",
  flip: "Flip",
  take_profit: "Take profit",
  stop_loss: "Stop loss",
  manual_close: "Closed by you",
  breach: "Breach close",
  violation: "Violation close",
  inactivity: "Inactivity close",
  adjustment: "Balance adjustment (test)",
};
