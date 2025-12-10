/**
 * Button border radius presets
 */
export type ButtonRadius = "none" | "sm" | "md" | "full";

/**
 * Text styling configuration
 */
export interface ThemeText {
  /** Text color in hex format (#RRGGBB) */
  color: string;
  /** Text alignment */
  alignment: "left" | "center" | "right";
}

/**
 * Button styling configuration
 */
export interface ThemeButton {
  /** Button background color in hex; falls back to primaryColor if null */
  backgroundColor?: string | null;
  /** Button text color in hex format (#RRGGBB) */
  textColor: string;
  /** Border radius preset */
  radius: ButtonRadius;
}

/**
 * Background styling configuration
 */
export interface ThemeBackground {
  /** Background color in hex format (#RRGGBB) */
  color: string;
  /** Full public URL to background image */
  image?: string | null;
  /** Overlay opacity from 0 to 1 */
  overlayOpacity: number;
}

/**
 * Unified theme configuration used by Projects and Events
 *
 * Note: logoUrl is intentionally excluded - it's an identity concern
 * handled separately by consuming features (Project.logoUrl, Event.logoUrl)
 */
export interface Theme {
  /** Anchor color in hex format (#RRGGBB) */
  primaryColor: string;
  /** CSS font-family string */
  fontFamily?: string | null;
  /** Text styling configuration */
  text: ThemeText;
  /** Button styling configuration */
  button: ThemeButton;
  /** Background styling configuration */
  background: ThemeBackground;
}
