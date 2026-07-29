import { NextResponse } from "next/server";

import {
  isValidWaitlistEmail,
  normalizeWaitlistEmail,
} from "@/lib/api/waitlist";

function gatewayWaitlistUrl(): string {
  const host = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim().replace(/\/$/, "");
  if (!host) {
    throw new Error("NEXT_PUBLIC_GATEWAY_URL is not set");
  }
  return `${host}/api/waitlist`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";

  const normalized = normalizeWaitlistEmail(email);
  if (!isValidWaitlistEmail(normalized)) {
    return NextResponse.json({ message: "Invalid email" }, { status: 400 });
  }

  try {
    const upstream = await fetch(gatewayWaitlistUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: normalized,
        product: "propfund",
        source: "landing",
      }),
      cache: "no-store",
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "application/json";

    return new NextResponse(text || null, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to reach waitlist service" },
      { status: 502 },
    );
  }
}
