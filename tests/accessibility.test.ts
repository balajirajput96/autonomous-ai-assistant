import { describe, expect, it } from "vitest";

import { scaleTextSize, textScaleLabel, textScaleMultiplier } from "../shared/accessibility";

describe("accessibility preferences", () => {
  it("uses predictable text-scale multipliers for each visible preference", () => {
    expect(textScaleMultiplier("STANDARD")).toBe(1);
    expect(textScaleMultiplier("LARGE")).toBe(1.15);
    expect(textScaleMultiplier("EXTRA_LARGE")).toBe(1.3);
  });

  it("returns readable labels and scaled sizes without exposing implementation values to users", () => {
    expect(textScaleLabel("EXTRA_LARGE")).toBe("Extra large");
    expect(scaleTextSize(20, "LARGE")).toBe(23);
    expect(scaleTextSize(20, "EXTRA_LARGE")).toBe(26);
  });
});
