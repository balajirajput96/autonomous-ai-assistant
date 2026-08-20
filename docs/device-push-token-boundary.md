# Device Push-Token Registration Boundary

## Lifecycle

Device push-token registration is opt-in. When the user enables sync-failure alerts, the app may create the Android notification channel, request notification permission, obtain a device or Expo push token on a physical device, and retain a redacted local registration status. A token is not an OAuth credential, but it is an identifier capable of delivering notifications and must not be logged or displayed in full.

| Stage | Mobile App Responsibility | Server Prerequisite |
| --- | --- | --- |
| **Permission** | Ask only after the user enables sync-failure alerts; respect denial without blocking in-app alerts. | None. |
| **Token acquisition** | Request a push token only on a physical device after permission is granted; expose success, unavailable, or error status without rendering the raw token. | Valid production notification project configuration. |
| **Token rotation** | Detect a changed token while the app is running and mark the local registration pending. | Authenticated upsert endpoint keyed to user, device installation, and token. |
| **Server registration** | Do not send the token from the current MVP. Surface that background delivery remains pending. | Authenticated ownership, encrypted storage, token association, deletion on opt-out, delivery audit events, and remote push credentials. |
| **Opt-out** | Disable new local device delivery and clear locally retained registration state. | Delete or deactivate the server token registration once a backend exists. |

## Implementation Limit

The application will obtain an Expo push token when its native configuration supplies a project identifier and the user grants permission. It will retain only a redacted token fingerprint and registration status in local application state. The token’s full value will not be persisted in local storage, emitted to logs, or sent to this project’s server until an authenticated registration endpoint and deletion path are available.

Expo notes that token acquisition can fail when a device is offline and that applications should handle errors and retry later; the device-token registration UI therefore distinguishes unavailable registration from a completed token registration. [1]

## References

[1]: https://docs.expo.dev/versions/latest/sdk/notifications/ "Expo Notifications"
