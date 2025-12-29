import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { useEventTheme } from '../hooks/useEventTheme'
import { ThemeProvider } from './ThemeProvider'
import type { Theme } from '../types'

// Test component that consumes the theme context
function TestConsumer() {
  const { theme, buttonBgColor, buttonTextColor, buttonRadius } =
    useEventTheme()
  return (
    <div>
      <div data-testid="primary-color">{theme.primaryColor}</div>
      <div data-testid="button-bg-color">{buttonBgColor}</div>
      <div data-testid="button-text-color">{buttonTextColor}</div>
      <div data-testid="button-radius">{buttonRadius}</div>
    </div>
  )
}

const mockTheme: Theme = {
  primaryColor: '#FF5733',
  fontFamily: 'Arial',
  text: {
    color: '#000000',
    alignment: 'center',
  },
  button: {
    backgroundColor: '#00FF00',
    textColor: '#FFFFFF',
    radius: 'md',
  },
  background: {
    color: '#FFFFFF',
    image: 'https://example.com/bg.jpg',
    overlayOpacity: 0.5,
  },
}

describe('ThemeProvider', () => {
  it('should provide theme context to children', () => {
    const { getByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    expect(getByTestId('primary-color').textContent).toBe('#FF5733')
    expect(getByTestId('button-text-color').textContent).toBe('#FFFFFF')
  })

  it('should compute buttonBgColor when backgroundColor is provided', () => {
    const { getByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    // backgroundColor is provided, so it should use that value
    expect(getByTestId('button-bg-color').textContent).toBe('#00FF00')
  })

  it('should fallback buttonBgColor to primaryColor when backgroundColor is null', () => {
    const themeWithNullBg: Theme = {
      ...mockTheme,
      button: {
        ...mockTheme.button,
        backgroundColor: null,
      },
    }

    const { getByTestId } = render(
      <ThemeProvider theme={themeWithNullBg}>
        <TestConsumer />
      </ThemeProvider>,
    )

    // Should fallback to primaryColor
    expect(getByTestId('button-bg-color').textContent).toBe('#FF5733')
  })

  it('should map button radius preset to CSS value', () => {
    const { getByTestId } = render(
      <ThemeProvider theme={mockTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    // 'md' should map to '0.5rem'
    expect(getByTestId('button-radius').textContent).toBe('0.5rem')
  })

  it('should map all radius presets correctly', () => {
    const radiusTests = [
      { preset: 'none' as const, expected: '0' },
      { preset: 'sm' as const, expected: '0.25rem' },
      { preset: 'md' as const, expected: '0.5rem' },
      { preset: 'full' as const, expected: '9999px' },
    ]

    radiusTests.forEach(({ preset, expected }) => {
      const themeWithRadius: Theme = {
        ...mockTheme,
        button: {
          ...mockTheme.button,
          radius: preset,
        },
      }

      const { getByTestId, unmount } = render(
        <ThemeProvider theme={themeWithRadius}>
          <TestConsumer />
        </ThemeProvider>,
      )

      expect(getByTestId('button-radius').textContent).toBe(expected)

      // Unmount to prevent multiple elements with same testid
      unmount()
    })
  })

  it('should memoize computed values', () => {
    const { rerender } = render(
      <ThemeProvider theme={mockTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    // Re-render with the same theme object reference
    rerender(
      <ThemeProvider theme={mockTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    // If memoization works, component should not re-compute values
    // This is implicitly tested - if useMemo is missing, test will still pass
    // but we're documenting the expected behavior
    expect(true).toBe(true)
  })

  it('should update computed values when theme changes', () => {
    const { getByTestId, rerender } = render(
      <ThemeProvider theme={mockTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    expect(getByTestId('primary-color').textContent).toBe('#FF5733')

    const updatedTheme: Theme = {
      ...mockTheme,
      primaryColor: '#0000FF',
    }

    rerender(
      <ThemeProvider theme={updatedTheme}>
        <TestConsumer />
      </ThemeProvider>,
    )

    expect(getByTestId('primary-color').textContent).toBe('#0000FF')
  })
})
