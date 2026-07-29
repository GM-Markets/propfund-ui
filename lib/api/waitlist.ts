const WAITLIST_EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type JoinWaitlistError = "invalid_email" | "rate_limited" | "network" | "server";

export type JoinWaitlistResult =
  | { ok: true; alreadyRegistered: boolean }
  | { ok: false; error: JoinWaitlistError };

export function normalizeWaitlistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidWaitlistEmail(email: string): boolean {
  const normalized = normalizeWaitlistEmail(email);
  return (
    normalized.length > 0 &&
    normalized.length <= 254 &&
    WAITLIST_EMAIL_RE.test(normalized)
  );
}

export function waitlistErrorMessage(error: JoinWaitlistError): string {
  switch (error) {
    case "invalid_email":
      return "Enter a valid email address.";
    case "rate_limited":
      return "Too many requests. Please try again in a few minutes.";
    case "network":
      return "Couldn't reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Join the Propfund product waitlist via same-origin proxy (avoids gateway CORS). */
export async function joinPropFundWaitlist(email: string): Promise<JoinWaitlistResult> {
  const normalized = normalizeWaitlistEmail(email);
  if (!isValidWaitlistEmail(normalized)) {
    return { ok: false, error: "invalid_email" };
  }

  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: normalized }),
    });

    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        alreadyRegistered?: boolean;
      };
      return { ok: true, alreadyRegistered: Boolean(body.alreadyRegistered) };
    }

    if (res.status === 400) return { ok: false, error: "invalid_email" };
    if (res.status === 429) return { ok: false, error: "rate_limited" };
    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}
