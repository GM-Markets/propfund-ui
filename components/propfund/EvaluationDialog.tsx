"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  joinPropFundWaitlist,
  waitlistErrorMessage,
} from "@/lib/api/waitlist";

const accountSizes = ["$5K", "$10K", "$25K", "$50K", "$100K"];
const marketNames = ["Forex", "Crypto", "Equities", "Commodities"];

export function EvaluationDialog({
  open,
  initialAccount = "$25K",
  onClose,
}: {
  open: boolean;
  initialAccount?: string;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(initialAccount);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["Forex"]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  function closeDialog() {
    if (submitting) return;
    setClosing(true);
    window.setTimeout(onClose, 160);
  }

  function toggleMarket(market: string) {
    setSelectedMarkets((current) =>
      current.includes(market)
        ? current.filter((item) => item !== market)
        : [...current, market],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");

    setError(null);
    setSubmitting(true);

    const result = await joinPropFundWaitlist(email);
    setSubmitting(false);

    if (!result.ok) {
      setError(waitlistErrorMessage(result.error));
      return;
    }

    setSubmitted(true);
  }

  return (
    <div
      className={`form-overlay ${closing ? "closing" : ""}`}
      role="presentation"
      onMouseDown={closeDialog}
    >
      <div
        className="signup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="dialog-close"
          onClick={closeDialog}
          type="button"
          aria-label="Close form"
          disabled={submitting}
        >
          Close
        </button>
        {submitted ? (
          <div className="form-success">
            <Image className="form-success-mark" src="/brand/propfund-mark-dark.svg" alt="" width={35} height={31} aria-hidden="true" />
            <h2 id="signup-title">Request received.</h2>
            <p>We&apos;ll email you as soon as evaluation access is ready.</p>
            <button className="form-submit" onClick={closeDialog} type="button">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="form-heading">
              <Image className="dialog-wordmark" src="/brand/propfund-wordmark-dark.svg" alt="Propfund" width={201} height={36} />
              <h2 id="signup-title">Start your evaluation.</h2>
              <p>Tell us who you are, then choose an account size and the markets you trade.</p>
            </div>
            <div className="field-row">
              <label>
                <span>Name</span>
                <input name="name" type="text" autoComplete="name" autoFocus required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
            </div>
            <label>
              <span>Starting balance</span>
              <select
                value={selectedAccount}
                onChange={(event) => setSelectedAccount(event.target.value)}
              >
                {accountSizes.map((account) => (
                  <option value={account} key={account}>
                    {account} evaluation
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Markets you trade</legend>
              <div className="market-options">
                {marketNames.map((market) => (
                  <label
                    className={selectedMarkets.includes(market) ? "selected" : ""}
                    key={market}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMarkets.includes(market)}
                      onChange={() => toggleMarket(market)}
                    />
                    <span>{market}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="form-submit"
              disabled={selectedMarkets.length === 0 || submitting}
              type="submit"
            >
              {submitting ? "Sending..." : "Request evaluation access"}
            </button>
            <small>Simulated trading only. No financial advice.</small>
          </form>
        )}
      </div>
    </div>
  );
}
