"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Couldn&apos;t load this page</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The request to hyperscaled-api failed. This is often a temporary connectivity issue.
        </p>
        <Button onClick={reset} className="mt-6">
          <RotateCw /> Retry
        </Button>
      </CardContent>
    </Card>
  );
}
