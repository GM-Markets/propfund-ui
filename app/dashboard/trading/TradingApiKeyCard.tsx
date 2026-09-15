"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { presentedApiKey } from "@/lib/api-key";
import { friendlyError } from "@/lib/errors";
import { VantaBrowserError, browserApiKeys } from "@/lib/vanta/browser";

export function TradingApiKeyCard({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  async function create() {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const data = await browserApiKeys.create({ label, prop_account_id: accountId });
      const next = presentedApiKey(data);
      if (!next) {
        toast.error("Key created, but the secret was missing. Check API keys.");
        return;
      }
      setSecret(next);
      setLabel("");
      setOpen(false);
    } catch (e) {
      toast.error(
        e instanceof VantaBrowserError
          ? friendlyError(e.code, e.message)
          : e instanceof Error
            ? e.message
            : "Failed to create key.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4 text-muted-foreground" />
            Automated trades
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mint a desk key bound to this account. Bots send <code>value</code> in USDC on{" "}
            <code>/v2/trading/orders</code>.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/api-keys">Manage keys</Link>
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            Create API key
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a trading API key</DialogTitle>
            <DialogDescription>
              This key is scoped to the selected prop account and only works on desk endpoints.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="bot-label">Label</Label>
            <Input
              id="bot-label"
              placeholder="e.g. Trading bot"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={create} loading={creating} disabled={!label.trim()}>
              Create key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(secret)} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your API key</DialogTitle>
            <DialogDescription>
              This secret is shown only once. Copy it now and store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>You won&apos;t be able to view this secret again after closing.</span>
          </div>
          <code className="block break-all rounded-lg border border-border bg-background/60 p-3 font-mono text-xs">
            {secret}
          </code>
          <DialogFooter>
            {secret && <CopyButton value={secret} label="Copy secret" />}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
