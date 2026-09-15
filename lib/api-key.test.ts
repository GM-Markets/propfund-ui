import { describe, expect, it } from "vitest";

import { presentedApiKey } from "./api-key";

describe("presentedApiKey", () => {
  it("prefers the combined key field Vanta already returns", () => {
    expect(
      presentedApiKey({
        key: "key_abc.secret",
        key_id: undefined,
        key_secret: undefined,
      }),
    ).toBe("key_abc.secret");
  });

  it("joins the split fields used by the original key service", () => {
    expect(presentedApiKey({ key_id: "key_abc", key_secret: "secret" })).toBe("key_abc.secret");
  });

  it("does not render undefined.undefined when the secret is missing", () => {
    expect(presentedApiKey({ id: "key_abc" } as { key?: string })).toBeNull();
  });
});
