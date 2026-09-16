import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection } from "@/components/docs/blocks";
import { paymentSummary } from "@/components/propfund/site-data";

export const metadata = helpMetadata("sign-in-and-wallet");

export default function SignInAndWalletPage() {
  return (
    <HelpArticle slug="sign-in-and-wallet">
      <DocSection id="ways-to-sign-in" title="Ways to sign in" description="Choose Sign in, then pick one of three methods.">
        <DataTable
          head={["Method", "How it works"]}
          rows={[
            ["Continue with email", "Enter your email address and type the one-time code we send you. There is no password to remember."],
            ["Continue with Google", "Sign in with your Google account."],
            ["Continue with wallet", "Connect a browser or mobile crypto wallet and approve the sign-in request. Signing in does not move any funds."],
          ]}
        />
        <p>Use the same method each time so you land in the same account. Opening any dashboard page while signed out shows the sign-in window on that page.</p>
        <Callout type="tip" title="No identity documents at sign-in">
          Signing in never asks for an ID. Identity verification happens once, at your first payout request.
        </Callout>
      </DocSection>

      <DocSection id="propfund-wallet" title="Your Propfund wallet">
        <p>Every trader gets a Propfund wallet. It is created on your first sign-in if you don&apos;t already have one, and it belongs to you.</p>
        <ul>
          <li>It has one address that works on Arbitrum, Ethereum, Base and BNB Chain.</li>
          <li>You can pay for a challenge from it with {paymentSummary.stablecoins}.</li>
          <li>It is the default address for your payouts in {paymentSummary.payout}.</li>
          <li>Find the address, with a copy button, on the Wallet page and in the account menu.</li>
        </ul>
        <p>If you signed in with an external wallet, you still get a Propfund wallet. You can pay from either one.</p>
      </DocSection>

      <DocSection id="keeping-it-safe" title="Keeping your wallet safe">
        <p>Your Propfund wallet is self-custody. Access to it is tied to your sign-in method, so keep your email account, Google account or external wallet secure.</p>
        <Callout type="warning" title="Exporting your private key">
          If you export your wallet&apos;s private key, anyone who gets it can move your funds. Propfund cannot recover a lost key or reverse a transfer. Never share your key or recovery phrase, including with anyone claiming to be Propfund support.
        </Callout>
      </DocSection>

      <DocSection id="one-profile" title="One profile per person">
        <p>Each person can have one Propfund profile. Creating profiles with different sign-in methods, or sharing a device, wallet or payment method across profiles, counts as a multiple identities violation (V3). See <Link href="/help/violations">Violations</Link>.</p>
      </DocSection>
    </HelpArticle>
  );
}
