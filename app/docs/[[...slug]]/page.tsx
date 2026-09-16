import { redirect } from "next/navigation";

/** The developer docs were replaced by the trader help center. */
export default function DocsRedirect() {
  redirect("/help");
}
