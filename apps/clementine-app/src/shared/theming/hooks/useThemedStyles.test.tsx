import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../providers/ThemeProvider'
import { useThemedStyles } from './useThemedStyles'
import type { ThemedStyles } from './useThemedStyles'
import type { Theme } from '../types'

const mockTheme: Theme = {
  primaryColor: '#FF5733',
  fontFamily: 'Arial, sans-serif',
  fontSource: 'system',
  fontVariants: [400, 700],
  fallbackStack:
    'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  text: {
    color: '#000000',
    alignment: 'center',
  },
  button: {
    backgroundColor: '#00FF00',
    textColor: '#FFFFFF',
    radius: 'rounded',
  },
  background: {
    color: '#F0F0F0',
    image: {
      mediaAssetId: 'abc123',
      url: 'https://example.com/bg.jpg',
      filePath: null,
      displayName: 'Test Media',
    },
    overlayOpacity: 0.5,
  },
}

function StylesTestComponent() {
  const styles = useThemedStyles()
  return (
    <div>
      <div data-testid="text-color">{styles.text.color}</div>
      <div data-testid="text-align">{styles.text.textAlign}</div>
      <div data-testid="button-bg">{styles.button.backgroundColor}</div>
      <div data-testid="button-color">{styles.button.color}</div>
      <div data-testid="button-radius">{styles.button.borderRadius}</div>
      <div data-testid="bg-color">{styles.background.backgroundColor}</div>
      <div data-testid="bg-image">{styles.background.backgroundImage}</div>
      <div data-testid="bg-size">{styles.background.backgroundSize}</div>
      <div data-testid="bg-position">
        {styles.background.backgroundPosition}
      </div>
      <div data-testid="font-family">{styles.background.fontFamily}</div>
    </div>
  )
}

describe('useThemedStyles', () => {
  it('should return text styles with color and alignment', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <StylesTestComponent />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('text-color').textContent).toBe('#000000')
    expect(screen.getByTestId('text-align').textContent).toBe('center')
  })

  it('should return button styles with background color, text color, and radius', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <StylesTestComponent />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('button-bg').textContent).toBe('#00FF00')
    expect(screen.getByTestId('button-color').textContent).toBe('#FFFFFF')
    expect(screen.getByTestId('button-radius').textContent).toBe('0.5rem')
  })

  it('should return background styles with background image', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <StylesTestComponent />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('bg-color').textContent).toBe('#F0F0F0')
    expect(screen.getByTestId('bg-image').textContent).toBe(
      'url(https://example.com/bg.jpg)',
    )
    expect(screen.getByTestId('bg-size').textContent).toBe('cover')
    expect(screen.getByTestId('bg-position').textContent).toBe('center')
  })

  it('should include fontFamily in background styles when provided', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <StylesTestComponent />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('font-family').textContent).toBe(
      'Arial, sans-serif',
    )
  })

  it('should not include background image properties when image is null', () => {
    const themeWithoutImage: Theme = {
      ...mockTheme,
      background: {
        ...mockTheme.background,
        image: null,
      },
    }

    function NoImageTest() {
      const styles = useThemedStyles()
      return (
        <div>
          <div data-testid="has-bg-image">
            {String(Object.hasOwn(styles.background, 'backgroundImage'))}
          </div>
          <div data-testid="has-bg-size">
            {String(Object.hasOwn(styles.background, 'backgroundSize'))}
          </div>
        </div>
      )
    }

    render(
      <ThemeProvider theme={themeWithoutImage}>
        <NoImageTest />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('has-bg-image').textContent).toBe('false')
    expect(screen.getByTestId('has-bg-size').textContent).toBe('false')
  })

  it('should not include fontFamily when not provided', () => {
    const themeWithoutFont: Theme = {
      ...mockTheme,
      fontFamily: null,
    }

    function NoFontTest() {
      const styles = useThemedStyles()
      return (
        <div data-testid="has-font">
          {String(Object.hasOwn(styles.background, 'fontFamily'))}
        </div>
      )
    }

    render(
      <ThemeProvider theme={themeWithoutFont}>
        <NoFontTest />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('has-font').textContent).toBe('false')
  })

  it('should use fallback button background color when backgroundColor is null', () => {
    const themeWithNullButtonBg: Theme = {
      ...mockTheme,
      button: {
        ...mockTheme.button,
        backgroundColor: null,
      },
    }

    function FallbackTest() {
      const styles = useThemedStyles()
      return (
        <div data-testid="button-bg-fallback">
          {styles.button.backgroundColor}
        </div>
      )
    }

    render(
      <ThemeProvider theme={themeWithNullButtonBg}>
        <FallbackTest />
      </ThemeProvider>,
    )

    // Should fall back to primaryColor
    expect(screen.getByTestId('button-bg-fallback').textContent).toBe('#FF5733')
  })

  it('should handle different text alignments', () => {
    const alignments: ('left' | 'center' | 'right')[] = [
      'left',
      'center',
      'right',
    ]

    alignments.forEach((alignment) => {
      const themeWithAlignment: Theme = {
        ...mockTheme,
        text: {
          ...mockTheme.text,
          alignment,
        },
      }

      function AlignmentTest() {
        const styles = useThemedStyles()
        return <div data-testid="alignment">{styles.text.textAlign}</div>
      }

      const { unmount } = render(
        <ThemeProvider theme={themeWithAlignment}>
          <AlignmentTest />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('alignment').textContent).toBe(alignment)
      unmount()
    })
  })

  it('should handle all button radius presets', () => {
    const radiusTests = [
      { preset: 'square' as const, expected: '0' },
      { preset: 'rounded' as const, expected: '0.5rem' },
      { preset: 'pill' as const, expected: '9999px' },
    ]

    radiusTests.forEach(({ preset, expected }) => {
      const themeWithRadius: Theme = {
        ...mockTheme,
        button: {
          ...mockTheme.button,
          radius: preset,
        },
      }

      function RadiusTest() {
        const styles = useThemedStyles()
        return <div data-testid="radius">{styles.button.borderRadius}</div>
      }

      const { unmount } = render(
        <ThemeProvider theme={themeWithRadius}>
          <RadiusTest />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('radius').textContent).toBe(expected)
      unmount()
    })
  })

  it('should memoize style objects', () => {
    let previousStyles: ThemedStyles | null = null
    let sameReference = false

    function MemoTest() {
      const styles = useThemedStyles()

      if (previousStyles !== null) {
        sameReference = styles === previousStyles
      }
      previousStyles = styles

      return <div data-testid="same-reference">{String(sameReference)}</div>
    }

    const { rerender } = render(
      <ThemeProvider theme={mockTheme}>
        <MemoTest />
      </ThemeProvider>,
    )

    // Re-render with same theme object reference
    rerender(
      <ThemeProvider theme={mockTheme}>
        <MemoTest />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('same-reference').textContent).toBe('true')
  })
})
