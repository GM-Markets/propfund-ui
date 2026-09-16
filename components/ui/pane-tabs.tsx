"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Dense, underline-style tabs for terminal panes (Radix Tabs: arrow keys,
 * roving focus, ARIA). `size="sm"` fits pane headers, `md` the bottom tabs.
 */
const PaneTabs = TabsPrimitive.Root;

const PaneTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("flex min-w-0 items-stretch gap-4", className)} {...props} />
));
PaneTabsList.displayName = "PaneTabsList";

const paneTabsTriggerVariants = cva(
  "relative inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-transparent data-[state=active]:after:bg-primary",
  {
    variants: {
      size: {
        sm: "h-9 text-xs",
        md: "h-10 text-sm",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

const PaneTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof paneTabsTriggerVariants>
>(({ className, size, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(paneTabsTriggerVariants({ size }), className)} {...props} />
));
PaneTabsTrigger.displayName = "PaneTabsTrigger";

const PaneTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("min-h-0 outline-none", className)} {...props} />
));
PaneTabsContent.displayName = "PaneTabsContent";

export { PaneTabs, PaneTabsList, PaneTabsTrigger, PaneTabsContent, paneTabsTriggerVariants };
