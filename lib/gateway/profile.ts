/** Gateway `GET /api/users/me` profile — email, name, and wallet from Privy claims. */

export type GatewayProfile = {
  userId: string;
  address: string;
  displayName: string | null;
  sourceType: string | null;
  source: string | null;
  meta?: unknown;
};

export type PublicIdentity = {
  name: string;
  email: string | null;
  wallet: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function linkedAccounts(meta: unknown): Array<Record<string, unknown>> {
  const root = asRecord(meta);
  const privy = asRecord(root?.privy);
  const accounts = privy?.linked_accounts ?? privy?.linkedAccounts;
  if (!Array.isArray(accounts)) return [];
  return accounts.filter((row): row is Record<string, unknown> => Boolean(asRecord(row)));
}

export function emailFromGatewayProfile(profile: Pick<GatewayProfile, "sourceType" | "source" | "meta">): string | null {
  if (profile.sourceType === "email" && profile.source?.includes("@")) {
    return profile.source;
  }
  for (const account of linkedAccounts(profile.meta)) {
    const email = str(account.email);
    if (email?.includes("@")) return email;
    if (str(account.type) === "email") {
      const address = str(account.address);
      if (address?.includes("@")) return address;
    }
  }
  if (profile.source?.includes("@")) return profile.source;
  return null;
}

export function nameFromGatewayProfile(profile: Pick<GatewayProfile, "displayName" | "meta">): string | null {
  const handle = str(profile.displayName);
  if (handle) return handle;
  for (const account of linkedAccounts(profile.meta)) {
    const name = str(account.name) ?? str(account.given_name) ?? str(account.givenName);
    if (name) return name;
  }
  return null;
}

export function identityFromGatewayProfile(profile: GatewayProfile): PublicIdentity {
  const email = emailFromGatewayProfile(profile);
  const name = nameFromGatewayProfile(profile) ?? (email ? email.split("@")[0] : null) ?? "Trader";
  const wallet =
    str(profile.address) ??
    (profile.sourceType === "wallet" && profile.source && !profile.source.includes("@") ? profile.source : null);
  return { name, email, wallet };
}

export function unwrapGatewayProfile(payload: unknown): GatewayProfile | null {
  const root = asRecord(payload);
  const row = asRecord(root?.profile) ?? asRecord(root?.data) ?? asRecord(root?.user) ?? root;
  if (!row) return null;
  const userId = str(row.userId ?? row.user_id);
  const address = str(row.address);
  if (!userId && !address) return null;
  return {
    userId: userId ?? address ?? "",
    address: address ?? "",
    displayName: str(row.displayName ?? row.display_name),
    sourceType: str(row.sourceType ?? row.source_type),
    source: str(row.source),
    meta: row.meta,
  };
}
