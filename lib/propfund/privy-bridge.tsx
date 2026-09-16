"use client";

/**
 * Client-only bridge to the authentication provider SDK. Loaded with
 * `next/dynamic({ ssr: false })` from lib/propfund/auth.tsx so the SDK never
 * runs during SSR and stays out of the server bundle. It renders no app UI of
 * its own; it reports sign-in state to AuthProvider and exposes login/logout.
 */
import * as React from "react";
import { PrivyProvider, usePrivy, type User } from "@privy-io/react-auth";
import { arbitrum, base, bsc, mainnet } from "viem/chains";

import { BRAND_NAME } from "@/lib/brand";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "@/lib/propfund/config";

import type { BridgeHandle, BridgeState, SignInMethod } from "./auth";

/** The embedded wallet is the Propfund wallet; fall back to the first linked wallet. */
export function walletAddressOf(user: User | null): string | undefined {
  if (!user) return undefined;
  const embedded = user.linkedAccounts.find(
    (a) =>
      a.type === "wallet" &&
      "walletClientType" in a &&
      (a.walletClientType === "privy" || a.walletClientType === "privy-v2") &&
      (!("chainType" in a) || a.chainType === "ethereum"),
  );
  if (embedded && "address" in embedded) return embedded.address;
  return user.wallet?.address;
}

function emailOf(user: User | null): string | undefined {
  return user?.email?.address ?? user?.google?.email ?? undefined;
}

function Sync({
  onState,
  register,
}: {
  onState: (s: BridgeState) => void;
  register: (h: BridgeHandle | null) => void;
}) {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const loginRef = React.useRef(login);
  const logoutRef = React.useRef(logout);
  loginRef.current = login;
  logoutRef.current = logout;

  React.useEffect(() => {
    register({
      login: (method: SignInMethod) => loginRef.current({ loginMethods: [method] }),
      logout: () => logoutRef.current(),
    });
    return () => register(null);
  }, [register]);

  const id = user?.id;
  const email = emailOf(user);
  const walletAddress = walletAddressOf(user);
  React.useEffect(() => {
    onState({
      ready,
      authenticated: ready && authenticated && !!id,
      user: ready && authenticated && id ? { id, email, walletAddress } : null,
    });
  }, [ready, authenticated, id, email, walletAddress, onState]);

  return null;
}

export function PrivyBridge(props: {
  onState: (s: BridgeState) => void;
  register: (h: BridgeHandle | null) => void;
}) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        loginMethods: ["email", "google", "wallet"],
        // PRD §2: every user gets an embedded (Propfund) wallet, including
        // users who sign in with an external wallet.
        embeddedWallets: { ethereum: { createOnLogin: "all-users" } },
        supportedChains: [arbitrum, mainnet, base, bsc],
        defaultChain: arbitrum,
        appearance: {
          theme: "dark",
          accentColor: "#2A81F4",
          logo: "/brand/propfund-wordmark.svg",
          landingHeader: `Sign in to ${BRAND_NAME}`,
          walletChainType: "ethereum-only",
        },
      }}
    >
      <Sync {...props} />
    </PrivyProvider>
  );
}
