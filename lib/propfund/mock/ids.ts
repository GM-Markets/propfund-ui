/** Id, hash and address helpers for the mock service. */

let counter = 0;

export function newId(prefix: string): string {
  counter = (counter + 1) % 1_679_616;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(4, "0")}${randomHex(4)}`;
}

export function randomHex(chars: number): string {
  const bytes = new Uint8Array(Math.ceil(chars / 2));
  try {
    globalThis.crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, chars);
}

/** Deterministic hex string of `chars` length derived from `input` (FNV-1a, re-seeded). */
export function hashHex(input: string, chars: number): string {
  let out = "";
  let seed = 0x811c9dc5;
  while (out.length < chars) {
    let h = seed;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out += h.toString(16).padStart(8, "0");
    seed = Math.imul(seed ^ h, 0x01000193) >>> 0;
  }
  return out.slice(0, chars);
}

/** Deterministic EVM-shaped address for a user id and purpose. */
export function deterministicAddress(userId: string, purpose: string): string {
  return `0x${hashHex(`${purpose}:${userId}`, 40)}`;
}

export function randomTxHash(): string {
  return `0x${randomHex(64)}`;
}
