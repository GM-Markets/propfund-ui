import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { Brand } from "./brand";
import { BRAND_NAME } from "@/lib/brand";

describe("Brand", () => {
  it("renders the tile and the wordmark by default", () => {
    const { getByRole, container } = render(<Brand />);
    const lockup = getByRole("img", { name: BRAND_NAME });
    expect(lockup.textContent).toContain("pr");
    expect(lockup.textContent).toContain("pfund");
    // Tile + two eyes + two pupils.
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("svg circle")).toHaveLength(4);
  });

  it("renders the tile alone when the wordmark is hidden", () => {
    const { getByRole } = render(<Brand showWordmark={false} />);
    const svg = getByRole("img", { name: BRAND_NAME });
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 512 512");
  });

  it("never renders a third-party wordmark", () => {
    const { container } = render(<Brand />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("forwards className", () => {
    const { getByRole } = render(<Brand className="custom-class" />);
    expect(getByRole("img", { name: BRAND_NAME }).getAttribute("class")).toContain("custom-class");
  });
});
