"use client";

import { createContext } from "react";
import type { Theme } from "../types";

/**
 * Context value provided by ThemeProvider.
 * Includes the raw theme object and computed conveniences.
 */
export interface ThemeContextValue {
  /** The raw theme object */
  theme: Theme;
  /** Resolved button background (falls back to primaryColor if button.backgroundColor is null) */
  buttonBgColor: string;
  /** Button text color from theme */
  buttonTextColor: string;
  /** CSS border-radius value mapped from theme.button.radius */
  buttonRadius: string;
}

/**
 * React context for theme values.
 * Must be used with ThemeProvider - null indicates missing provider.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
