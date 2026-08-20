import { describe, expect, it } from "vitest";

import { MAIN_SECTION_SHORTCUTS, mainSectionShortcutForKey } from "../shared/keyboard-shortcuts";

describe("main-section keyboard shortcuts", () => {
  it("maps each documented numeric key to the matching primary section", () => {
    expect(MAIN_SECTION_SHORTCUTS).toHaveLength(4);
    expect(mainSectionShortcutForKey("1")?.route).toBe("/");
    expect(mainSectionShortcutForKey("2")?.route).toBe("/activity");
    expect(mainSectionShortcutForKey("3")?.route).toBe("/workspace");
    expect(mainSectionShortcutForKey("4")?.route).toBe("/settings");
  });

  it("does not claim unsupported keys as navigation shortcuts", () => {
    expect(mainSectionShortcutForKey("5")).toBeUndefined();
    expect(mainSectionShortcutForKey("q")).toBeUndefined();
  });
});
