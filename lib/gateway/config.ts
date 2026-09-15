/** Flo gateway origin. Session and identity live on `/api/users/me`. */
export function gatewayOrigin(): string {
  return (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:6701").replace(/\/$/, "");
}

export function gatewayApiBase(): string {
  return `${gatewayOrigin()}/api`;
}
