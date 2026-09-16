"use client";

import { toast } from "sonner";

import { errorMessage } from "@/lib/errors";

export type ToastResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Run an async action with a sonner loading toast that turns into a success
 * or error toast (error copy = `ServiceError.message`). Never throws: callers
 * branch on `ok`, so a failed action can't become an unhandled rejection.
 */
export async function withToast<T>(
  fn: () => Promise<T>,
  copy: { loading: string; success: string | ((value: T) => string) },
): Promise<ToastResult<T>> {
  const id = toast.loading(copy.loading);
  try {
    const value = await fn();
    toast.success(typeof copy.success === "function" ? copy.success(value) : copy.success, { id });
    return { ok: true, value };
  } catch (error) {
    toast.error(errorMessage(error), { id });
    return { ok: false, error };
  }
}

/** Error code of a thrown service error, if any. */
export function errorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof (error as { code: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  return null;
}
