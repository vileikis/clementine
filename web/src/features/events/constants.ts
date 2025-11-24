// Event validation constants - extracted from schemas to avoid magic numbers

// Field length constraints
export const TITLE_LENGTH = {
  MIN: 1,
  MAX: 200,
} as const;

// Color validation
export const COLOR_REGEX = /^#[0-9A-F]{6}$/i;

// Theme defaults (for backward compatibility and initialization)
export const THEME_DEFAULTS = {
  buttonColor: undefined,
  buttonTextColor: undefined,
  backgroundColor: undefined,
  backgroundImage: undefined,
} as const;

// Share config defaults (kept for backward compatibility, will be removed in V4)
export const SHARE_CONFIG_DEFAULTS = {
  allowDownload: true,
  allowSystemShare: true,
  allowEmail: false,
  socials: [],
} as const;
