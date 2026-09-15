/** True when NEXT_PUBLIC_PRIVY_APP_ID is a real Privy app id, not a CI/local placeholder. */
export function isConfiguredPrivyAppId(value: string | undefined): boolean {
  const id = value?.trim() ?? "";
  if (!id || /placeholder|replace|your[_-]?app/i.test(id)) return false;
  return /^[a-z][a-z0-9]{20,}$/i.test(id);
}

export function getPrivyClientId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID?.trim();
  return id || undefined;
}

/** Gateway only accepts a Privy embedded ETH wallet on the identity token. */
export function hasEmbeddedEthWallet(
  user:
    | {
        linkedAccounts?: ReadonlyArray<{
          type?: string;
          walletClientType?: string;
          chainType?: string;
          address?: string;
        }>;
      }
    | null
    | undefined,
): boolean {
  return (user?.linkedAccounts ?? []).some(
    (account) =>
      account.type === "wallet" &&
      account.walletClientType === "privy" &&
      (account.chainType == null || account.chainType === "ethereum") &&
      Boolean(account.address),
  );
}
