import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAssistant } from "@/lib/assistant-context";

export default function SettingsScreen() {
  const colors = useColors();
  const { preferences, updatePreferences } = useAssistant();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>CONTROL CENTER</Text>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Keep assistant behaviour, speech, and local data handling understandable.</Text>
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
        <View style={[styles.notice, { backgroundColor: `${colors.tint}10`, borderColor: `${colors.tint}55` }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>No credentials are stored in this app</Text>
          <Text style={[styles.noticeBody, { color: colors.muted }]}>Remote model, connector, and automation capabilities will be enabled only through a verified server-side configuration with its own consent flow.</Text>
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
  modeSegment: { alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, flexDirection: "row", padding: 2 },
  modeButton: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  modeText: { fontSize: 11, fontWeight: "800" },
  switchRow: { alignItems: "center", flexDirection: "row", gap: 14 },
  rule: { height: StyleSheet.hairlineWidth, width: "100%" },
  notice: { borderRadius: 17, borderWidth: 1, gap: 5, padding: 14 },
  noticeTitle: { fontSize: 14, fontWeight: "800" },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
