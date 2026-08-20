import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { SyncFailureAlert } from "@/shared/sync-failure-alerts";

const SYNC_FAILURE_CHANNEL = "sync-failures";

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
