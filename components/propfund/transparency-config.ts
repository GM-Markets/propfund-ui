/**
 * Published addresses for the Transparency page (PRD §11, §13).
 *
 * The only place the marketing site reads these settings:
 * - NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM: the Arbitrum payout wallet
 * - NEXT_PUBLIC_TREASURY_ADDRESSES: JSON map of chain → treasury address,
 *   e.g. {"arbitrum":"0x…","ethereum":"0x…","base":"0x…","bnb":"0x…"}
 *
 * Anything missing or malformed resolves to `null`, which the page shows as
 * "Published at launch". Never substitute a placeholder address.
 */
import { depositChains, type DepositChainId } from "./site-data";

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH = /^0x[a-fA-F0-9]{64}$/;

const CHAIN_ALIASES: Record<string, DepositChainId> = {
  arbitrum: "arbitrum",
  "arbitrum one": "arbitrum",
  arb: "arbitrum",
  ethereum: "ethereum",
  eth: "ethereum",
  mainnet: "ethereum",
  base: "base",
  bnb: "bnb",
  "bnb chain": "bnb",
  bnbchain: "bnb",
  bsc: "bnb",
};

export type PublishedAddress = {
  id: string;
  label: string;
  description: string;
  chain: DepositChainId;
  chainName: string;
  /** Checksummed or lowercase 0x address, or null when not yet published. */
  address: string | null;
  explorerUrl: string | null;
};

export type TransparencyEnv = {
  payoutWalletArbitrum?: string;
  treasuryAddresses?: string;
};

export function isEvmAddress(value: unknown): value is string {
  return typeof value === "string" && EVM_ADDRESS.test(value.trim());
}

function chainById(chain: DepositChainId) {
  const found = depositChains.find((item) => item.id === chain);
  if (!found) throw new Error(`Unknown chain ${chain}`);
  return found;
}

export function explorerAddressUrl(chain: DepositChainId, address: string): string {
  return `${chainById(chain).explorer}/address/${address}`;
}

export function explorerTxUrl(chain: DepositChainId, hash: string): string | null {
  return TX_HASH.test(hash) ? `${chainById(chain).explorer}/tx/${hash}` : null;
}

/** Parses the treasury JSON map. Unknown chains and invalid addresses are dropped. */
export function parseTreasuryAddresses(raw: string | undefined): Partial<Record<DepositChainId, string>> {
  if (!raw || !raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const result: Partial<Record<DepositChainId, string>> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const chain = CHAIN_ALIASES[key.trim().toLowerCase()];
    if (chain && isEvmAddress(value)) result[chain] = value.trim();
  }
  return result;
}

export function readTransparencyEnv(): TransparencyEnv {
  // Literal property access so Next.js inlines the public values at build time.
  return {
    payoutWalletArbitrum: process.env.NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM,
    treasuryAddresses: process.env.NEXT_PUBLIC_TREASURY_ADDRESSES,
  };
}

export function getPublishedAddresses(env: TransparencyEnv = readTransparencyEnv()): PublishedAddress[] {
  const payout = isEvmAddress(env.payoutWalletArbitrum) ? env.payoutWalletArbitrum.trim() : null;
  const treasury = parseTreasuryAddresses(env.treasuryAddresses);

  const payoutRow: PublishedAddress = {
    id: "payout-arbitrum",
    label: "Payout wallet",
    description: "Sends every trader payout in USDC.",
    chain: "arbitrum",
    chainName: chainById("arbitrum").name,
    address: payout,
    explorerUrl: payout ? explorerAddressUrl("arbitrum", payout) : null,
  };

  const treasuryRows = depositChains.map<PublishedAddress>((chain) => {
    const address = treasury[chain.id] ?? null;
    return {
      id: `treasury-${chain.id}`,
      label: "Treasury",
      description: `Receives challenge fees paid in USDC or USDT on ${chain.name}.`,
      chain: chain.id,
      chainName: chain.name,
      address,
      explorerUrl: address ? explorerAddressUrl(chain.id, address) : null,
    };
  });

  return [payoutRow, ...treasuryRows];
}
