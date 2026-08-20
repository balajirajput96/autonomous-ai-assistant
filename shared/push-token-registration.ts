export type DevicePushTokenState = "NOT_REGISTERED" | "REGISTERING" | "PENDING_SERVER_REGISTRATION" | "UNAVAILABLE" | "PERMISSION_DENIED" | "ERROR";

export type DevicePushTokenRegistration = {
  state: DevicePushTokenState;
  updatedAt: string;
  fingerprint?: string;
  detail?: string;
};

export function devicePushTokenStateLabel(state: DevicePushTokenState): string {
  const labels: Record<DevicePushTokenState, string> = {
    NOT_REGISTERED: "Not registered",
    REGISTERING: "Registering",
    PENDING_SERVER_REGISTRATION: "Ready for server registration",
    UNAVAILABLE: "Unavailable on this device",
    PERMISSION_DENIED: "Notification permission denied",
    ERROR: "Registration needs attention",
  };
  return labels[state];
}

export function createRedactedPushTokenRegistration(token: string, detail?: string): DevicePushTokenRegistration {
  return {
    state: "PENDING_SERVER_REGISTRATION",
    updatedAt: new Date().toISOString(),
    fingerprint: `Native device token acquired (${token.length} characters)`,
    detail: detail ?? "The token is ready for a future authenticated server registration. Its full value is not stored on this device.",
  };
}
