"use client";

import { SignInDialog } from "@/components/auth-shell";
import { TestControls } from "@/components/test-controls";
import { TopProgressBar } from "@/components/top-progress-bar";
import { AuthProvider } from "@/lib/propfund/auth";

/**
 * App-wide client providers: sign-in (real provider SDK loads client-side
 * only), the global sign-in dialog opened by `useAuth().signIn()`, the route
 * progress bar, and the test controls drawer.
 *
 * The drawer is mounted here rather than in the dashboard so it is reachable
 * on the signed-out public site and on /transparency too. It renders nothing
 * unless `NEXT_PUBLIC_TEST_CONTROLS=true` and the build is not production
 * (PRD §12).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TopProgressBar />
      {children}
      <SignInDialog />
      <TestControls />
    </AuthProvider>
  );
}
