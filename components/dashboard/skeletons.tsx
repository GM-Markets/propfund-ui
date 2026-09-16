import { ActiveAccountCardSkeleton } from "@/components/dashboard/active-account-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route and section skeletons with the final layout's dimensions. Route
 * `loading.tsx` files render `<PageHeaderSkeleton />` + the content skeleton;
 * client views render only the content skeleton (the header is static).
 */

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8" aria-hidden="true">
      <Skeleton className="h-8 w-44 sm:h-9" />
      <Skeleton className="mt-1.5 h-5 w-80 max-w-full" />
    </div>
  );
}

function SectionHeadingSkeleton() {
  return (
    <div className="mb-4" aria-hidden="true">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-0.5 h-5 w-64 max-w-full" />
    </div>
  );
}

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      <Card className="hidden overflow-hidden p-0 md:block">
        <Skeleton className="h-11 rounded-none" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-t border-border px-4 py-3">
            <Skeleton className="h-6" />
          </div>
        ))}
      </Card>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true" data-testid="overview-skeleton">
      <div className="grid gap-4 lg:grid-cols-3">
        <ActiveAccountCardSkeleton className="lg:col-span-2" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[13.5rem] rounded-xl" />
          <Skeleton className="h-[11.5rem] rounded-xl" />
        </div>
      </div>
      <div>
        <SectionHeadingSkeleton />
        <Card className="divide-y divide-border overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex h-16 items-center gap-3 px-4 sm:px-5">
              <div className="flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1 h-4 w-28" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function ChallengesSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true" data-testid="challenges-skeleton">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
      <div>
        <SectionHeadingSkeleton />
        <Card className="grid gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card p-4 sm:p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-1 h-10" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function PayoutsSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true" data-testid="payouts-skeleton">
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[27rem] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[15.5rem] rounded-xl" />
      </div>
      <div>
        <SectionHeadingSkeleton />
        <TableSkeleton rows={2} />
      </div>
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true" data-testid="wallet-skeleton">
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-60 rounded-xl lg:col-span-2" />
        <Skeleton className="h-44 rounded-xl lg:h-60" />
      </div>
      <div>
        <SectionHeadingSkeleton />
        <Skeleton className="h-9 rounded-lg sm:max-w-md" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-[6.25rem] rounded-xl" />
          <Skeleton className="h-[6.25rem] rounded-xl" />
        </div>
      </div>
      <div>
        <SectionHeadingSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div aria-hidden="true" data-testid="history-skeleton">
      <TableSkeleton rows={4} />
    </div>
  );
}

export function StatementSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true" data-testid="statement-skeleton">
      <div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-7 w-56" />
        <Skeleton className="mt-1 h-5 w-72 max-w-full" />
      </div>
      <Skeleton className="h-52 rounded-xl sm:h-44 lg:h-36" />
      <div>
        <SectionHeadingSkeleton />
        <Skeleton className="h-[16rem] rounded-xl" />
      </div>
      <div>
        <SectionHeadingSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}
