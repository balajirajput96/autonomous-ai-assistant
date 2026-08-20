import { describe, expect, it } from "vitest";

import { localTestNotificationResultMessage } from "../shared/test-notification";

describe("local test-notification results", () => {
  it("explains that a sent notification is local-device verification", () => {
    expect(localTestNotificationResultMessage("SENT")).toBe("Test notification sent. Check your device notification tray.");
  });

  it("keeps permission and environment failures actionable", () => {
    expect(localTestNotificationResultMessage("PERMISSION_REQUIRED")).toContain("notification permission");
    expect(localTestNotificationResultMessage("UNAVAILABLE")).toContain("native mobile build");
  });
});
