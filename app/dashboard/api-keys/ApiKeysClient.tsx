"use client";

import { useState } from "react";
import { KeyRound, Plus, ShieldAlert } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { friendlyError } from "@/lib/errors";

type Key = { id: string; label: string; key_id: string; revoked_at: string | null };

const NONE = "__none__";

export function ApiKeysClient({
  keys: initial,
  accounts,
}: {
  keys: Key[];
  accounts: { id: string; label: string }[];
}) {
  const [keys, setKeys] = useState(initial);
  const [label, setLabel] = useState("");
  const [propAccount, setPropAccount] = useState<string>(NONE);
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  async function create() {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          prop_account_id: propAccount === NONE ? undefined : propAccount,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(friendlyError(data.code, data.message));
        return;
      }
      setSecret(`${data.key_id}.${data.key_secret}`);
      setKeys([{ id: data.id, label: data.label, key_id: data.key_id, revoked_at: null }, ...keys]);
      setLabel("");
      setPropAccount(NONE);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create key.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    const r = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (r.ok) {
      setKeys(keys.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
      toast.success("Key revoked.");
    } else {
      toast.error("Couldn't revoke key.");
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g. Trading bot (prod)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            {accounts.length > 0 && (
              <div className="space-y-1.5 sm:w-64">
                <Label>Prop account</Label>
                <Select value={propAccount} onValueChange={setPropAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No specific account</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={create} loading={creating} disabled={!label.trim()}>
              <Plus /> Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No API keys yet"
              description="Create a key to access the trading API programmatically."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.label}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {k.key_id}
                    </TableCell>
                    <TableCell className="text-right">
                      {k.revoked_at ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => revoke(k.id)}>
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
