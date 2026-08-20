# OAuth Sync-Failure Notification Boundary

## Event Types and Recovery

The application distinguishes a provider **rate limit** from an **expired token** because the user action differs. A rate-limit alert tells the user that the provider temporarily rejected a sync and directs them to wait for the stated retry window; it must not ask for unnecessary reauthorization. An expired-token alert directs the user to reconnect once the verified OAuth flow exists; it must not promise that the current local app can renew credentials.

| Event | In-app Alert | Optional Device Delivery | Recovery Action |
| --- | --- | --- | --- |
| **Rate limited** | Show provider, failure reason, delivery time, and any server-provided retry time. | A local device alert may be posted only after the user has opted in. Future push delivery requires an authenticated device token and a server event. | Wait for the retry window, then use **Sync Now** when the secure sync backend is available. |
| **Token expired** | Show provider, failure reason, delivery time, and the connection state. | A local device alert may be posted only after the user has opted in. Future push delivery requires an authenticated device token and a server event. | Reconnect after server OAuth callback and token management are implemented. |

## Delivery Rules

The current MVP can persist and display in-app failure records. It may request permission and schedule a local device notification only when the user explicitly enables **Sync failure alerts**. It does not produce fake failure notifications: notification records must originate from a future verified server sync result or a test-only local hook outside production flows.

Remote push alerts require a production build, notification permission, an Android notification channel, a device or Expo push token, and server-side delivery infrastructure. Expo notes that remote push notifications are unavailable in Expo Go on Android from SDK 53, while local notifications remain available; this is why the MVP focuses on in-app records and opt-in local delivery.[1]

## References

[1]: https://docs.expo.dev/versions/latest/sdk/notifications/ "Expo Notifications"
