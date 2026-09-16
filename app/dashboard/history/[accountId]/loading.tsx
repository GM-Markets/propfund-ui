import { PageHeaderSkeleton, StatementSkeleton } from "@/components/dashboard/skeletons";

export default function StatementLoading() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton />
      <StatementSkeleton />
    </div>
  );
}
