import { describe, expect, it } from "vitest";

import { emailFromGatewayProfile, identityFromGatewayProfile, unwrapGatewayProfile } from "./profile";

const googleMeta = {
  source: "privy_identity_token",
  privy: {
    linked_accounts: [
      { type: "google_oauth", email: "bob@yield.fi", name: "Bob M" },
      { type: "wallet", wallet_client_type: "privy", address: "0xEmbedded" },
    ],
  },
};

describe("unwrapGatewayProfile", () => {
  it("reads the gateway { profile } envelope", () => {
    expect(
      unwrapGatewayProfile({
        success: true,
        profile: {
          userId: "u1",
          address: "0xabc",
          displayName: "Ada",
          sourceType: "email",
          source: "ada@example.com",
        },
      }),
    ).toMatchObject({
      userId: "u1",
      address: "0xabc",
      displayName: "Ada",
      sourceType: "email",
      source: "ada@example.com",
    });
  });
});

describe("identityFromGatewayProfile", () => {
  it("prefers email and Google name over the embedded wallet", () => {
    expect(
      identityFromGatewayProfile({
        userId: "u1",
        address: "0xEmbedded",
        displayName: null,
        sourceType: "email",
        source: "bob@yield.fi",
        meta: googleMeta,
      }),
    ).toEqual({
      name: "Bob M",
      email: "bob@yield.fi",
      wallet: "0xEmbedded",
    });
  });

  it("uses displayName when set", () => {
    expect(
      identityFromGatewayProfile({
        userId: "u1",
        address: "0xabc",
        displayName: "AdaL",
        sourceType: "email",
        source: "ada@example.com",
      }),
    ).toMatchObject({ name: "AdaL", email: "ada@example.com" });
  });

  it("reads email from sourceType=email", () => {
    expect(
      emailFromGatewayProfile({ sourceType: "email", source: "trader@propfund.io", meta: null }),
    ).toBe("trader@propfund.io");
  });
});
