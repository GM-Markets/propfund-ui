"use client";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/propfund/auth";
import { useServiceStatus } from "@/lib/propfund/hooks";

/**
 * Client-gated dashboard (PRD §2, §10). No server redirect:
 * - sign-in state unknown → full shell skeleton,
 * - signed out → sign-in panel over the blurred shell,
 * - signed in → the app shell (content waits for the user's data).
 *
 * The test controls drawer is mounted app-wide in `app/providers.tsx`.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = useAuth();
  const service = useServiceStatus();

  if (!ready) return <AppShell state="loading" />;
  if (!authenticated) return <AppShell state="signed_out" />;
  if (service !== "ready") return <AppShell state="loading" />;

  return <AppShell>{children}</AppShell>;
}
