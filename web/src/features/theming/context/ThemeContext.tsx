"use client";

import { createContext } from "react";
import type { Theme } from "../types";

/**
 * Extended theme type that includes optional logoUrl.
 * Used by providers that pass themes with identity information.
 */
export interface ThemeWithLogo extends Theme {
  /** Logo URL - identity concern, optional */
  logoUrl?: string | null;
}

/**
 * Context value provided by ThemeProvider.
 * Includes the raw theme object and computed conveniences.
 */
export interface ThemeContextValue {
  /** The raw theme object (may include logoUrl if provided) */
  theme: ThemeWithLogo;
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
