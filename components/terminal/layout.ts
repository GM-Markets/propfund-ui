/**
 * Terminal frame classes, shared by the live terminal and its skeleton so both
 * have identical dimensions.
 *
 * Desktop (lg+): markets | header+chart | book | order form, bottom tabs under
 * chart and book. Below lg: one column in the PRD's mobile stack order, with
 * room at the bottom for the fixed Buy / Sell bar.
 */
export const TERMINAL_ROOT =
  "flex min-w-0 flex-col gap-px bg-border overscroll-none pb-[calc(60px+env(safe-area-inset-bottom))] lg:pb-0";

export const TERMINAL_GRID =
  "grid min-w-0 grid-cols-1 gap-px bg-border lg:grid-cols-[auto_minmax(0,1fr)_248px_300px] lg:grid-rows-[56px_500px_300px]";
