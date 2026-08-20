export type LocalTestNotificationResult = "SENT" | "PERMISSION_REQUIRED" | "UNAVAILABLE" | "ERROR";

export function localTestNotificationResultMessage(result: LocalTestNotificationResult): string {
  const messages: Record<LocalTestNotificationResult, string> = {
    SENT: "Test notification sent. Check your device notification tray.",
    PERMISSION_REQUIRED: "Enable sync-failure alerts and notification permission before testing delivery.",
    UNAVAILABLE: "Local device notifications require a native mobile build.",
    ERROR: "The local test could not be scheduled. Check device notification settings and retry.",
  };
  return messages[result];
}
