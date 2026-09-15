import "server-only";

import { signGatewayWsChallenge } from "@/lib/gateway/wsAuth.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * BFF: sign a gateway WebSocket HMAC challenge.
 * The browser never sees `GATEWAY_WS_AUTH_SECRET` — only `{ mac }`.
 */
export async function POST(req: Request): Promise<Response> {
  let body: { nonce?: unknown; ts?: unknown };
  try {
    body = (await req.json()) as { nonce?: unknown; ts?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nonce = typeof body.nonce === "string" ? body.nonce.trim() : "";
  const ts = typeof body.ts === "number" ? body.ts : Number(body.ts);
  if (!nonce || !Number.isFinite(ts)) {
    return Response.json({ error: "nonce and ts are required" }, { status: 400 });
  }

  try {
    return Response.json({ mac: signGatewayWsChallenge(nonce, ts) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
