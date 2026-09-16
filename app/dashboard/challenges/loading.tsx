import { ChallengesSkeleton, PageHeaderSkeleton } from "@/components/dashboard/skeletons";

export default function ChallengesLoading() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton />
      <ChallengesSkeleton />
    </div>
  );
}
