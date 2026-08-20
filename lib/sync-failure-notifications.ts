import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { createRedactedPushTokenRegistration, type DevicePushTokenRegistration } from "@/shared/push-token-registration";
import type { SyncFailureAlert } from "@/shared/sync-failure-alerts";
import type { LocalTestNotificationResult } from "@/shared/test-notification";

const SYNC_FAILURE_CHANNEL = "sync-failures";

export type { DevicePushTokenRegistration } from "@/shared/push-token-registration";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureSyncFailureNotifications(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(SYNC_FAILURE_CHANNEL, {
    name: "Connection sync alerts",
    description: "Rate-limit and expired-token alerts for connected accounts.",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    lightColor: "#007C7A",
  });
}

export async function requestSyncFailureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    await configureSyncFailureNotifications();
    const existing = await Notifications.getPermissionsAsync();
    const status = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
    return status === "granted";
  } catch {
    return false;
  }
}

function pendingServerRegistration(token: string): DevicePushTokenRegistration {
  return createRedactedPushTokenRegistration(token);
}

export async function registerDevicePushToken(): Promise<DevicePushTokenRegistration> {
  const updatedAt = new Date().toISOString();
  if (Platform.OS === "web") {
    return { state: "UNAVAILABLE", updatedAt, detail: "Device push tokens require a native mobile build." };
  }
  if (!Device.isDevice) {
    return { state: "UNAVAILABLE", updatedAt, detail: "Device push tokens can be registered only on a physical device." };
  }

  try {
    const granted = await requestSyncFailureNotificationPermission();
    if (!granted) {
      return { state: "PERMISSION_DENIED", updatedAt, detail: "Notification permission is required before a device token can be registered." };
    }
    const token = await Notifications.getDevicePushTokenAsync();
    const tokenValue = typeof token.data === "string" ? token.data : JSON.stringify(token.data);
    return pendingServerRegistration(tokenValue);
  } catch {
    return { state: "ERROR", updatedAt, detail: "The device token could not be acquired. Check connectivity and retry later." };
  }
}

export function subscribeToDevicePushTokenChanges(onTokenChange: (registration: DevicePushTokenRegistration) => void): { remove: () => void } {
  return Notifications.addPushTokenListener((token) => {
    const tokenValue = typeof token.data === "string" ? token.data : JSON.stringify(token.data);
    onTokenChange(createRedactedPushTokenRegistration(tokenValue, "A refreshed device token is ready for a future authenticated server registration. Its full value is not stored on this device."));
  });
}

export async function sendLocalTestNotification(): Promise<LocalTestNotificationResult> {
  if (Platform.OS === "web") return "UNAVAILABLE";

  try {
    await configureSyncFailureNotifications();
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== "granted") return "PERMISSION_REQUIRED";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Autonomous test alert",
        body: "Local sync-failure notifications are ready on this device.",
        data: { type: "sync-failure-test", localOnly: true },
      },
      trigger: null,
    });
    return "SENT";
  } catch {
    return "ERROR";
  }
}

export async function presentSyncFailureNotification(alert: SyncFailureAlert): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== "granted") return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.title,
        body: alert.message,
        data: { alertId: alert.id, providerId: alert.providerId, kind: alert.kind },
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}
