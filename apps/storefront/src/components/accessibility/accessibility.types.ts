export type ContrastMode = "default" | "high" | "inverted";
export type SpacingMode = "default" | "comfortable" | "wide";

export interface AccessibilityPreferences {
  panelEnabled: boolean;
  fontScale: number; // 1, 1.125, 1.25, 1.375, 1.5
  contrast: ContrastMode;
  grayscale: boolean;
  underlineLinks: boolean;
  lineSpacing: SpacingMode;
  letterSpacing: SpacingMode;
  enhancedFocus: boolean;
  reducedMotion: boolean;
  readingGuide: boolean;
  textReaderEnabled: boolean;
  vlibrasEnabled: boolean;
}

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  panelEnabled: false,
  fontScale: 1,
  contrast: "default",
  grayscale: false,
  underlineLinks: false,
  lineSpacing: "default",
  letterSpacing: "default",
  enhancedFocus: false,
  reducedMotion: false,
  readingGuide: false,
  textReaderEnabled: false,
  vlibrasEnabled: false,
}
