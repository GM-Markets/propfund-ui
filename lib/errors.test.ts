import { describe, expect, it } from "vitest";

import { ServiceError } from "@/lib/propfund/mock/errors";

import { errorMessage, friendlyError } from "./errors";

describe("friendlyError", () => {
  it("maps a known code to its friendly copy", () => {
    expect(friendlyError("UNAUTHENTICATED")).toBe("Sign in to continue.");
  });

  it("uses the fallback for an unknown code", () => {
    expect(friendlyError("SOMETHING_NEW", "Server said no")).toBe("Server said no");
  });

  it("ignores a JSON-blob or blank fallback", () => {
    expect(friendlyError("X", '{"detail":{"code":"x"}}')).toBe("Something went wrong. Please try again.");
    expect(friendlyError(undefined, "   ")).toBe("Something went wrong. Please try again.");
    expect(friendlyError(undefined)).toBe("Something went wrong. Please try again.");
  });
});

describe("errorMessage", () => {
  it("uses a service error's own message", () => {
    expect(errorMessage(new ServiceError("ACTIVE_ACCOUNT_EXISTS", "You already have an active account."))).toBe(
      "You already have an active account.",
    );
  });

  it("falls back for non-errors", () => {
    expect(errorMessage("boom")).toBe("Something went wrong. Please try again.");
  });
});
