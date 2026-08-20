import { useCallback } from "react";

import { useAssistant } from "@/lib/assistant-context";
import { scaleTextSize } from "@/shared/accessibility";

export function useAccessibility() {
  const { preferences } = useAssistant();
  const scaleText = useCallback((size: number) => scaleTextSize(size, preferences.textScale), [preferences.textScale]);

  return {
    highContrast: preferences.highContrast,
    textScale: preferences.textScale,
    scaleText,
  };
}
