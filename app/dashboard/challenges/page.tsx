import { Suspense } from "react";
import type { Metadata } from "next";

import { ChallengesView } from "@/components/dashboard/challenges-view";
import { ChallengesSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Challenges" };

/** Challenges (PRD §4, §10.2): five package cards, rules summary, checkout sheet. */
export default function ChallengesPage() {
  return (
    <div>
      <PageHeader title="Challenges" description="Pick a package. One step, the same rules at every size" />
      <Suspense fallback={<ChallengesSkeleton />}>
        <ChallengesView />
      </Suspense>
    </div>
  );
}
