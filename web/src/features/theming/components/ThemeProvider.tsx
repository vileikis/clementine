"use client";

import { useMemo, type ReactNode } from "react";
import {
  ThemeContext,
  type ThemeContextValue,
  type ThemeWithLogo,
} from "../context/ThemeContext";
import { BUTTON_RADIUS_MAP } from "../constants";

interface ThemeProviderProps {
  /** The theme configuration to provide (may include logoUrl) */
  theme: ThemeWithLogo;
  /** Child components that will have access to the theme */
  children: ReactNode;
}

/**
 * Provides theme context to all descendant components.
 *
 * Computes derived values for convenience:
 * - buttonBgColor: Falls back to primaryColor if button.backgroundColor is null
 * - buttonTextColor: Direct from theme
 * - buttonRadius: Mapped from radius preset to CSS value
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={event.theme}>
 *   <MyThemedComponent />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      buttonBgColor: theme.button.backgroundColor ?? theme.primaryColor,
      buttonTextColor: theme.button.textColor,
      buttonRadius: BUTTON_RADIUS_MAP[theme.button.radius],
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
