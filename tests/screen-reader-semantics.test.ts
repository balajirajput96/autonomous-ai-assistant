import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("screen-reader semantic coverage", () => {
  it("keeps roles, selected states, hints, and live task status on primary chat and activity controls", () => {
    const chat = source("app/(tabs)/index.tsx");
    const activity = source("app/(tabs)/activity.tsx");

    expect(chat).toContain('accessibilityRole="tab"');
    expect(chat).toContain("accessibilityHint=");
    expect(chat).toContain('accessibilityLiveRegion="polite"');
    expect(activity).toContain('accessibilityRole="tab"');
    expect(activity).toContain("accessibilityState={{ selected }}");
  });

  it("keeps named settings controls and a modal task-detail boundary", () => {
    const settings = source("app/(tabs)/settings.tsx");
    const taskDetail = source("components/task-detail-sheet.tsx");

    expect(settings).toContain('accessibilityRole="switch"');
    expect(settings).toContain("Enable sync failure alerts before");
    expect(taskDetail).toContain("accessibilityViewIsModal");
    expect(taskDetail).toContain('accessibilityLiveRegion="polite"');
  });
});
