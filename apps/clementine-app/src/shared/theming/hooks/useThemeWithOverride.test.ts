import { createElement } from 'react'

import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ThemeContext } from '../context/ThemeContext'
import { useThemeWithOverride } from './useThemeWithOverride'
import type { Theme } from '../types'

import type { ReactNode } from 'react'

// Mock theme for testing
const mockTheme: Theme = {
  fontFamily: 'Arial',
  fontSource: 'system',
  fontVariants: [400, 700],
  fallbackStack:
    'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  primaryColor: '#3B82F6',
  text: { color: '#1E1E1E', alignment: 'center' },
  button: { backgroundColor: null, textColor: '#FFFFFF', radius: 'rounded' },
  background: { color: '#FFFFFF', image: null, overlayOpacity: 0.3 },
}

// Alternative theme for testing override
const overrideTheme: Theme = {
  fontFamily: 'Helvetica',
  fontSource: 'system',
  fontVariants: [400, 700],
  fallbackStack:
    'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  primaryColor: '#FF0000',
  text: { color: '#000000', alignment: 'left' },
  button: { backgroundColor: '#00FF00', textColor: '#000000', radius: 'pill' },
  background: { color: '#000000', image: null, overlayOpacity: 0.5 },
}

// Wrapper component for providing context
function createWrapper(theme: Theme) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      ThemeContext.Provider,
      {
        value: {
          theme,
          buttonBgColor: theme.button.backgroundColor ?? theme.primaryColor,
          buttonTextColor: theme.button.textColor,
          buttonRadius: '0.5rem',
        },
      },
      children,
    )
  }
}

describe('useThemeWithOverride', () => {
  it('should return theme from context when no override provided', () => {
    const { result } = renderHook(() => useThemeWithOverride(), {
      wrapper: createWrapper(mockTheme),
    })

    expect(result.current).toEqual(mockTheme)
  })

  it('should return override theme when provided', () => {
    const { result } = renderHook(() => useThemeWithOverride(overrideTheme), {
      wrapper: createWrapper(mockTheme),
    })

    expect(result.current).toEqual(overrideTheme)
  })

  it('should return override theme even without context', () => {
    const { result } = renderHook(() => useThemeWithOverride(overrideTheme))

    expect(result.current).toEqual(overrideTheme)
  })

  it('should throw error when no theme available', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useThemeWithOverride())
    }).toThrow(
      'Themed components require either a ThemeProvider ancestor or a theme prop',
    )

    consoleSpy.mockRestore()
  })

  it('should prioritize override over context', () => {
    const { result } = renderHook(() => useThemeWithOverride(overrideTheme), {
      wrapper: createWrapper(mockTheme),
    })

    // Should be override, not context
    expect(result.current.primaryColor).toBe('#FF0000')
    expect(result.current.fontFamily).toBe('Helvetica')
  })
})
