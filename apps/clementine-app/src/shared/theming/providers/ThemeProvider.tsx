import { useMemo } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { BUTTON_RADIUS_MAP } from '../constants'
import { useGoogleFontLoader } from '../hooks/useGoogleFontLoader'
import type { ReactNode } from 'react'
import type { ThemeContextValue } from '../context/ThemeContext'
import type { Theme } from '../types'

interface ThemeProviderProps {
  /** The theme configuration to provide */
  theme: Theme
  /** Child components that will have access to the theme */
  children: ReactNode
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
  useGoogleFontLoader({
    fontFamily: theme.fontFamily,
    fontSource: theme.fontSource,
    fontVariants: theme.fontVariants,
  })

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      buttonBgColor: theme.button.backgroundColor ?? theme.primaryColor,
      buttonTextColor: theme.button.textColor,
      buttonRadius: BUTTON_RADIUS_MAP[theme.button.radius],
    }
  }, [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
