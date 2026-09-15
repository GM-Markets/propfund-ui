import { getSessionTokenFromCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Same-origin handoff of the httpOnly desk token for browser /van calls. */
export async function GET(): Promise<Response> {
  const token = await getSessionTokenFromCookie();
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ token });
}
