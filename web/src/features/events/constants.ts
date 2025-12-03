// Event validation constants - extracted from schemas to avoid magic numbers

import type { EventTheme } from "./types/event.types";

// Field length constraints
export const NAME_LENGTH = {
  MIN: 1,
  MAX: 200,
} as const;

// Color validation
export const COLOR_REGEX = /^#[0-9A-F]{6}$/i;

// Default event name (used when creating via quick-create button)
export const DEFAULT_EVENT_NAME = "Untitled Event";

// Default theme configuration (for UI default values and initialization)
export const DEFAULT_EVENT_THEME: EventTheme = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#6366F1", // Indigo
  text: {
    color: "#1F2937", // Gray-800
    alignment: "center",
  },
  button: {
    backgroundColor: null, // Inherits primaryColor
    textColor: "#FFFFFF", // White
    radius: "md",
  },
  background: {
    color: "#FFFFFF", // White
    image: null,
    overlayOpacity: 0.5,
  },
};
