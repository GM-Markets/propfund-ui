import { OverviewSkeleton, PageHeaderSkeleton } from "@/components/dashboard/skeletons";

export default function OverviewLoading() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton />
      <OverviewSkeleton />
    </div>
  );
}
