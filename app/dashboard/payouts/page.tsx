import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PayoutsPage() {
  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Weekly reward requests after you pass and complete seven trading days."
        actions={<DocsLink href="/docs/payouts" />}
      />
      <Alert>
        <AlertTitle>Connect payouts are next</AlertTitle>
        <AlertDescription>
          The latest Vanta desk is live for evaluation and trading. Bank Connect / reward
          disbursement is not exposed on this API yet — funded accounts will request rewards here
          once that surface ships.
        </AlertDescription>
      </Alert>
    </div>
  );
}
