"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getIdentityToken, usePrivy } from "@privy-io/react-auth";

import { establishSessionAction } from "@/app/actions/auth";
import { SiteFooter, SiteHeader } from "@/components/propfund/SiteChrome";
import { hasEmbeddedEthWallet, isConfiguredPrivyAppId } from "@/lib/privy";

function afterLoginPath(account: string | null): string {
  if (!account) return "/dashboard";
  return `/dashboard/checkout?account=${encodeURIComponent(account)}`;
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="login-page">
        <Suspense fallback={<LoginCard />}>
          <LoginWithAccount />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

function LoginWithAccount() {
  const params = useSearchParams();
  return <LoginCard account={params.get("account")} signedOut={params.get("signedOut") === "1"} />;
}

function LoginCard({ account, signedOut = false }: { account?: string | null; signedOut?: boolean }) {
  const privyReady = isConfiguredPrivyAppId(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  return (
    <div className="signup-dialog">
      <div className="form-heading">
        <Image
          className="dialog-wordmark"
          src="/brand/propfund-wordmark-dark.svg"
          alt="Propfund"
          width={201}
          height={36}
        />
        <h2>Start your evaluation.</h2>
        <p>New and returning traders use the same login. Continue to open your desk.</p>
      </div>
      {account ? <p className="login-account">Starting with a {account} evaluation.</p> : null}
      {privyReady ? (
        <PrivyLogin account={account ?? null} signedOut={signedOut} />
      ) : (
        <div className="login-actions">
          <p className="form-error" role="alert">
            Sign-in is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID.
          </p>
          <button className="form-submit" type="button" disabled>
            Continue
          </button>
          <small className="login-note">Simulated trading only. No financial advice.</small>
        </div>
      )}
    </div>
  );
}

function PrivyLogin({ account, signedOut }: { account: string | null; signedOut: boolean }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [openedDesk, setOpenedDesk] = useState(false);
  const walletReady = hasEmbeddedEthWallet(user);

  useEffect(() => {
    if (!signedOut || !ready || !authenticated) return;
    void logout();
  }, [signedOut, ready, authenticated, logout]);

  async function openDesk() {
    setError(null);
    setPending(true);
    try {
      const token = (await getIdentityToken())?.trim();
      if (!token) {
        setError("Privy did not return an identity token. Enable identity tokens for this app.");
        return;
      }
      const result = await establishSessionAction(token);
      if (result.ok) window.location.assign(afterLoginPath(account));
      else setError(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (!openedDesk || !ready || !authenticated || !walletReady || pending) return;
    void openDesk();
    // Only after the trader clicks Continue — leftover Privy sessions must not auto-login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedDesk, ready, authenticated, walletReady]);

  return (
    <div className="login-actions">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="form-submit"
        type="button"
        onClick={() => {
          setOpenedDesk(true);
          if (!authenticated) login();
          else if (walletReady) void openDesk();
        }}
        disabled={!ready || pending}
      >
        {pending ? "Opening your desk…" : "Continue"}
      </button>
      <small className="login-note">Simulated trading only. No financial advice.</small>
    </div>
  );
}
