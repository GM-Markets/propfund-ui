import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { Brand } from "./brand";
import { BRAND_NAME } from "@/lib/brand";

describe("Brand", () => {
  it("renders the Propfund wordmark by default", () => {
    const { getByRole } = render(<Brand />);
    const img = getByRole("img", { name: BRAND_NAME }) as HTMLImageElement;
    expect(img.tagName.toLowerCase()).toBe("img");
    expect(img.getAttribute("src")).toContain("propfund-wordmark-light.svg");
  });

  it("renders the mark-only lockup when the wordmark is hidden", () => {
    const { getByRole } = render(<Brand showWordmark={false} />);
    const img = getByRole("img", { name: BRAND_NAME }) as HTMLImageElement;
    expect(img.getAttribute("src")).toContain("propfund-mark-light.svg");
  });

  it("renders the paper wordmark on light surfaces", () => {
    const { getByRole } = render(<Brand variant="onPaper" />);
    expect(getByRole("img", { name: BRAND_NAME }).getAttribute("src")).toContain(
      "propfund-wordmark-dark.svg",
    );
  });

  it("renders the Hyperscaled wordmark as an <img>", () => {
    const { getByAltText } = render(<Brand brand="hyperscaled" />);
    const img = getByAltText("Hyperscaled") as HTMLImageElement;
    expect(img.tagName.toLowerCase()).toBe("img");
    expect(img.getAttribute("src")).toContain("hyperscaled-wordmark.svg");
  });

  it("forwards className", () => {
    const { getByRole } = render(<Brand className="custom-class" />);
    expect(getByRole("img", { name: BRAND_NAME }).getAttribute("class")).toContain("custom-class");
  });
});
