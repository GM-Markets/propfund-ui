import { redirect } from "next/navigation";

/** Old deep links: sign-in happens in a modal on /dashboard (PRD §2). */
export default function LoginRedirect() {
  redirect("/dashboard");
}
