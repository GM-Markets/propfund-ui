/** Public Flo gateway traders and bots call. */
export const PUBLIC_GATEWAY_ORIGIN = "https://gate.propfund.io";

/** Vanta desk API prefix on the public gateway. */
export const PUBLIC_VAN_BASE = `${PUBLIC_GATEWAY_ORIGIN}/van`;

export const DESK_API_KEY_PLACEHOLDER = "<key_id>.<key_secret>";

export function docsVanUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_VAN_BASE}${suffix}`;
}
