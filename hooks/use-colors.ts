import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useAssistant } from "@/lib/assistant-context";
import { useColorScheme } from "./use-color-scheme";

const HIGH_CONTRAST_COLORS: Record<ColorScheme, ThemeColorPalette> = {
  light: {
    ...Colors.light,
    primary: "#005A58",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    foreground: "#000000",
    muted: "#1C1C1E",
    border: "#000000",
    success: "#006B2E",
    warning: "#7A3900",
    error: "#8D001A",
    text: "#000000",
    tint: "#005A58",
    icon: "#000000",
    tabIconDefault: "#1C1C1E",
    tabIconSelected: "#005A58",
  },
  dark: {
    ...Colors.dark,
    primary: "#53E5DB",
    background: "#000000",
    surface: "#000000",
    foreground: "#FFFFFF",
    muted: "#E6E6E6",
    border: "#FFFFFF",
    success: "#7CFF8A",
    warning: "#FFCF86",
    error: "#FFB3B8",
    text: "#FFFFFF",
    tint: "#53E5DB",
    icon: "#FFFFFF",
    tabIconDefault: "#E6E6E6",
    tabIconSelected: "#53E5DB",
  },
};

/**
 * Returns the current theme's color palette.
 * Usage: const colors = useColors(); then colors.text, colors.background, etc.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const colorSchema = useColorScheme();
  const { preferences } = useAssistant();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "light") as ColorScheme;
  return preferences.highContrast ? HIGH_CONTRAST_COLORS[scheme] : Colors[scheme];
}
