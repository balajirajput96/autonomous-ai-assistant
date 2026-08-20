import { describe, expect, it } from "vitest";

import { createRedactedPushTokenRegistration, devicePushTokenStateLabel } from "../shared/push-token-registration";

describe("device push-token registration", () => {
  it("renders explicit states for user-facing registration status", () => {
    expect(devicePushTokenStateLabel("PENDING_SERVER_REGISTRATION")).toBe("Ready for server registration");
    expect(devicePushTokenStateLabel("PERMISSION_DENIED")).toBe("Notification permission denied");
  });

  it("stores only a redacted fingerprint rather than the raw device token", () => {
    const token = "ExponentPushToken[private-device-token-value]";
    const registration = createRedactedPushTokenRegistration(token);

    expect(registration.state).toBe("PENDING_SERVER_REGISTRATION");
    expect(registration.fingerprint).toBe(`Native device token acquired (${token.length} characters)`);
    expect(JSON.stringify(registration)).not.toContain(token);
  });
});
