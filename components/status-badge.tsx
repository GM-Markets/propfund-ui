import { Badge, type BadgeProps } from "@/components/ui/badge";

/** Map a backend status string to a sensible badge tone + readable label. */
const TONE: Record<string, BadgeProps["variant"]> = {
  verified: "success",
  active: "success",
  funded: "success",
  graduated: "success",
  passed: "success",
  completed: "success",
  paid: "success",
  succeeded: "success",
  processing: "warning",
  pending: "warning",
  needs_input: "warning",
  requested: "warning",
  under_review: "warning",
  unverified: "secondary",
  inactive: "secondary",
  returned: "secondary",
  failed: "destructive",
  rejected: "destructive",
  canceled: "destructive",
  cancelled: "destructive",
  breached: "destructive",
  eliminated: "destructive",
  terminated: "destructive",
  voided: "destructive",
};

/** Labels that read better than the raw status string (PRD 2026-09-15 §7). */
const LABEL: Record<string, string> = {
  unverified: "Not started",
  needs_input: "Needs more info",
  eliminated: "Breached",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "unknown").toLowerCase();
  const variant = TONE[s] ?? "outline";
  const label = LABEL[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge variant={variant}>{label}</Badge>;
}
