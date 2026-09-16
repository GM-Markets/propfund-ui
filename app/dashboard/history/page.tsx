import type { Metadata } from "next";

import { HistoryView } from "@/components/dashboard/history-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "History" };

/** History (PRD §10.6): every account with outcome and a read-only statement. */
export default function HistoryPage() {
  return (
    <div>
      <PageHeader title="History" description="Every account with its fee, outcome and statement" />
      <HistoryView />
    </div>
  );
}
