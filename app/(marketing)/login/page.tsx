"use client";

import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getIdentityToken, usePrivy } from "@privy-io/react-auth";

import { establishSessionAction } from "@/app/actions/auth";
import { PrivyAppProvider } from "@/components/privy/PrivyAppProvider";
import { SiteFooter, SiteHeader } from "@/components/propfund/SiteChrome";
import { isConfiguredPrivyAppId } from "@/lib/privy";

function afterLoginPath(account: string | null): string {
  if (!account) return "/dashboard";
  return `/dashboard/checkout?account=${encodeURIComponent(account)}`;
}

export default function LoginPage() {
  return (
    <PrivyAppProvider>
      <SiteHeader />
      <main className="login-page">
        <Suspense fallback={<LoginCard />}>
          <LoginWithAccount />
        </Suspense>
      </main>
      <SiteFooter />
    </PrivyAppProvider>
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

function shouldRetrySession(code: string, message: string): boolean {
  const haystack = `${code} ${message}`.toLowerCase();
  return /wallet|unauthorized|identity token|not found/.test(haystack);
}

function PrivyLogin({ account, signedOut }: { account: string | null; signedOut: boolean }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [openedDesk, setOpenedDesk] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!signedOut) return;
    if (ready && authenticated) void logout();
    if (window.location.pathname !== "/login" || window.location.search) {
      window.history.replaceState(null, "", "/login");
    }
  }, [signedOut, ready, authenticated, logout]);

  async function openDesk() {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setPending(true);
    try {
      let lastMessage = "Sign-in failed";
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const token = (await getIdentityToken())?.trim();
        if (!token) {
          lastMessage = "Privy did not return an identity token. Enable identity tokens for this app.";
        } else {
          const result = await establishSessionAction(token);
          if (result.ok) {
            window.location.assign(afterLoginPath(account));
            return;
          }
          lastMessage = result.message;
          if (!shouldRetrySession(result.code, result.message)) {
            setError(result.message);
            return;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setError(lastMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPending(false);
      inFlight.current = false;
    }
  }

  useEffect(() => {
    if (!openedDesk || !ready || !authenticated) return;
    void openDesk();
    // Only after the trader clicks Continue — leftover Privy sessions must not auto-login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedDesk, ready, authenticated]);

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
          else void openDesk();
        }}
        disabled={!ready || pending}
      >
        {pending ? "Opening your desk…" : "Continue"}
      </button>
      <small className="login-note">Simulated trading only. No financial advice.</small>
    </div>
  );
}
