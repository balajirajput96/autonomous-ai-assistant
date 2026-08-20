import { describe, expect, it } from "vitest";

import { createSyncFailureAlert, syncFailureKindLabel } from "../shared/sync-failure-alerts";

describe("sync failure alerts", () => {
  it("creates a rate-limit alert with a wait-and-retry recovery path", () => {
    const alert = createSyncFailureAlert("github", "RATE_LIMIT", "2026-08-20T12:00:00.000Z");

    expect(alert.title).toBe("GitHub sync delayed");
    expect(alert.retryAt).toBe("2026-08-20T12:00:00.000Z");
    expect(alert.recovery).toContain("Wait for the provider retry window");
    expect(syncFailureKindLabel(alert.kind)).toBe("Rate limit");
  });

  it("creates an expired-token alert that requests reconnection instead of retrying blindly", () => {
    const alert = createSyncFailureAlert("gmail", "EXPIRED_TOKEN");

    expect(alert.title).toBe("Gmail needs reconnection");
    expect(alert.message).toContain("credentials have expired");
    expect(alert.recovery).toContain("Reconnect this provider");
    expect(syncFailureKindLabel(alert.kind)).toBe("Token expired");
  });
});
