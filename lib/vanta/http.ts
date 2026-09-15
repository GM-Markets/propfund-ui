/** Browser calls go straight to the gateway `/van` prefix — not Next `/api/*`. */
export function vantaBrowserBase(): string {
  const gateway = (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:6701").replace(/\/$/, "");
  return `${gateway}/van`;
}

export function readBrowserApiError(parsed: unknown): { code: string; message?: string } {
  if (!parsed || typeof parsed !== "object") return { code: "UNKNOWN" };
  const env = parsed as {
    code?: string;
    type?: string;
    message?: string;
    detail?: { code?: string; message?: string };
    error?: { code?: string; message?: string };
  };
  const nested = env.detail ?? env.error;
  const code = nested?.code ?? env.code ?? env.type;
  return {
    code: typeof code === "string" && code ? code : "UNKNOWN",
    message: nested?.message ?? env.message,
  };
}
