/**
 * Stablecoin deposits (PRD §4).
 */
import type { ChainId, TokenSymbol } from "@/lib/propfund/types";

import { roundCents } from "./packages";

export type ChainInfo = {
  id: ChainId;
  name: string;
  requiredConfirmations: number;
  explorer: string;
  /** Simulated block time used for confirmation progress. */
  blockTimeMs: number;
};

export const CHAINS: readonly ChainInfo[] = [
  { id: "arbitrum", name: "Arbitrum", requiredConfirmations: 1, explorer: "https://arbiscan.io", blockTimeMs: 1_200 },
  { id: "ethereum", name: "Ethereum", requiredConfirmations: 12, explorer: "https://etherscan.io", blockTimeMs: 450 },
  { id: "base", name: "Base", requiredConfirmations: 1, explorer: "https://basescan.org", blockTimeMs: 1_200 },
  { id: "bnb", name: "BNB Chain", requiredConfirmations: 15, explorer: "https://bscscan.com", blockTimeMs: 350 },
];

export const TOKENS: readonly TokenSymbol[] = ["USDC", "USDT"];

export const DEFAULT_CHAIN: ChainId = "arbitrum";

export const DEPOSIT_WARNING =
  "Send only USDC or USDT on Arbitrum, Ethereum, Base or BNB Chain. Other tokens or chains can be lost.";
export const NETWORK_FEE_NOTE = "The network fee is paid by the sender.";
export const TERMS_CHECKBOX_COPY = "I agree to the Trading Rules and Terms";

export function getChain(id: ChainId): ChainInfo {
  const c = CHAINS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown chain: ${id}`);
  return c;
}

export function isChainId(v: string): v is ChainId {
  return CHAINS.some((c) => c.id === v);
}

export function isToken(v: string): v is TokenSymbol {
  return (TOKENS as readonly string[]).includes(v);
}

export function requiredConfirmations(chain: ChainId): number {
  return getChain(chain).requiredConfirmations;
}

export function explorerTxUrl(chain: ChainId, hash: string): string {
  return `${getChain(chain).explorer}/tx/${hash}`;
}

export function explorerAddressUrl(chain: ChainId, address: string): string {
  return `${getChain(chain).explorer}/address/${address}`;
}

/**
 * Settle a received amount against what's due. 1 USDC = 1 USDT = $1.
 * Over the fee → credit the excess. Under the fee → not accepted; the full
 * amount received is credited to deposit balance.
 */
export function settleDeposit(amountDueUsd: number, receivedUsd: number): {
  accepted: boolean;
  creditUsd: number;
} {
  if (receivedUsd + 1e-9 >= amountDueUsd) {
    return { accepted: true, creditUsd: roundCents(receivedUsd - amountDueUsd) };
  }
  return { accepted: false, creditUsd: roundCents(receivedUsd) };
}

/** "Confirming (3 of 12 confirmations)". */
export function confirmationsLabel(n: number, required: number): string {
  return `Confirming (${Math.min(n, required)} of ${required} confirmations)`;
}
