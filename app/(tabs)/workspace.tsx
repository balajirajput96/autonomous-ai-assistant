import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAssistant } from "@/lib/assistant-context";
import { CAPABILITY_STATUSES, type CapabilityState } from "@/shared/assistant";

function capabilityColor(state: CapabilityState, colors: ReturnType<typeof useColors>): string {
  if (state === "AVAILABLE") return colors.success;
  if (state === "CONFIGURATION_REQUIRED") return colors.warning;
  return colors.muted;
}

export default function WorkspaceScreen() {
  const colors = useColors();
  const { clearLocalWorkspace, messages, tasks } = useAssistant();

  const confirmClear = () => {
    Alert.alert(
      "Clear local workspace?",
      "This clears local conversation messages and task records from this device. This action cannot be undone.",
      [
        { text: "Keep workspace", style: "cancel" },
        { text: "Clear local data", style: "destructive", onPress: clearLocalWorkspace },
      ],
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>YOUR WORKSPACE</Text>
          <Text style={[styles.title, { color: colors.text }]}>Memory & tools</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Review what is held locally and what needs a verified service before it can run.</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryItem}><Text style={[styles.summaryNumber, { color: colors.text }]}>{Math.max(messages.length - 1, 0)}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>messages</Text></View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}><Text style={[styles.summaryNumber, { color: colors.text }]}>{tasks.length}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>task records</Text></View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}><Text style={[styles.summaryNumber, { color: colors.success }]}>Local</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>storage mode</Text></View>
        </View>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>Capability status</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>No fake connections</Text></View>
        <View style={styles.capabilityList}>
          {CAPABILITY_STATUSES.map((capability) => {
            const color = capabilityColor(capability.state, colors);
            return (
              <View key={capability.id} style={[styles.capabilityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.capabilityTop}><Text style={[styles.capabilityTitle, { color: colors.text }]}>{capability.title}</Text><View style={[styles.statusTag, { backgroundColor: `${color}18` }]}><Text style={[styles.statusText, { color }]}>{capability.state.replaceAll("_", " ")}</Text></View></View>
                <Text style={[styles.capabilityDescription, { color: colors.muted }]}>{capability.description}</Text>
                {capability.requirement ? <Text style={[styles.requirement, { color }]}>Requires: {capability.requirement}</Text> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>Data controls</Text></View>
        <View style={[styles.dataCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dataCopy}><Text style={[styles.dataTitle, { color: colors.text }]}>Clear local workspace</Text><Text style={[styles.dataDescription, { color: colors.muted }]}>Remove locally stored conversation messages and task records from this device.</Text></View>
          <Pressable accessibilityLabel="Clear local workspace" onPress={confirmClear} style={({ pressed }) => [styles.clearButton, { borderColor: colors.error }, pressed && styles.pressed]}><Text style={[styles.clearText, { color: colors.error }]}>Clear</Text></Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  header: { gap: 5 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.05 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.75, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 20, maxWidth: 340 },
  summaryCard: { alignItems: "center", borderRadius: 20, borderWidth: 1, flexDirection: "row", justifyContent: "space-around", paddingVertical: 15 },
  summaryItem: { alignItems: "center", flex: 1, gap: 2 },
  summaryNumber: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "700" },
  summaryDivider: { height: 28, width: StyleSheet.hairlineWidth },
  sectionHeader: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionHint: { fontSize: 11, fontWeight: "600" },
  capabilityList: { gap: 10 },
  capabilityCard: { borderRadius: 18, borderWidth: 1, gap: 8, padding: 14 },
  capabilityTop: { alignItems: "flex-start", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  capabilityTitle: { flex: 1, fontSize: 15, fontWeight: "700", lineHeight: 20 },
  statusTag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: "800" },
  capabilityDescription: { fontSize: 13, lineHeight: 19 },
  requirement: { fontSize: 11, fontWeight: "700", lineHeight: 16 },
  dataCard: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  dataCopy: { flex: 1, gap: 4 },
  dataTitle: { fontSize: 15, fontWeight: "700" },
  dataDescription: { fontSize: 12, lineHeight: 18 },
  clearButton: { borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  clearText: { fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
