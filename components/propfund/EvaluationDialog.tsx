"use client";

import { useEffect, useState } from "react";

const accountSizes = ["$5K", "$10K", "$25K", "$50K", "$100K"];
const marketNames = ["Forex", "Crypto", "Equities", "Commodities"];

export function EvaluationDialog({ open, initialAccount = "$25K", onClose }: { open: boolean; initialAccount?: string; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(initialAccount);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["Forex"]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function closeDialog() {
    setClosing(true);
    window.setTimeout(onClose, 160);
  }

  function toggleMarket(market: string) {
    setSelectedMarkets((current) => current.includes(market) ? current.filter((item) => item !== market) : [...current, market]);
  }

  return (
    <div className={`form-overlay ${closing ? "closing" : ""}`} role="presentation" onMouseDown={closeDialog}>
      <div className="signup-dialog" role="dialog" aria-modal="true" aria-labelledby="signup-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={closeDialog} type="button" aria-label="Close form">Close</button>
        {submitted ? (
          <div className="form-success">
            <span className="wordmark-mark" aria-hidden="true">P</span>
            <h2 id="signup-title">You&apos;re on the list.</h2>
            <p>Thanks. We&apos;ll send the account details to the email you entered.</p>
            <button className="form-submit" onClick={closeDialog} type="button">Done</button>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <div className="form-heading"><h2 id="signup-title">Start your evaluation.</h2><p>Tell us what you trade and where you want to start.</p></div>
            <div className="field-row"><label><span>Name</span><input name="name" type="text" autoComplete="name" autoFocus required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label></div>
            <label><span>Account type</span><select value={selectedAccount} onChange={(event) => setSelectedAccount(event.target.value)}>{accountSizes.map((account) => <option value={account} key={account}>{account} evaluation</option>)}</select></label>
            <fieldset><legend>Markets</legend><div className="market-options">{marketNames.map((market) => <label className={selectedMarkets.includes(market) ? "selected" : ""} key={market}><input type="checkbox" checked={selectedMarkets.includes(market)} onChange={() => toggleMarket(market)} /><span>{market}</span></label>)}</div></fieldset>
            <button className="form-submit" disabled={selectedMarkets.length === 0} type="submit">Request access</button>
            <small>Simulated trading only. No financial advice.</small>
          </form>
        )}
      </div>
    </div>
  );
}