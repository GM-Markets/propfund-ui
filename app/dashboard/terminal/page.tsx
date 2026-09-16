import type { Metadata } from "next";
import { Suspense } from "react";

import { Terminal } from "@/components/terminal/terminal";
import { TerminalSkeleton } from "@/components/terminal/terminal-skeleton";

export const metadata: Metadata = { title: "Terminal" };

/**
 * Terminal (PRD §10.3): account strip, four-pane row (markets · price header
 * and chart · order book · order form), bottom tabs. Full-width route (see
 * components/nav.ts). Suspense covers `?symbol=` being read on the client.
 */
export default function TerminalPage() {
  return (
    <Suspense fallback={<TerminalSkeleton />}>
      <Terminal />
    </Suspense>
  );
}
