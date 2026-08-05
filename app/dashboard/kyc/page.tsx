import { CheckCircle2, FileCheck2, ScanFace, ShieldCheck } from "lucide-react";

import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as hsc from "@/lib/hsc/client";

import { KycStartButton } from "./KycStartButton";

const STEPS = [
  { icon: FileCheck2, title: "Submit your ID", desc: "Upload a government-issued document." },
  { icon: ScanFace, title: "Liveness check", desc: "A quick selfie to confirm it's you." },
  { icon: CheckCircle2, title: "Get verified", desc: "Approval usually lands in minutes." },
];

export default async function KycPage() {
  const status = await hsc.kyc.status().catch(() => null);
  const verified = status?.kyc_status === "verified";

  return (
    <div>
      <PageHeader
        title="Identity verification"
        description="Verify your identity to unlock trading and payouts."
        actions={<DocsLink href="/docs/kyc" />}
      />

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Current status</CardTitle>
            <CardDescription>Powered by Sumsub ID + liveness.</CardDescription>
          </div>
          <StatusBadge status={status?.kyc_status} />
        </CardHeader>
        {status?.kyc_failure_reason && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Verification needs attention</AlertTitle>
              <AlertDescription>{status.kyc_failure_reason}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {verified ? (
        <Alert variant="success">
          <ShieldCheck />
          <AlertTitle>You&apos;re verified</AlertTitle>
          <AlertDescription>
            Your identity is confirmed. You have full access to trading and payouts.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start verification</CardTitle>
            <CardDescription>
              It takes about two minutes. Have your ID ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="rounded-lg border border-border bg-card/40 p-4">
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-sm font-medium">
                    {i + 1}. {title}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
            <KycStartButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
