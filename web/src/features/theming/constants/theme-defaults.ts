import type { ButtonRadius } from "../types";

/**
 * Maps button radius preset names to CSS border-radius values.
 *
 * Canonical source of truth - use this constant everywhere
 * to ensure consistent button styling across the application.
 */
export const BUTTON_RADIUS_MAP: Record<ButtonRadius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  full: "9999px",
};
