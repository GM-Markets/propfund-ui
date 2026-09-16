import { PageHeaderSkeleton, PayoutsSkeleton } from "@/components/dashboard/skeletons";

export default function PayoutsLoading() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton />
      <PayoutsSkeleton />
    </div>
  );
}
