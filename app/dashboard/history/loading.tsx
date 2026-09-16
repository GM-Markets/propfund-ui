import { HistorySkeleton, PageHeaderSkeleton } from "@/components/dashboard/skeletons";

export default function HistoryLoading() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton />
      <HistorySkeleton />
    </div>
  );
}
