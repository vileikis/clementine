// Experience feature constants

export const EXPERIENCE_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 200 },
  DESCRIPTION_LENGTH: { max: 1000 },
  MAX_STEPS: 50,
} as const;

export const DEFAULT_EXPERIENCE_NAME = "Untitled";
