import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { connectorOperationLabel, getConnector, getConnectorAction, type ConnectorApprovalRequest } from "@/shared/connectors";
import { riskLevelLabel } from "@/shared/assistant";

type ConnectorApprovalSheetProps = {
  request?: ConnectorApprovalRequest;
  visible: boolean;
  onDismiss: () => void;
  onRecordApproval: (request: ConnectorApprovalRequest) => void;
};

export function ConnectorApprovalSheet({ request, visible, onDismiss, onRecordApproval }: ConnectorApprovalSheetProps) {
  const colors = useColors();
  const providerId = request?.providerId ?? "github";
  const { data: preflight } = trpc.connectors.preflight.useQuery(
    { providerId },
    { enabled: visible && Boolean(request), staleTime: 30_000 },
  );
  if (!request) return null;

  const connector = getConnector(request.providerId);
  const action = getConnectorAction(request.providerId, request.actionId);

  const handleApproval = () => {
    onRecordApproval(request);
    onDismiss();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close connector approval" onPress={onDismiss} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.handleRow}><View style={[styles.handle, { backgroundColor: colors.border }]} /></View>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={[styles.eyebrow, { color: colors.muted }]}>EXTERNAL INTEGRATION</Text>
              <Text style={[styles.title, { color: colors.text }]}>{connector.title}</Text>
            </View>
            <Pressable accessibilityLabel="Close connector approval" onPress={onDismiss} style={({ pressed }) => [styles.closeButton, { borderColor: colors.border }, pressed && styles.pressed]}>
              <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: `${colors.warning}16` }]}><Text style={[styles.tagText, { color: colors.warning }]}>{connectorOperationLabel(action.operation)}</Text></View>
              <View style={[styles.tag, { backgroundColor: `${colors.warning}16` }]}><Text style={[styles.tagText, { color: colors.warning }]}>{riskLevelLabel(action.riskLevel)}</Text></View>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.panelLabel, { color: colors.muted }]}>PROPOSED ACTION</Text>
              <Text style={[styles.panelTitle, { color: colors.text }]}>{action.label}</Text>
              <Text style={[styles.panelBody, { color: colors.muted }]}>{action.description}</Text>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.panelLabel, { color: colors.muted }]}>SCOPE BOUNDARY</Text>
              <Text style={[styles.panelBody, { color: colors.text }]}>{action.requiredScopeLabel}</Text>
              <Text style={[styles.subtle, { color: colors.muted }]}>{connector.scopeSummary}</Text>
            </View>

            <View style={[styles.notice, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}55` }]}>
              <Text style={[styles.noticeTitle, { color: colors.warning }]}>{preflight?.state === "DISCONNECTED" ? "OAuth hardening still required" : "OAuth configuration still required"}</Text>
              <Text style={[styles.noticeBody, { color: colors.text }]}>{preflight?.message ?? connector.oauthRequirement}</Text>
              <Text style={[styles.noticeBody, { color: colors.muted }]}>Recording approval does not open a provider page, grant a scope, store a token, or execute an external action.</Text>
            </View>

            <Pressable accessibilityLabel="Record approval without executing an external action" onPress={handleApproval} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.tint }, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Record approval</Text>
            </Pressable>
            <Text style={[styles.footerNote, { color: colors.muted }]}>One-time local approval for this proposed action only.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(5, 14, 19, 0.42)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, maxHeight: "84%" },
  handleRow: { alignItems: "center", paddingBottom: 4, paddingTop: 10 },
  handle: { borderRadius: 3, height: 4, width: 42 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 16, justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 16 },
  titleBlock: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  title: { fontSize: 23, fontWeight: "800", lineHeight: 29 },
  closeButton: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  closeText: { fontSize: 13, fontWeight: "700" },
  content: { gap: 14, paddingBottom: 34, paddingHorizontal: 22 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { fontSize: 11, fontWeight: "800" },
  panel: { borderRadius: 18, borderWidth: 1, gap: 7, padding: 15 },
  panelLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  panelBody: { fontSize: 14, lineHeight: 20 },
  subtle: { fontSize: 12, lineHeight: 18 },
  notice: { borderRadius: 18, borderWidth: 1, gap: 6, padding: 14 },
  noticeTitle: { fontSize: 14, fontWeight: "800" },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  primaryButton: { alignItems: "center", borderRadius: 16, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  footerNote: { fontSize: 11, lineHeight: 16, textAlign: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
