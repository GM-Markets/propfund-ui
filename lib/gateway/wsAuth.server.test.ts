import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

vi.mock("server-only", () => ({}));

import { gatewayWsAuthPayload, signGatewayWsChallenge } from "./wsAuth.server";

describe("signGatewayWsChallenge", () => {
  const prev = process.env.GATEWAY_WS_AUTH_SECRET;

  afterEach(() => {
    if (prev === undefined) delete process.env.GATEWAY_WS_AUTH_SECRET;
    else process.env.GATEWAY_WS_AUTH_SECRET = prev;
  });

  it("HMACs nonce.ts with the configured secret", () => {
    process.env.GATEWAY_WS_AUTH_SECRET = "test-secret";
    expect(signGatewayWsChallenge("n", 1)).toBe(
      createHmac("sha256", "test-secret").update(gatewayWsAuthPayload("n", 1)).digest("hex"),
    );
  });
});
