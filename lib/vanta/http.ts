import { gatewayOrigin } from "@/lib/gateway/config";

/** Browser calls go straight to the gateway `/van` prefix — not Next `/api/*`. */
export function vantaBrowserBase(): string {
  return `${gatewayOrigin()}/van`;
}

export function unreachableDeskError(cause: unknown): { code: string; message: string } {
  const host = vantaBrowserBase();
  const raw = cause instanceof Error ? cause.message : "";
  if (/failed to fetch|networkerror|load failed|econnrefused/i.test(raw)) {
    return {
      code: "VANTA_UNREACHABLE",
      message: `Can't reach the desk at ${host}. Start the gateway (6701) and Vanta (6711).`,
    };
  }
  return {
    code: "VANTA_UNREACHABLE",
    message: raw.trim() || `Can't reach the desk at ${host}.`,
  };
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
