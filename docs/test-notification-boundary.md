# Local Test-Notification Boundary

## Purpose

**Send Test Notification** verifies only the local device-notification path: the Android channel, current notification permission, and the ability to schedule an immediate on-device notification. It does not use a device push token, contact Expo, FCM, APNs, an OAuth provider, or this application’s server.

| Condition | Control Behaviour | Result Message |
| --- | --- | --- |
| Device notifications enabled | Schedule one immediate local notification in the sync-failure channel. | “Test notification sent. Check your device notification tray.” |
| Permission unavailable or denied | Do not schedule a notification or request a token. | “Enable sync-failure alerts and notification permission before testing delivery.” |
| Web preview or unsupported environment | Do not schedule a notification. | “Local device notifications require a native mobile build.” |
| Native scheduling error | Do not retry automatically. | “The local test could not be scheduled. Check device notification settings and retry.” |

The test control is separate from device push-token registration. A successful local notification does not prove that background remote delivery has been configured. Remote delivery still requires a registered device token, authenticated server registration, provider credentials, and a verified server-side event.
