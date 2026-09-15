"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { requestAccessAction } from "@/app/actions/app-requests";
import { SiteFooter, SiteHeader } from "@/components/propfund/SiteChrome";
import { friendlyError } from "@/lib/errors";

export default function RequestAccessPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ email: string } | null>(null);

  async function action(formData: FormData) {
    setError(null);
    const result = await requestAccessAction(formData);
    if (result.ok) {
      setSubmitted({ email: String(formData.get("contact_email") ?? "") });
    } else {
      setError(friendlyError(result.code, result.message));
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="login-page">
        <div className="signup-dialog">
          {submitted ? (
            <div className="form-success">
              <Image
                className="form-success-mark"
                src="/brand/propfund-mark-dark.svg"
                alt=""
                width={35}
                height={31}
                aria-hidden="true"
              />
              <h2>Request received.</h2>
              <p>
                Once an operator approves it, we&apos;ll email {submitted.email} a one-time
                link for your credentials.
              </p>
              <Link className="form-submit" href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Sign in
              </Link>
            </div>
          ) : (
            <form action={action}>
              <div className="form-heading">
                <Image
                  className="dialog-wordmark"
                  src="/brand/propfund-wordmark-dark.svg"
                  alt="Propfund"
                  width={201}
                  height={36}
                />
                <h2>Request API access</h2>
                <p>Tell us about your app — we&apos;ll review and send your credentials.</p>
              </div>
              <div className="field-row">
                <label>
                  <span>Company / app name</span>
                  <input name="company_name" type="text" autoComplete="organization" maxLength={255} required />
                </label>
                <label>
                  <span>Desired slug</span>
                  <input name="slug" type="text" pattern="[a-z0-9][a-z0-9-]*" maxLength={64} required />
                </label>
              </div>
              <div className="field-row">
                <label>
                  <span>Your name</span>
                  <input name="contact_name" type="text" autoComplete="name" maxLength={255} />
                </label>
                <label>
                  <span>Work email</span>
                  <input name="contact_email" type="email" autoComplete="email" required />
                </label>
              </div>
              <label>
                <span>Website</span>
                <input name="website" type="url" maxLength={512} />
              </label>
              <label>
                <span>What are you building?</span>
                <textarea id="use_case" name="use_case" rows={4} maxLength={4000} />
              </label>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="form-submit" type="submit">
                Request access
              </button>
              <small>
                Already have credentials? <Link href="/login">Sign in</Link>
              </small>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
