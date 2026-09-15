import { Skeleton } from "@/components/ui/skeleton";

export default function CopyTradeLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="mt-6 h-24 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
