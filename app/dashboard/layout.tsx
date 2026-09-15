import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PrivyAppProvider } from "@/components/privy/PrivyAppProvider";
import { getSessionTokenFromCookie } from "@/lib/session";

// Auth-gated routes must render per-request so each visit reads the live
// session cookie. Without this, Next prerenders /dashboard at build time (no
// cookie → baked redirect to /login), which permanently bounces signed-in
// users back to login in production.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getSessionTokenFromCookie();
  if (!token) redirect("/login");
  return (
    <PrivyAppProvider>
      <AppShell>{children}</AppShell>
    </PrivyAppProvider>
  );
}
