"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signAgreementAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError } from "@/lib/errors";

export function AgreementSignCard({
  version,
  onSigned,
}: {
  version: string;
  onSigned?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function sign() {
    const signature = name.trim();
    if (!signature) {
      toast.error("Enter the legal name you sign with.");
      return false;
    }
    setPending(true);
    const r = await signAgreementAction({ agreement_version: version, signature_name: signature });
    setPending(false);
    if (!r.ok) {
      toast.error(friendlyError(r.code, r.message));
      return false;
    }
    toast.success("Agreement signed. You can trade.");
    onSigned?.();
    router.refresh();
    return true;
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Sign the current agreement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Orders are blocked until you accept the current terms and rules. This is version{" "}
          <span className="font-medium text-foreground">{version}</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Read the{" "}
          <Link href="/terms-of-service" className="text-primary hover:underline" target="_blank">
            terms of service
          </Link>{" "}
          and{" "}
          <Link href="/rules" className="text-primary hover:underline" target="_blank">
            trading rules
          </Link>
          .
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="agreement-signer">Legal name</Label>
            <Input
              id="agreement-signer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              autoComplete="name"
            />
          </div>
          <Button onClick={() => void sign()} loading={pending}>
            Accept and sign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

