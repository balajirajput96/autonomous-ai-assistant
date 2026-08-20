import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAssistant } from "@/lib/assistant-context";
import { riskLevelLabel, taskStateLabel, type AssistantTask, type TaskState } from "@/shared/assistant";

const ACTIVITY_FILTERS = ["ALL", "ACTIVE", "ATTENTION", "DONE"] as const;
type ActivityFilter = (typeof ACTIVITY_FILTERS)[number];

function activityFilterLabel(filter: ActivityFilter): string {
  return { ALL: "All", ACTIVE: "Active", ATTENTION: "Attention", DONE: "Done" }[filter];
}

function matchesActivityFilter(task: AssistantTask, filter: ActivityFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "ACTIVE") return ["QUEUED", "PLANNING", "RUNNING", "RETRYING"].includes(task.state);
  if (filter === "ATTENTION") return ["WAITING", "BLOCKED", "FAILED"].includes(task.state);
  return ["COMPLETED", "CANCELLED"].includes(task.state);
}

function stateColor(state: TaskState, colors: ReturnType<typeof useColors>): string {
  if (state === "COMPLETED") return colors.success;
  if (["FAILED", "BLOCKED", "CANCELLED"].includes(state)) return colors.error;
  if (["WAITING", "RETRYING"].includes(state)) return colors.warning;
  return colors.tint;
}

export default function ActivityScreen() {
  const colors = useColors();
  const { tasks } = useAssistant();
  const [selectedTask, setSelectedTask] = useState<AssistantTask>();
  const [filter, setFilter] = useState<ActivityFilter>("ALL");
  const filteredTasks = useMemo(() => tasks.filter((task) => matchesActivityFilter(task, filter)), [filter, tasks]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>TASK RECORD</Text>
        <Text style={[styles.title, { color: colors.text }]}>Activity</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Every task has a visible state, risk label, and local trace.</Text>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={[styles.listContent, filteredTasks.length === 0 && styles.emptyContent]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {ACTIVITY_FILTERS.map((activityFilter) => {
              const selected = filter === activityFilter;
              const count = tasks.filter((task) => matchesActivityFilter(task, activityFilter)).length;
              return <Pressable key={activityFilter} accessibilityLabel={`Show ${activityFilterLabel(activityFilter)} tasks`} onPress={() => setFilter(activityFilter)} style={({ pressed }) => [styles.filterButton, selected && { backgroundColor: colors.tint }, pressed && styles.pressed]}><Text style={[styles.filterText, { color: selected ? "#FFFFFF" : colors.muted }]}>{activityFilterLabel(activityFilter)}{count > 0 ? ` ${count}` : ""}</Text></Pressable>;
            })}
          </View>
        }
        renderItem={({ item }) => {
          const color = stateColor(item.state, colors);
          return (
            <Pressable
              accessibilityLabel={`Open task ${item.title}`}
              onPress={() => setSelectedTask(item)}
              style={({ pressed }) => [styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
            >
              <View style={styles.taskTopRow}>
                <View style={[styles.stateMark, { backgroundColor: `${color}1A` }]}><View style={[styles.stateDot, { backgroundColor: color }]} /></View>
                <Text style={[styles.timestamp, { color: colors.muted }]}>{new Date(item.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
              </View>
              <Text numberOfLines={2} style={[styles.taskTitle, { color: colors.text }]}>{item.title}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: `${color}16` }]}><Text style={[styles.tagText, { color }]}>{taskStateLabel(item.state)}</Text></View>
                <View style={[styles.tag, { backgroundColor: `${colors.warning}16` }]}><Text style={[styles.tagText, { color: colors.warning }]}>{riskLevelLabel(item.riskLevel)}</Text></View>
              </View>
              {item.approvalRequired ? <Text style={[styles.approval, { color: colors.warning }]}>Paused for explicit approval</Text> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{tasks.length === 0 ? "No tasks yet" : `No ${activityFilterLabel(filter).toLowerCase()} tasks`}</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>{tasks.length === 0 ? "Start a conversation to create your first visible task record." : "Try a different filter to review the rest of your local task history."}</Text>
          </View>
        }
      />
      <TaskDetailSheet task={selectedTask} visible={Boolean(selectedTask)} onDismiss={() => setSelectedTask(undefined)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { gap: 5, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.05 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.75, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 20, maxWidth: 320 },
  listContent: { gap: 11, paddingHorizontal: 20, paddingBottom: 24 },
  emptyContent: { flexGrow: 1, justifyContent: "center", paddingBottom: 120 },
  filterBar: { alignSelf: "flex-start", borderRadius: 12, borderWidth: 1, flexDirection: "row", marginBottom: 2, padding: 3 },
  filterButton: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  filterText: { fontSize: 10, fontWeight: "800" },
  taskCard: { borderRadius: 19, borderWidth: 1, gap: 10, padding: 15 },
  taskTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  stateMark: { alignItems: "center", borderRadius: 99, height: 27, justifyContent: "center", width: 27 },
  stateDot: { borderRadius: 99, height: 8, width: 8 },
  timestamp: { fontSize: 11, fontWeight: "600" },
  taskTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tag: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { fontSize: 10, fontWeight: "800" },
  approval: { fontSize: 12, fontWeight: "700" },
  emptyCard: { alignSelf: "center", borderRadius: 20, borderWidth: 1, gap: 7, maxWidth: 320, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
