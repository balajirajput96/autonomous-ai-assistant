export const MAIN_SECTION_SHORTCUTS = [
  { key: "1", label: "Chat", route: "/" },
  { key: "2", label: "Activity", route: "/activity" },
  { key: "3", label: "Workspace", route: "/workspace" },
  { key: "4", label: "Settings", route: "/settings" },
] as const;

export function mainSectionShortcutForKey(key: string) {
  return MAIN_SECTION_SHORTCUTS.find((shortcut) => shortcut.key === key);
}
