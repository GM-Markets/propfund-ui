import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { TERMS_CHECKBOX_COPY } from "@/lib/propfund/rules";

/**
 * Required "I agree to the Trading Rules and Terms" checkbox (PRD §4). The
 * checkbox's accessible name is the exact rules copy; the links sit beside it
 * so clicking them doesn't toggle the box.
 */
export function TermsCheckbox({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <Checkbox
          className="mt-0.5"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          aria-label={TERMS_CHECKBOX_COPY}
        />
        <span>{TERMS_CHECKBOX_COPY}</span>
      </label>
      <p className="mt-1.5 pl-7 text-xs text-muted-foreground">
        Read the{" "}
        <Link href="/rules" target="_blank" className="text-primary underline-offset-4 hover:underline">
          Trading Rules
        </Link>{" "}
        and{" "}
        <Link href="/terms-of-service" target="_blank" className="text-primary underline-offset-4 hover:underline">
          Terms
        </Link>
        . Fees are non-refundable.
      </p>
    </div>
  );
}
