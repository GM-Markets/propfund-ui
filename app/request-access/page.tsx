import { redirect } from "next/navigation";

import { START_CHALLENGE_PATH } from "@/components/propfund/site-data";

/** The old access form is gone. Old links land on the challenges page, which shows sign-in when needed. */
export default function RequestAccessRedirect() {
  redirect(START_CHALLENGE_PATH);
}
