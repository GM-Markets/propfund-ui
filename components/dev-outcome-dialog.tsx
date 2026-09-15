"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DevOutcomeDialog({
  open,
  title,
  description,
  pending,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  title: string;
  description: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (outcome: "success" | "failure") => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" disabled={pending} onClick={() => onChoose("failure")}>
            {pending ? "Applying…" : "Simulate failure"}
          </Button>
          <Button disabled={pending} onClick={() => onChoose("success")}>
            {pending ? "Applying…" : "Simulate success"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
