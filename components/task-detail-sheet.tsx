import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { riskLevelLabel, taskStateLabel, type AssistantTask, type TaskState } from "@/shared/assistant";

type TaskDetailSheetProps = {
  task?: AssistantTask;
  visible: boolean;
  onDismiss: () => void;
};

function stateColor(state: TaskState, colors: ReturnType<typeof useColors>): string {
  if (state === "COMPLETED") return colors.success;
  if (state === "FAILED" || state === "CANCELLED" || state === "BLOCKED") return colors.error;
  if (state === "WAITING" || state === "RETRYING") return colors.warning;
  return colors.tint;
}

export function TaskDetailSheet({ task, visible, onDismiss }: TaskDetailSheetProps) {
  const colors = useColors();
  if (!task) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close task details" style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View accessibilityViewIsModal accessible={false} style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text accessibilityRole="header" style={[styles.eyebrow, { color: colors.muted }]}>TASK DETAIL</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {task.title}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close task details"
              accessibilityRole="button"
              accessibilityHint="Dismisses this task trace and returns to the previous screen."
              onPress={onDismiss}
              style={({ pressed }) => [styles.closeButton, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${stateColor(task.state, colors)}18` }]}>
                <Text style={[styles.badgeText, { color: stateColor(task.state, colors) }]}>{taskStateLabel(task.state)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.warning}18` }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>{riskLevelLabel(task.riskLevel)}</Text>
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.panelLabel, { color: colors.muted }]}>REQUEST</Text>
              <Text style={[styles.body, { color: colors.text }]}>{task.prompt}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Execution trace</Text>
            <View style={styles.stepList}>
              {task.steps.map((step) => (
                <View key={step.id} accessible accessibilityLabel={`${step.label}. ${taskStateLabel(step.state)}. ${step.detail ?? "No additional detail."}`} style={styles.stepRow}>
                  <View style={[styles.stepDot, { backgroundColor: stateColor(step.state, colors) }]} />
                  <View style={styles.stepText}>
                    <Text style={[styles.stepLabel, { color: colors.text }]}>{step.label}</Text>
                    <Text style={[styles.stepDetail, { color: colors.muted }]}>
                      {step.detail ?? taskStateLabel(step.state)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {task.approvalRequired ? (
              <View accessible accessibilityLiveRegion="polite" accessibilityLabel="Approval required. This task is paused. No external or consequential action has been performed." style={[styles.notice, { backgroundColor: `${colors.warning}14`, borderColor: `${colors.warning}50` }]}>
                <Text style={[styles.noticeTitle, { color: colors.warning }]}>Approval required</Text>
                <Text style={[styles.noticeBody, { color: colors.text }]}>This task is paused. No external or consequential action has been performed.</Text>
              </View>
            ) : null}

            {task.output ? (
              <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.panelLabel, { color: colors.muted }]}>RESULT</Text>
                <Text style={[styles.body, { color: colors.text }]}>{task.output}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(5, 14, 19, 0.42)", justifyContent: "flex-end" },
  sheet: { maxHeight: "83%", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0 },
  handleRow: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 42, height: 4, borderRadius: 2 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 16, justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 16 },
  headerText: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { fontSize: 21, fontWeight: "700", lineHeight: 28 },
  closeButton: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  closeText: { fontSize: 13, fontWeight: "700" },
  content: { gap: 16, paddingHorizontal: 22, paddingBottom: 34 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  panel: { borderRadius: 18, borderWidth: 1, gap: 7, padding: 15 },
  panelLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  body: { fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 2 },
  stepList: { gap: 14 },
  stepRow: { flexDirection: "row", gap: 11 },
  stepDot: { borderRadius: 99, height: 9, marginTop: 6, width: 9 },
  stepText: { flex: 1, gap: 2 },
  stepLabel: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  stepDetail: { fontSize: 13, lineHeight: 18 },
  notice: { borderRadius: 16, borderWidth: 1, gap: 5, padding: 14 },
  noticeTitle: { fontSize: 14, fontWeight: "700" },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
});
