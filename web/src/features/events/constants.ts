// Event validation constants - extracted from schemas to avoid magic numbers

// Field length constraints
export const NAME_LENGTH = {
  MIN: 1,
  MAX: 200,
} as const;

// Color validation
export const COLOR_REGEX = /^#[0-9A-F]{6}$/i;

// Theme defaults (for UI default values and initialization)
export const THEME_DEFAULTS = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#3B82F6", // Default blue
  text: {
    color: "#000000",
    alignment: "center" as const,
  },
  button: {
    backgroundColor: null, // Inherits primaryColor
    textColor: "#FFFFFF",
    radius: "md" as const,
  },
  background: {
    color: "#FFFFFF",
    image: null,
    overlayOpacity: 0.5,
  },
} as const;
