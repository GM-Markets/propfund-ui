import { Skeleton } from "@/components/ui/skeleton";

import { AccountStripSkeleton } from "./account-strip";
import { OrderFormSkeleton } from "./order-form";
import { TERMINAL_GRID, TERMINAL_ROOT } from "./layout";

/** Same frame as the live terminal (strip, four panes, bottom tabs) so nothing shifts when data lands. */
export function TerminalSkeleton() {
  return (
    <div aria-hidden="true" className={TERMINAL_ROOT}>
      <AccountStripSkeleton />
      <div className={TERMINAL_GRID}>
        <div className="hidden bg-background lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:flex lg:w-11 2xl:w-[232px]">
          <Skeleton className="m-2 h-8 w-full" />
        </div>
        <div className="flex h-14 items-center gap-3 bg-background px-3 lg:col-span-2 lg:col-start-2 lg:row-start-1">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex h-[340px] flex-col bg-background lg:col-start-2 lg:row-start-2 lg:h-auto">
          <div className="h-9 border-b border-border" />
          <Skeleton className="m-0 flex-1 rounded-none" />
        </div>
        <div className="hidden bg-background lg:col-start-3 lg:row-start-2 lg:block">
          <div className="h-9 border-b border-border" />
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 16 }, (_, i) => (
              <Skeleton key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </div>
        <div className="min-h-[240px] bg-background lg:col-span-2 lg:col-start-2 lg:row-start-3 lg:h-auto">
          <div className="h-10 border-b border-border" />
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        </div>
        <div className="hidden bg-background lg:col-start-4 lg:row-span-3 lg:row-start-1 lg:block">
          <OrderFormSkeleton />
        </div>
        <div className="h-[501px] bg-background lg:hidden">
          <Skeleton className="m-2 h-8 w-auto" />
        </div>
      </div>
    </div>
  );
}
