"use client";

import { PrivyProvider } from "@privy-io/react-auth";

import { getPrivyClientId, isConfiguredPrivyAppId } from "@/lib/privy";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const CLIENT_ID = getPrivyClientId();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export function PrivyAppProvider({ children }: { children: React.ReactNode }) {
  if (!isConfiguredPrivyAppId(APP_ID)) {
    return <>{children}</>;
  }

  // The GM Markets web client is origin-locked. Passing it on localhost
  // leaves usePrivy().ready false, so Continue stays disabled. In next
  // dev, use the app default client (localhost is usually allowed there).
  const clientId = process.env.NODE_ENV === "development" ? undefined : CLIENT_ID;

  return (
    <PrivyProvider
      appId={APP_ID}
      clientId={clientId}
      config={{
        loginMethodsAndOrder: {
          primary: ["google", "email"],
          overflow: ["detected_ethereum_wallets", "wallet_connect"],
        },
        appearance: {
          theme: "light",
          accentColor: "#d997d2",
          logo: siteUrl ? `${siteUrl}/brand/propfund-wordmark-dark.svg` : undefined,
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
