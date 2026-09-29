import { describe, expect, it } from "vitest";

import {
  formatHip4Label,
  formatOutcomeMoney,
  formatOutcomeWhen,
  hip4Wire,
  parseOutcomeCatalog,
  parseOutcomeFields,
} from "./hip4";

describe("formatHip4Label", () => {
  it("turns price templates into a readable question", () => {
    expect(
      formatHip4Label(
        {
          name: "template:priceTouch",
          description: "perp:HYPE|target:100|time:20261001-0000",
        },
        0,
      ),
    ).toBe("HYPE touch $100 Oct 1 · Yes");
    expect(
      formatHip4Label(
        {
          name: "template:binaryPrice",
          description: "perp:BTC|threshold:100000|time:20261001-0000",
        },
        1,
      ),
    ).toBe("BTC ≥ $100,000 Oct 1 · No");
  });

  it("uses team names for a sports contest", () => {
    expect(
      formatHip4Label(
        {
          name: "template:sportsContestWinner",
          description: "shortNameA:Eagles|shortNameB:Bears|participantA:Philadelphia Eagles|participantB:Chicago Bears",
        },
        0,
      ),
    ).toBe("Eagles vs Bears · Eagles");
  });
});

describe("parseOutcomeCatalog", () => {
  it("lists both sides with UI labels and hash wires", () => {
    const rows = parseOutcomeCatalog(
      {
        outcomes: [
          {
            outcome: 1209,
            name: "template:priceTouch",
            description: "perp:HYPE|target:100|time:20261001-0000",
            sideSpecs: [{ name: "template:Yes" }, { name: "template:No" }],
          },
        ],
        questions: [],
      },
      { "#12090": "0.02141", "#12091": "0.97859" },
    );
    expect(rows).toEqual([
      {
        coin: "#12091",
        wire: "#12091",
        mid: 0.97859,
        max_leverage: 1,
        label: "HYPE touch $100 Oct 1 · No",
        dex: "out",
        kind: "hip4",
      },
      {
        coin: "#12090",
        wire: "#12090",
        mid: 0.02141,
        max_leverage: 1,
        label: "HYPE touch $100 Oct 1 · Yes",
        dex: "out",
        kind: "hip4",
      },
    ]);
    expect(hip4Wire(1209, 0)).toBe("#12090");
    expect(parseOutcomeFields("perp:HYPE|target:100").perp).toBe("HYPE");
    expect(formatOutcomeWhen("20261001-0000")).toBe("Oct 1");
    expect(formatOutcomeMoney("100000")).toBe("$100,000");
  });
});
