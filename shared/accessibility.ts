export const TEXT_SCALE_OPTIONS = ["STANDARD", "LARGE", "EXTRA_LARGE"] as const;
export type TextScaleOption = (typeof TEXT_SCALE_OPTIONS)[number];

const TEXT_SCALE_MULTIPLIERS: Record<TextScaleOption, number> = {
  STANDARD: 1,
  LARGE: 1.15,
  EXTRA_LARGE: 1.3,
};

const TEXT_SCALE_LABELS: Record<TextScaleOption, string> = {
  STANDARD: "Standard",
  LARGE: "Large",
  EXTRA_LARGE: "Extra large",
};

export function textScaleMultiplier(option: TextScaleOption): number {
  return TEXT_SCALE_MULTIPLIERS[option];
}

export function textScaleLabel(option: TextScaleOption): string {
  return TEXT_SCALE_LABELS[option];
}

export function scaleTextSize(size: number, option: TextScaleOption): number {
  return Math.round(size * textScaleMultiplier(option) * 10) / 10;
}
