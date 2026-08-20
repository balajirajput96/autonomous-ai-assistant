# OAuth Sync Status Boundary

## Sync Metadata

An active OAuth record may expose `lastSyncedAt`, `lastSyncStatus`, and `lastSyncError` only after a server-side provider request has completed. **Last Synced** means the time at which that verified server-side sync finished; it is not the time when a user opened Settings, tapped a button, or renewed a local approval record.

| Record State | Sync Display | Manual Control |
| --- | --- | --- |
| **Configuration required**, **Disconnected**, **Local approval recorded**, or **Revoked** | “No active connection to sync.” | Do not display **Sync Now**. |
| **Active** with no completed sync | “Not synced yet.” | Show **Sync Now**. The control must disclose whether backend refresh is available. |
| **Active** with completed sync | Display a formatted `Last Synced` timestamp. | Show **Sync Now**. |
| **Expired** | “Reconnection required before sync.” | Do not trigger provider refresh. |

## Manual Sync Rule

In production, **Sync Now** requires an authenticated account, an ownership check, a usable encrypted token reference, provider-specific rate and scope validation, a server-side provider request, and an auditable completion result. The client may update `lastSyncedAt` only from that result. In the current MVP, the control is rendered only for a future active record and explains that the secure backend refresh service is not configured; it does not send a provider request or fabricate a timestamp.
