import { PageHeaderSkeleton, WalletSkeleton } from "@/components/dashboard/skeletons";

export default function WalletLoading() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton />
      <WalletSkeleton />
    </div>
  );
}
