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

  return (
    <PrivyProvider
      appId={APP_ID}
      clientId={CLIENT_ID}
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
