"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProjectTheme as EventTheme } from "@/features/projects/types";

interface EventThemeContextValue {
  theme: EventTheme;
  // Computed conveniences
  buttonBgColor: string;
  buttonTextColor: string;
  buttonRadius: string;
}

const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeProviderProps {
  theme: EventTheme;
  children: ReactNode;
}

/**
 * Provides event theme to all step renderers and primitives.
 * Computes derived values for convenience.
 *
 * @deprecated Use ThemeProvider and useTheme from @/features/theming instead.
 * This provider will be removed in a future release. Migration steps:
 * 1. Replace `import { EventThemeProvider, useEventTheme } from "@/components/providers/EventThemeProvider"`
 *    with `import { ThemeProvider, useTheme } from "@/features/theming"`
 * 2. Replace `<EventThemeProvider theme={...}>` with `<ThemeProvider theme={...}>`
 * 3. Replace `useEventTheme()` with `useTheme()`
 */
export function EventThemeProvider({
  theme,
  children,
}: EventThemeProviderProps) {
  const value = useMemo<EventThemeContextValue>(() => {
    const radiusMap: Record<EventTheme["button"]["radius"], string> = {
      none: "0",
      sm: "0.25rem",
      md: "0.5rem",
      full: "9999px",
    };

    return {
      theme,
      buttonBgColor: theme.button.backgroundColor ?? theme.primaryColor,
      buttonTextColor: theme.button.textColor,
      buttonRadius: radiusMap[theme.button.radius],
    };
  }, [theme]);

  return (
    <EventThemeContext.Provider value={value}>
      {children}
    </EventThemeContext.Provider>
  );
}

/**
 * Hook to access the event theme context.
 * Must be used within an EventThemeProvider.
 *
 * @deprecated Use useTheme from @/features/theming instead.
 */
export function useEventTheme(): EventThemeContextValue {
  const context = useContext(EventThemeContext);
  if (!context) {
    throw new Error("useEventTheme must be used within an EventThemeProvider");
  }
  return context;
}
