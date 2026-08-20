import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAssistant } from "@/lib/assistant-context";
import { sendLocalTestNotification } from "@/lib/sync-failure-notifications";
import { CONNECTOR_CATALOG, connectorStateDescription, connectorStateLabel, connectorSyncStateLabel, type ConnectorProviderId, type ConnectorState } from "@/shared/connectors";
import { syncFailureKindLabel } from "@/shared/sync-failure-alerts";
import { localTestNotificationResultMessage } from "@/shared/test-notification";

function connectorColor(state: ConnectorState, colors: ReturnType<typeof useColors>): string {
  if (state === "CONNECTED") return colors.success;
  if (state === "APPROVAL_RECORDED") return colors.tint;
  if (state === "CONFIGURATION_REQUIRED" || state === "EXPIRED") return colors.warning;
  if (state === "REVOKED") return colors.muted;
  return colors.muted;
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function SettingsScreen() {
  const colors = useColors();
  const { connectorRecords, markSyncFailureAlertRead, preferences, pushTokenRegistration, registerDevicePushToken, removeConnectorApproval, setSyncFailureAlertsEnabled, syncFailureAlerts, updatePreferences } = useAssistant();
  const unreadSyncFailureCount = syncFailureAlerts.filter((syncAlert) => !syncAlert.readAt).length;

  const confirmRemoveApproval = (providerId: ConnectorProviderId, title: string) => {
    Alert.alert(
      "Remove local approval?",
      `This removes the local ${title} review record from this device. It does not contact ${title}, revoke provider access, or affect any external account.`,
      [
        { text: "Keep record", style: "cancel" },
        { text: "Remove approval", style: "destructive", onPress: () => removeConnectorApproval(providerId) },
      ],
    );
  };

  const explainRevokeBoundary = (title: string) => {
    Alert.alert(
      "Server revocation required",
      `${title} is not connected in this build. A production revocation requires a verified server-side token record, an ownership check, and a provider revocation transaction. No local control will claim to revoke an OAuth connection before that flow exists.`,
      [{ text: "Understood" }],
    );
  };

  const explainSyncBoundary = (title: string) => {
    Alert.alert(
      "Secure sync backend required",
      `${title} cannot be refreshed from this build because no verified provider token or server-side sync service is configured. Last Synced will update only after a secure backend refresh succeeds.`,
      [{ text: "Understood" }],
    );
  };

  const updateSyncFailureAlerts = (enabled: boolean) => {
    void setSyncFailureAlertsEnabled(enabled).then((granted) => {
      if (enabled && !granted) {
        Alert.alert(
          "Alert permission not enabled",
          "You can still review sync issues in this screen. To receive device alerts, allow notifications for Autonomous in your device settings.",
          [{ text: "Understood" }],
        );
      }
    });
  };

  const registerThisDevice = () => {
    void registerDevicePushToken().then((registration) => {
      if (registration.state === "PENDING_SERVER_REGISTRATION") {
        Alert.alert("Device token registered", "This device is ready for future background delivery. A secure server registration endpoint is still required before remote notifications can be sent.", [{ text: "Understood" }]);
      } else if (registration.state !== "REGISTERING") {
        Alert.alert("Device registration unavailable", registration.detail ?? "This device could not be registered for background delivery.", [{ text: "Understood" }]);
      }
    });
  };

  const sendTestNotification = () => {
    void sendLocalTestNotification().then((result) => {
      Alert.alert(result === "SENT" ? "Test notification sent" : "Test notification unavailable", localTestNotificationResultMessage(result), [{ text: "Understood" }]);
    });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>CONTROL CENTER</Text>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Manage assistant preferences, local data, and connection boundaries in one place.</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>CONNECTIONS</Text>
        <View style={[styles.connectionNotice, { backgroundColor: `${colors.tint}10`, borderColor: `${colors.tint}55` }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>Connection status is explicit</Text>
          <Text style={[styles.noticeBody, { color: colors.muted }]}>A local approval is not an OAuth grant. Active connections can be revoked only after a verified server-side revocation flow is available.</Text>
        </View>

        <View style={styles.connectionList}>
          {CONNECTOR_CATALOG.map((connector) => {
            const record = connectorRecords.find((item) => item.providerId === connector.id);
            const state = record?.state ?? connector.defaultState;
            const color = connectorColor(state, colors);
            const connectedDate = formatDate(record?.connectedAt);
            const expiryDate = formatDate(record?.expiresAt);
            const lastSyncedDate = formatDate(record?.lastSyncedAt);
            const syncStatus = record?.lastSyncStatus ?? "IDLE";
            const isLocalApproval = state === "APPROVAL_RECORDED";
            const canRequestRevocation = state === "CONNECTED" || state === "EXPIRED";
            const canRequestSync = state === "CONNECTED";

            return (
              <View key={connector.id} style={[styles.connectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.connectionHeader}>
                  <View style={styles.connectionTitleRow}>
                    <View style={[styles.connectorMark, { backgroundColor: `${color}18` }]}><Text style={[styles.connectorMarkText, { color }]}>{connector.shortLabel}</Text></View>
                    <View style={styles.connectionTitleCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{connector.title}</Text><Text style={[styles.providerType, { color: colors.muted }]}>OAuth integration</Text></View>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: `${color}18` }]}><Text style={[styles.statusText, { color }]}>{connectorStateLabel(state)}</Text></View>
                </View>

                <Text style={[styles.rowDescription, { color: colors.muted }]}>{connectorStateDescription(state)}</Text>
                <View style={[styles.connectionRule, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.muted }]}>Account</Text><Text style={[styles.detailValue, { color: colors.text }]}>{record?.accountLabel ?? "No provider account connected"}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.muted }]}>Access</Text><Text style={[styles.detailValue, { color: colors.text }]}>{record?.scopeLabels?.join(", ") ?? connector.scopeSummary}</Text></View>
                {connectedDate ? <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.muted }]}>Connected</Text><Text style={[styles.detailValue, { color: colors.text }]}>{connectedDate}</Text></View> : null}
                {expiryDate ? <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.muted }]}>Expiry</Text><Text style={[styles.detailValue, { color: colors.warning }]}>{expiryDate}</Text></View> : null}

                {canRequestSync ? (
                  <View style={[styles.syncPanel, { backgroundColor: `${colors.tint}0D`, borderColor: `${colors.tint}45` }]}>
                    <View style={styles.syncCopy}>
                      <Text style={[styles.syncLabel, { color: colors.muted }]}>LAST SYNCED</Text>
                      <Text style={[styles.syncValue, { color: colors.text }]}>{lastSyncedDate ?? "Not synced yet"}</Text>
                      <Text style={[styles.syncStatus, { color: colors.muted }]}>{connectorSyncStateLabel(syncStatus)}</Text>
                      {record?.lastSyncError ? <Text style={[styles.syncError, { color: colors.error }]}>{record.lastSyncError}</Text> : null}
                    </View>
                    <Pressable accessibilityLabel={`Sync ${connector.title} now`} onPress={() => explainSyncBoundary(connector.title)} style={({ pressed }) => [styles.syncButton, { backgroundColor: colors.tint }, pressed && styles.pressed]}><Text style={styles.syncButtonText}>Sync Now</Text></Pressable>
                  </View>
                ) : null}

                {isLocalApproval ? (
                  <Pressable accessibilityLabel={`Remove local ${connector.title} approval`} onPress={() => confirmRemoveApproval(connector.id, connector.title)} style={({ pressed }) => [styles.destructiveButton, { borderColor: colors.error }, pressed && styles.pressed]}><Text style={[styles.destructiveButtonText, { color: colors.error }]}>Remove local approval</Text></Pressable>
                ) : null}
                {canRequestRevocation ? (
                  <Pressable accessibilityLabel={`Revoke ${connector.title} connection`} onPress={() => explainRevokeBoundary(connector.title)} style={({ pressed }) => [styles.destructiveButton, { borderColor: colors.error }, pressed && styles.pressed]}><Text style={[styles.destructiveButtonText, { color: colors.error }]}>Revoke connection</Text></Pressable>
                ) : null}
                {state === "CONFIGURATION_REQUIRED" ? <Text style={[styles.configurationHint, { color: colors.warning }]}>Connection setup remains server-side and unavailable in this build.</Text> : null}
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SYNC FAILURE ALERTS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Sync failure alerts</Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>Receive an optional device alert if a verified connection hits a rate limit or needs reconnection.</Text>
            </View>
            <Switch value={preferences.syncFailureAlerts} onValueChange={updateSyncFailureAlerts} trackColor={{ false: colors.border, true: `${colors.tint}80` }} thumbColor={preferences.syncFailureAlerts ? colors.tint : colors.background} />
          </View>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <View style={styles.deviceRegistrationRow}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Background delivery device</Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>{pushTokenRegistration.detail ?? "Register this physical device to prepare it for future background alerts."}</Text>
              <Text style={[styles.deviceRegistrationStatus, { color: pushTokenRegistration.state === "PENDING_SERVER_REGISTRATION" ? colors.success : pushTokenRegistration.state === "ERROR" || pushTokenRegistration.state === "PERMISSION_DENIED" ? colors.error : colors.muted }]}>{pushTokenRegistration.state.replaceAll("_", " ")}</Text>
            </View>
            <Pressable accessibilityLabel="Register this device for background sync-failure notifications" onPress={registerThisDevice} style={({ pressed }) => [styles.registerDeviceButton, { backgroundColor: preferences.syncFailureAlerts ? colors.tint : colors.border }, pressed && preferences.syncFailureAlerts && styles.pressed]}><Text style={styles.registerDeviceText}>Register device</Text></Pressable>
          </View>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <View style={styles.testNotificationRow}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Verify local delivery</Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>Sends one immediate alert through this device’s sync-failure channel. It does not use your push token or contact a server.</Text>
            </View>
            <Pressable accessibilityLabel="Send a local test notification" onPress={sendTestNotification} style={({ pressed }) => [styles.testNotificationButton, { borderColor: preferences.syncFailureAlerts ? colors.tint : colors.border }, pressed && preferences.syncFailureAlerts && styles.pressed]}><Text style={[styles.testNotificationText, { color: preferences.syncFailureAlerts ? colors.tint : colors.muted }]}>Send test</Text></Pressable>
          </View>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          {syncFailureAlerts.length === 0 ? (
            <View style={styles.alertEmptyState}>
              <Text style={[styles.alertEmptyTitle, { color: colors.text }]}>No sync issues recorded</Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>Rate-limit and expired-token failures will appear here only after a verified server-side sync reports them.</Text>
            </View>
          ) : (
            <View style={styles.alertList}>
              <Text style={[styles.alertSummary, { color: colors.muted }]}>{unreadSyncFailureCount > 0 ? `${unreadSyncFailureCount} unread connection alert${unreadSyncFailureCount === 1 ? "" : "s"}` : "All connection alerts reviewed"}</Text>
              {syncFailureAlerts.map((syncAlert) => {
                const isRateLimit = syncAlert.kind === "RATE_LIMIT";
                const alertColor = isRateLimit ? colors.warning : colors.error;
                return (
                  <View key={syncAlert.id} style={[styles.syncAlertCard, { backgroundColor: `${alertColor}0D`, borderColor: `${alertColor}55` }]}>
                    <View style={styles.syncAlertHeader}>
                      <View style={styles.syncAlertTitleCopy}>
                        <Text style={[styles.syncAlertTitle, { color: colors.text }]}>{syncAlert.title}</Text>
                        <Text style={[styles.syncAlertKind, { color: alertColor }]}>{syncFailureKindLabel(syncAlert.kind)}</Text>
                      </View>
                      {!syncAlert.readAt ? <View style={[styles.unreadDot, { backgroundColor: alertColor }]} /> : null}
                    </View>
                    <Text style={[styles.rowDescription, { color: colors.muted }]}>{syncAlert.message}</Text>
                    <Text style={[styles.syncAlertRecovery, { color: colors.text }]}>{syncAlert.recovery}</Text>
                    {syncAlert.retryAt ? <Text style={[styles.syncAlertRetry, { color: colors.warning }]}>Retry after {formatDateTime(syncAlert.retryAt)}</Text> : null}
                    <View style={styles.syncAlertFooter}>
                      <Text style={[styles.syncAlertTime, { color: colors.muted }]}>{formatDateTime(syncAlert.createdAt)}{syncAlert.deliveredLocally ? " · Device alert sent" : ""}</Text>
                      {!syncAlert.readAt ? <Pressable accessibilityLabel={`Mark ${syncAlert.title} as read`} onPress={() => markSyncFailureAlertRead(syncAlert.id)} style={({ pressed }) => [styles.markReadButton, { borderColor: colors.tint }, pressed && styles.pressed]}><Text style={[styles.markReadText, { color: colors.tint }]}>Mark read</Text></Pressable> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>ASSISTANT BEHAVIOUR</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>Default mode</Text><Text style={[styles.rowDescription, { color: colors.muted }]}>Agent mode plans more deliberately; sensitive actions remain paused.</Text></View>
          <View style={[styles.modeSegment, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {(["ASSISTED", "AGENT"] as const).map((mode) => {
              const selected = preferences.mode === mode;
              return <Pressable key={mode} onPress={() => updatePreferences({ mode })} style={({ pressed }) => [styles.modeButton, selected && { backgroundColor: colors.tint }, pressed && styles.pressed]}><Text style={[styles.modeText, { color: selected ? "#FFFFFF" : colors.muted }]}>{mode === "ASSISTED" ? "Assisted" : "Agent"}</Text></Pressable>;
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>Save task history</Text><Text style={[styles.rowDescription, { color: colors.muted }]}>Keep local records visible in Activity.</Text></View>
            <Switch value={preferences.saveTaskHistory} onValueChange={(saveTaskHistory) => updatePreferences({ saveTaskHistory })} trackColor={{ false: colors.border, true: `${colors.tint}80` }} thumbColor={preferences.saveTaskHistory ? colors.tint : colors.background} />
          </View>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <View style={styles.switchRow}>
            <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>Speech output</Text><Text style={[styles.rowDescription, { color: colors.muted }]}>Reserve this preference for when verified voice output is enabled.</Text></View>
            <Switch value={preferences.speechEnabled} onValueChange={(speechEnabled) => updatePreferences({ speechEnabled })} trackColor={{ false: colors.border, true: `${colors.tint}80` }} thumbColor={preferences.speechEnabled ? colors.tint : colors.background} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SECURITY & PRIVACY</Text>
        <View style={[styles.connectionNotice, { backgroundColor: `${colors.tint}10`, borderColor: `${colors.tint}55` }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>No credentials are stored in this app</Text>
          <Text style={[styles.noticeBody, { color: colors.muted }]}>Remote model, connector, and automation capabilities are enabled only through verified server-side configuration and a separate consent flow.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  header: { gap: 5, marginBottom: 5 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.05 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.75, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 20, maxWidth: 340 },
  sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.95, marginTop: 9 },
  card: { borderRadius: 18, borderWidth: 1, gap: 13, padding: 14 },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  rowDescription: { fontSize: 12, lineHeight: 18 },
  connectionNotice: { borderRadius: 17, borderWidth: 1, gap: 5, padding: 14 },
  noticeTitle: { fontSize: 14, fontWeight: "800" },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  connectionList: { gap: 10 },
  connectionCard: { borderRadius: 18, borderWidth: 1, gap: 10, padding: 14 },
  connectionHeader: { alignItems: "flex-start", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  connectionTitleRow: { alignItems: "center", flex: 1, flexDirection: "row", gap: 9 },
  connectorMark: { alignItems: "center", borderRadius: 9, height: 30, justifyContent: "center", width: 30 },
  connectorMarkText: { fontSize: 10, fontWeight: "800" },
  connectionTitleCopy: { flex: 1, gap: 1 },
  providerType: { fontSize: 11, fontWeight: "600" },
  statusTag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: "800" },
  connectionRule: { height: StyleSheet.hairlineWidth, width: "100%" },
  detailRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  detailLabel: { fontSize: 11, fontWeight: "700", width: 62 },
  detailValue: { flex: 1, fontSize: 11, fontWeight: "600", lineHeight: 16 },
  syncPanel: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, padding: 11 },
  syncCopy: { flex: 1, gap: 2 },
  syncLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  syncValue: { fontSize: 13, fontWeight: "800", lineHeight: 18 },
  syncStatus: { fontSize: 11, fontWeight: "600", lineHeight: 16 },
  syncError: { fontSize: 11, fontWeight: "700", lineHeight: 16 },
  syncButton: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  syncButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  destructiveButton: { alignSelf: "flex-start", borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  destructiveButtonText: { fontSize: 12, fontWeight: "800" },
  configurationHint: { fontSize: 11, fontWeight: "700", lineHeight: 16 },
  modeSegment: { alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, flexDirection: "row", padding: 2 },
  modeButton: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  modeText: { fontSize: 11, fontWeight: "800" },
  switchRow: { alignItems: "center", flexDirection: "row", gap: 14 },
  deviceRegistrationRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  deviceRegistrationStatus: { fontSize: 10, fontWeight: "800", marginTop: 3 },
  registerDeviceButton: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 },
  registerDeviceText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  testNotificationRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  testNotificationButton: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9 },
  testNotificationText: { fontSize: 11, fontWeight: "800" },
  rule: { height: StyleSheet.hairlineWidth, width: "100%" },
  alertEmptyState: { gap: 4 },
  alertEmptyTitle: { fontSize: 13, fontWeight: "800" },
  alertList: { gap: 10 },
  alertSummary: { fontSize: 11, fontWeight: "700" },
  syncAlertCard: { borderRadius: 14, borderWidth: 1, gap: 7, padding: 11 },
  syncAlertHeader: { alignItems: "flex-start", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  syncAlertTitleCopy: { flex: 1, gap: 2 },
  syncAlertTitle: { fontSize: 13, fontWeight: "800", lineHeight: 18 },
  syncAlertKind: { fontSize: 10, fontWeight: "800" },
  unreadDot: { borderRadius: 4, height: 8, marginTop: 4, width: 8 },
  syncAlertRecovery: { fontSize: 12, fontWeight: "700", lineHeight: 18 },
  syncAlertRetry: { fontSize: 11, fontWeight: "700", lineHeight: 16 },
  syncAlertFooter: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  syncAlertTime: { flex: 1, fontSize: 10, fontWeight: "600", lineHeight: 14 },
  markReadButton: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  markReadText: { fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
