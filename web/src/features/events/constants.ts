// Event validation constants - extracted from schemas to avoid magic numbers

import type { Theme } from "@/features/theming";
import type { EventExtras, EventOverlayConfig, OverlayAspectRatio } from "./types/event.types";

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
export const DEFAULT_EVENT_THEME: Theme = {
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

// Extra slot metadata for UI rendering
export const EXTRA_SLOTS = {
  preEntryGate: {
    key: "preEntryGate",
    label: "Pre-Entry Gate",
    description: "Flow shown once before guest starts any experience",
    examples: "Age verification, consent forms, house rules",
  },
  preReward: {
    key: "preReward",
    label: "Pre-Reward",
    description: "Flow shown after experience but before AI result",
    examples: "Quick survey, feedback, additional info collection",
  },
} as const;

// Frequency options for extra slots
export const EXTRA_FREQUENCIES = {
  always: {
    value: "always",
    label: "Every time",
    description: "Show this experience on every visit",
  },
  once_per_session: {
    value: "once_per_session",
    label: "Once per session",
    description: "Show only once per guest session",
  },
} as const;

// Default extras configuration (empty slots)
export const DEFAULT_EVENT_EXTRAS: EventExtras = {
  preEntryGate: null,
  preReward: null,
};

// Overlay aspect ratio metadata for UI rendering
export const OVERLAY_ASPECT_RATIOS: Record<
  OverlayAspectRatio,
  { label: string; ratio: string; cssAspect: string }
> = {
  square: { label: "Square", ratio: "1:1", cssAspect: "1/1" },
  story: { label: "Story", ratio: "9:16", cssAspect: "9/16" },
} as const;

// Default overlay configuration (no frames configured)
export const DEFAULT_EVENT_OVERLAY: EventOverlayConfig = {
  frames: {
    square: { enabled: false, frameUrl: null },
    story: { enabled: false, frameUrl: null },
  },
};
