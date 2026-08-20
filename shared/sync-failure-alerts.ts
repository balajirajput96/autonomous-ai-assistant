import { getConnector, type ConnectorProviderId } from "./connectors";

export const SYNC_FAILURE_KINDS = ["RATE_LIMIT", "EXPIRED_TOKEN"] as const;
export type SyncFailureKind = (typeof SYNC_FAILURE_KINDS)[number];

export type SyncFailureAlert = {
  id: string;
  providerId: ConnectorProviderId;
  kind: SyncFailureKind;
  title: string;
  message: string;
  recovery: string;
  createdAt: string;
  readAt?: string;
  retryAt?: string;
  deliveredLocally?: boolean;
};

export function createSyncFailureAlert(providerId: ConnectorProviderId, kind: SyncFailureKind, retryAt?: string): SyncFailureAlert {
  const connector = getConnector(providerId);
  const createdAt = new Date().toISOString();
  const isRateLimited = kind === "RATE_LIMIT";

  return {
    id: `sync-alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    providerId,
    kind,
    title: isRateLimited ? `${connector.title} sync delayed` : `${connector.title} needs reconnection`,
    message: isRateLimited
      ? "The provider temporarily limited this connection’s sync request."
      : "The provider rejected this sync because the connection credentials have expired.",
    recovery: isRateLimited
      ? "Wait for the provider retry window, then use Sync Now after the secure sync backend is available."
      : "Reconnect this provider after the verified OAuth callback and token-management flow are available.",
    createdAt,
    retryAt,
  };
}

export function syncFailureKindLabel(kind: SyncFailureKind): string {
  return kind === "RATE_LIMIT" ? "Rate limit" : "Token expired";
}
