import { describe, expect, it } from "vitest";

import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it("maps a known code to its friendly copy", () => {
    expect(friendlyError("V2_INVALID_CREDENTIALS")).toBe(
      "That email or password doesn't match our records.",
    );
    expect(friendlyError("V2_EMAIL_TAKEN")).toBe(
      "An account with this email already exists. Try signing in.",
    );
    expect(friendlyError("V2_AGREEMENT_REQUIRED")).toBe(
      "Sign the current agreement before you trade or buy a challenge.",
    );
  });

  it("prefers the known code over a provided fallback", () => {
    expect(friendlyError("V2_OTP_EXPIRED", "raw server text")).toBe(
      "That code has expired. Request a new one.",
    );
  });

  it("uses the fallback for an unknown code", () => {
    expect(friendlyError("V2_SOMETHING_NEW", "Server said no")).toBe("Server said no");
  });

  it("explains a spot sell with no inventory", () => {
    expect(friendlyError("V2_VALIDATION", "spot sell exceeds long inventory")).toBe(
      "You can only sell spot you already hold.",
    );
  });

  it("ignores a JSON-blob fallback so raw envelopes never reach the UI", () => {
    expect(friendlyError("V2_SOMETHING_NEW", '{"detail":{"code":"x"}}')).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("ignores a blank/whitespace fallback", () => {
    expect(friendlyError(undefined, "   ")).toBe("Something went wrong. Please try again.");
  });

  it("falls back to the generic message when nothing is provided", () => {
    expect(friendlyError(undefined)).toBe("Something went wrong. Please try again.");
    expect(friendlyError("")).toBe("Something went wrong. Please try again.");
  });
});
