import { useRouter } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { MAIN_SECTION_SHORTCUTS, mainSectionShortcutForKey } from "@/shared/keyboard-shortcuts";

type KeyboardShortcutContextValue = {
  openShortcutHelp: () => void;
};

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue>({
  openShortcutHelp: () => undefined,
});

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const colors = useColors();
  const [helpVisible, setHelpVisible] = useState(false);

  const openShortcutHelp = useCallback(() => setHelpVisible(true), []);
  const closeShortcutHelp = useCallback(() => setHelpVisible(false), []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
      if (event.key === "Escape" && helpVisible) {
        event.preventDefault();
        closeShortcutHelp();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        openShortcutHelp();
        return;
      }
      const shortcut = mainSectionShortcutForKey(event.key);
      if (shortcut) {
        event.preventDefault();
        router.navigate(shortcut.route);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeShortcutHelp, helpVisible, openShortcutHelp, router]);

  const contextValue = useMemo(() => ({ openShortcutHelp }), [openShortcutHelp]);

  return (
    <KeyboardShortcutContext.Provider value={contextValue}>
      {children}
      <Modal transparent visible={helpVisible} onRequestClose={closeShortcutHelp} animationType="fade">
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel="Close keyboard shortcuts" accessibilityRole="button" accessibilityHint="Closes keyboard shortcut help." onPress={closeShortcutHelp} style={StyleSheet.absoluteFill} />
          <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Keyboard shortcuts</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Web only · disabled while typing in a field</Text>
              </View>
              <Pressable accessibilityLabel="Close keyboard shortcuts" accessibilityRole="button" accessibilityHint="You can also press Escape." onPress={closeShortcutHelp} style={({ pressed }) => [styles.closeButton, { borderColor: colors.border }, pressed && styles.pressed]}>
                <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
              </Pressable>
            </View>
            <View style={styles.shortcutList}>
              {MAIN_SECTION_SHORTCUTS.map((shortcut) => (
                <View key={shortcut.key} accessible accessibilityLabel={`${shortcut.key}. Open ${shortcut.label}.`} style={[styles.shortcutRow, { borderColor: colors.border }]}>
                  <Text style={[styles.shortcutLabel, { color: colors.text }]}>{shortcut.label}</Text>
                  <View style={[styles.keyCap, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.keyText, { color: colors.tint }]}>{shortcut.key}</Text></View>
                </View>
              ))}
              <View accessible accessibilityLabel="Question mark. Open this keyboard shortcut help." style={[styles.shortcutRow, { borderColor: colors.border }]}>
                <Text style={[styles.shortcutLabel, { color: colors.text }]}>Shortcut help</Text>
                <View style={[styles.keyCap, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.keyText, { color: colors.tint }]}>?</Text></View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardShortcutContext.Provider>
  );
}

export function useKeyboardShortcuts(): KeyboardShortcutContextValue {
  return useContext(KeyboardShortcutContext);
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "rgba(5, 14, 19, 0.48)", flex: 1, justifyContent: "center", padding: 24 },
  dialog: { borderRadius: 22, borderWidth: 1, gap: 18, maxWidth: 420, padding: 18, width: "100%" },
  titleRow: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  titleCopy: { flex: 1, gap: 3 },
  title: { fontSize: 19, fontWeight: "800", lineHeight: 25 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  closeButton: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  closeText: { fontSize: 11, fontWeight: "800" },
  shortcutList: { gap: 1 },
  shortcutRow: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: 11 },
  shortcutLabel: { fontSize: 14, fontWeight: "700" },
  keyCap: { alignItems: "center", borderRadius: 8, borderWidth: 1, minWidth: 30, paddingHorizontal: 8, paddingVertical: 5 },
  keyText: { fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
