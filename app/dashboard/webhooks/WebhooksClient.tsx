"use client";

import { useState } from "react";
import { Plus, Trash2, Webhook } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Endpoint = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  description: string | null;
};

const EVENT_OPTIONS = ["payment.succeeded", "payment.failed", "kyc.updated", "payout.completed", "*"];

export function WebhooksClient({ endpoints: initial }: { endpoints: Endpoint[] }) {
  const [endpoints, setEndpoints] = useState(initial);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["*"]);
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  function toggle(ev: string) {
    setEvents((prev) => (prev.includes(ev) ? prev.filter((x) => x !== ev) : [...prev, ev]));
  }

  async function create() {
    if (!url.trim()) return toast.error("Enter a URL.");
    if (events.length === 0) return toast.error("Select at least one event.");
    setCreating(true);
    try {
      const r = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(friendlyError(data.code, data.message));
        return;
      }
      setEndpoints([data, ...endpoints]);
      setUrl("");
      setEvents(["*"]);
      if (data.secret) setSecret(data.secret);
      toast.success("Webhook endpoint registered.");
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    const r = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    if (r.ok) {
      setEndpoints(endpoints.filter((e) => e.id !== id));
      toast.success("Endpoint removed.");
    } else {
      toast.error("Couldn't remove endpoint.");
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Register an endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input
              id="url"
              placeholder="https://your-app.example.com/hsc-webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((ev) => {
                const active = events.includes(ev);
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => toggle(ev)}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                      active
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {ev}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={create} loading={creating}>
            <Plus /> Register endpoint
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <EmptyState
              icon={Webhook}
              title="No endpoints registered"
              description="Register a URL to start receiving event notifications."
            />
          ) : (
            <div className="space-y-3">
              {endpoints.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/40 p-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm">{e.url}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {e.events.map((ev) => (
                        <Badge key={ev} variant="outline" className="font-mono text-[11px]">
                          {ev}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(e.id)}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(secret)} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signing secret</DialogTitle>
            <DialogDescription>
              Use this secret to verify the signature on incoming webhooks. It&apos;s shown only once.
            </DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded-lg border border-border bg-background/60 p-3 font-mono text-xs">
            {secret}
          </code>
          <DialogFooter>{secret && <CopyButton value={secret} label="Copy secret" />}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
