import { describe, expect, it } from 'vitest'
import { ThemeContext } from './ThemeContext'
import type { ThemeContextValue } from './ThemeContext'

describe('ThemeContext', () => {
  it('should be created successfully', () => {
    expect(ThemeContext).toBeDefined()
    expect(ThemeContext.displayName).toBeUndefined() // No display name set
  })

  it('should have the correct TypeScript type for context value', () => {
    // Type-level test - if this compiles, the type is correct
    const mockContextValue: ThemeContextValue = {
      theme: {
        primaryColor: '#FF5733',
        fontFamily: 'Arial',
        fontSource: 'system' as const,
        fontVariants: [400, 700],
        fallbackStack:
          'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        text: {
          color: '#000000',
          alignment: 'center' as const,
        },
        button: {
          backgroundColor: '#FF5733',
          textColor: '#FFFFFF',
          radius: 'rounded' as const,
        },
        background: {
          color: '#FFFFFF',
          image: {
            mediaAssetId: 'abc123',
            url: 'https://example.com/bg.jpg',
            filePath: null,
            displayName: 'Test Media',
          },
          overlayOpacity: 0.5,
        },
      },
      buttonBgColor: '#FF5733',
      buttonTextColor: '#FFFFFF',
      buttonRadius: '0.5rem',
    }

    // This should compile without errors
    expect(mockContextValue).toBeDefined()
    expect(mockContextValue.theme.primaryColor).toBe('#FF5733')
  })
})
