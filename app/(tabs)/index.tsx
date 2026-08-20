import { useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Speech from "expo-speech";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { useAssistant } from "@/lib/assistant-context";
import { useColors } from "@/hooks/use-colors";
import { taskStateLabel, type AssistantTask, type ChatMessage } from "@/shared/assistant";

/**
 * Home Screen - NativeWind Example
 *
 * This template uses NativeWind (Tailwind CSS for React Native).
 * You can use familiar Tailwind classes directly in className props.
 *
 * Key patterns:
 * - Use `className` instead of `style` for most styling
 * - Theme colors: use tokens directly (bg-background, text-foreground, bg-primary, etc.); no dark: prefix needed
 * - Responsive: standard Tailwind breakpoints work on web
 * - Custom colors defined in tailwind.config.js
 */
export default function HomeScreen() {
  const colors = useColors();
  const { isReady, messages, preferences, setMode, submitPrompt, tasks } = useAssistant();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [prompt, setPrompt] = useState("");
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [queuedAttachment, setQueuedAttachment] = useState<{ name: string; size?: number; mimeType?: string }>();

  const activeTask = useMemo(
    () => tasks.find((task) => !["COMPLETED", "FAILED", "CANCELLED"].includes(task.state)) ?? tasks[0],
    [tasks],
  );
  const isTaskRunning = activeTask && !["COMPLETED", "FAILED", "CANCELLED", "WAITING"].includes(activeTask.state);

  const handleSubmit = () => {
    if (!prompt.trim() || isTaskRunning) return;
    if (queuedAttachment) {
      Alert.alert(
        "Attachment queued locally",
        `${queuedAttachment.name} remains on this device. Secure upload and document analysis are not enabled yet, so the remote assistant will receive only your typed request.`,
      );
      setQueuedAttachment(undefined);
    }
    submitPrompt(prompt);
    setPrompt("");
  };

  const chooseAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/markdown", "text/csv", "application/json", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setQueuedAttachment({ name: asset.name, size: asset.size, mimeType: asset.mimeType });
    } catch {
      Alert.alert("Unable to select attachment", "The document picker could not open. You can continue with a typed request.");
    }
  };

  const toggleVoiceCapture = async () => {
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
        const captured = audioRecorder.uri;
        Alert.alert(
          "Voice note captured",
          captured
            ? "The recording remains on this device for this session. Secure upload and transcription are the next planned step."
            : "The recording stopped, but no audio file was available. You can continue with typed input.",
        );
        return;
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone permission needed", "Allow microphone access if you want to capture a voice note. Typed input remains available.");
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch {
      Alert.alert("Voice capture unavailable", "A voice recording could not start. You can continue with typed input.");
    }
  };

  const speakResponse = async (content: string) => {
    const alreadySpeaking = await Speech.isSpeakingAsync();
    if (alreadySpeaking) {
      await Speech.stop();
      return;
    }
    Speech.speak(content, { rate: 0.95 });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        {!isUser ? <View style={[styles.messageAvatar, { backgroundColor: colors.tint }]}><Text style={styles.avatarText}>A</Text></View> : null}
        <View style={[styles.messageBubble, isUser ? [styles.userBubble, { backgroundColor: colors.tint }] : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }]]}>
          <Text style={[styles.messageText, { color: isUser ? "#FFFFFF" : colors.text }]}>{item.content}</Text>
          {!isUser && preferences.speechEnabled ? (
            <Pressable accessibilityLabel="Read this response aloud" onPress={() => void speakResponse(item.content)} style={({ pressed }) => [styles.listenButton, { borderColor: colors.border }, pressed && styles.pressed]}>
              <Text style={[styles.listenText, { color: colors.muted }]}>Listen</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={[styles.header, { borderColor: colors.border }]}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: colors.tint }]}><Text style={styles.brandMarkText}>A</Text></View>
            <View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>Autonomous</Text>
              <Text style={[styles.brandSubtitle, { color: colors.muted }]}>Your deliberate AI workspace</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Open active task details"
            disabled={!activeTask}
            onPress={() => setShowTaskDetail(true)}
            style={({ pressed }) => [styles.statusButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && activeTask && styles.pressed, !activeTask && styles.dimmed]}
          >
            <View style={[styles.statusDot, { backgroundColor: activeTask ? colors.tint : colors.success }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>{activeTask ? taskStateLabel(activeTask.state) : "Ready"}</Text>
          </Pressable>
        </View>

        <View style={[styles.modeRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modeCaption, { color: colors.muted }]}>EXECUTION MODE</Text>
          <View style={[styles.modeSegment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(["ASSISTED", "AGENT"] as const).map((mode) => {
              const selected = preferences.mode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityLabel={`Use ${mode === "ASSISTED" ? "assisted" : "agent"} mode`}
                  onPress={() => setMode(mode)}
                  style={({ pressed }) => [styles.modeButton, selected && { backgroundColor: colors.tint }, pressed && styles.pressed]}
                >
                  <Text style={[styles.modeText, { color: selected ? "#FFFFFF" : colors.muted }]}>{mode === "ASSISTED" ? "Assisted" : "Agent"}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(message) => message.id}
          renderItem={renderMessage}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            activeTask && isTaskRunning ? (
              <View style={styles.activityNote}>
                <View style={[styles.statusDot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.activityText, { color: colors.muted }]}>Checking the task policy…</Text>
              </View>
            ) : null
          }
        />

        <View style={[styles.composerArea, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {queuedAttachment ? (
            <View style={[styles.attachmentChip, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}55` }]}>
              <View style={styles.attachmentCopy}>
                <Text numberOfLines={1} style={[styles.attachmentName, { color: colors.text }]}>{queuedAttachment.name}</Text>
                <Text style={[styles.attachmentStatus, { color: colors.warning }]}>Queued locally · processing not enabled</Text>
              </View>
              <Pressable accessibilityLabel="Remove queued attachment" onPress={() => setQueuedAttachment(undefined)} style={({ pressed }) => [styles.removeAttachment, pressed && styles.pressed]}>
                <Text style={[styles.removeAttachmentText, { color: colors.warning }]}>×</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              accessibilityLabel="Choose an attachment"
              onPress={() => void chooseAttachment()}
              style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
            >
              <Text style={[styles.iconText, { color: colors.tint }]}>＋</Text>
            </Pressable>
            <TextInput
              accessibilityLabel="Message the assistant"
              editable={isReady && !isTaskRunning}
              multiline
              onChangeText={setPrompt}
              onSubmitEditing={handleSubmit}
              placeholder={preferences.mode === "AGENT" ? "Describe a task to plan…" : "Ask anything…"}
              placeholderTextColor={colors.muted}
              returnKeyType="send"
              style={[styles.input, { color: colors.text }]}
              value={prompt}
            />
            <Pressable
              accessibilityLabel={recorderState.isRecording ? "Stop voice recording" : "Start voice recording"}
              onPress={() => void toggleVoiceCapture()}
              style={({ pressed }) => [styles.iconAction, recorderState.isRecording && { backgroundColor: `${colors.error}12`, borderRadius: 14 }, pressed && styles.pressed]}
            >
              <Text style={[styles.voiceText, { color: recorderState.isRecording ? colors.error : colors.muted }]}>{recorderState.isRecording ? "■" : "◉"}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Send message"
              disabled={!prompt.trim() || Boolean(isTaskRunning) || !isReady}
              onPress={handleSubmit}
              style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.tint }, (!prompt.trim() || isTaskRunning || !isReady) && styles.disabledSend, pressed && styles.pressed]}
            >
              <Text style={styles.sendText}>↑</Text>
            </Pressable>
          </View>
          <Text style={[styles.privacyHint, { color: colors.muted }]}>{recorderState.isRecording ? "Recording locally · tap the square to stop" : "Local attachments and external actions require a verified approval flow"}</Text>
        </View>
      </KeyboardAvoidingView>
      <TaskDetailSheet task={activeTask as AssistantTask | undefined} visible={showTaskDetail} onDismiss={() => setShowTaskDetail(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 13 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  brandMark: { alignItems: "center", borderRadius: 11, height: 34, justifyContent: "center", width: 34 },
  brandMarkText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  brandTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.25 },
  brandSubtitle: { fontSize: 11, marginTop: 1 },
  statusButton: { alignItems: "center", borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 9, paddingVertical: 7 },
  statusDot: { borderRadius: 99, height: 7, width: 7 },
  statusText: { fontSize: 11, fontWeight: "700" },
  dimmed: { opacity: 0.72 },
  modeRow: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 10 },
  modeCaption: { fontSize: 10, fontWeight: "800", letterSpacing: 0.95 },
  modeSegment: { borderRadius: 10, borderWidth: 1, flexDirection: "row", padding: 2 },
  modeButton: { borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6 },
  modeText: { fontSize: 11, fontWeight: "700" },
  messageList: { flex: 1 },
  messageContent: { gap: 14, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  messageRow: { alignItems: "flex-end", flexDirection: "row", gap: 8, maxWidth: "94%" },
  messageRowAssistant: { alignSelf: "flex-start" },
  messageRowUser: { alignSelf: "flex-end" },
  messageAvatar: { alignItems: "center", borderRadius: 99, height: 26, justifyContent: "center", width: 26 },
  avatarText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  messageBubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  assistantBubble: { borderBottomLeftRadius: 5, borderWidth: 1 },
  userBubble: { borderBottomRightRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 22 },
  listenButton: { alignSelf: "flex-start", borderRadius: 99, borderWidth: 1, marginTop: 10, paddingHorizontal: 9, paddingVertical: 5 },
  listenText: { fontSize: 11, fontWeight: "700" },
  activityNote: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 7, marginLeft: 34, marginTop: 2 },
  activityText: { fontSize: 12, fontWeight: "600" },
  composerArea: { borderTopWidth: StyleSheet.hairlineWidth, gap: 7, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  attachmentChip: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  attachmentCopy: { flex: 1, gap: 2 },
  attachmentName: { fontSize: 12, fontWeight: "700" },
  attachmentStatus: { fontSize: 10, fontWeight: "700" },
  removeAttachment: { alignItems: "center", height: 26, justifyContent: "center", width: 22 },
  removeAttachmentText: { fontSize: 22, fontWeight: "400", lineHeight: 24 },
  composer: { alignItems: "flex-end", borderRadius: 22, borderWidth: 1, flexDirection: "row", minHeight: 52, paddingHorizontal: 7, paddingVertical: 5 },
  iconAction: { alignItems: "center", height: 40, justifyContent: "center", width: 34 },
  iconText: { fontSize: 23, fontWeight: "400", lineHeight: 25 },
  voiceText: { fontSize: 19, lineHeight: 21 },
  input: { flex: 1, fontSize: 15, lineHeight: 21, maxHeight: 94, minHeight: 38, paddingHorizontal: 5, paddingTop: 8 },
  sendButton: { alignItems: "center", borderRadius: 15, height: 38, justifyContent: "center", marginLeft: 3, width: 38 },
  sendText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", lineHeight: 23 },
  disabledSend: { opacity: 0.35 },
  privacyHint: { fontSize: 10, lineHeight: 14, textAlign: "center" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
