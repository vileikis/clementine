"use client";

import { useContext } from "react";
import { ThemeContext, type ThemeContextValue } from "../context/ThemeContext";

/**
 * Hook to access the theme context values.
 *
 * Must be used within a ThemeProvider component.
 * Throws an error if called outside of a ThemeProvider.
 *
 * @returns The theme context value with computed conveniences
 *
 * @example
 * ```tsx
 * function ActionButton({ children }) {
 *   const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();
 *
 *   return (
 *     <button style={{
 *       backgroundColor: buttonBgColor,
 *       color: buttonTextColor,
 *       borderRadius: buttonRadius,
 *     }}>
 *       {children}
 *     </button>
 *   );
 * }
 * ```
 */
export function useEventTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useEventTheme must be used within a ThemeProvider");
  }
  return context;
}
