import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../providers/ThemeProvider'
import { ThemedBackground } from './ThemedBackground'
import type { Theme, ThemeBackground } from '../types'

const mockTheme: Theme = {
  fontFamily: 'Inter, sans-serif',
  primaryColor: '#3B82F6',
  text: {
    color: '#1F2937',
    alignment: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    radius: 'rounded',
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
}

const mockBackgroundOverride: ThemeBackground = {
  color: '#FF0000',
  image: {
    mediaAssetId: 'override123',
    url: 'https://example.com/override.jpg',
    filePath: null,
    displayName: 'Test Media',
  },
  overlayOpacity: 0.3,
}

function renderWithTheme(ui: React.ReactElement, theme: Theme = mockTheme) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

describe('ThemedBackground', () => {
  it('should render children', () => {
    renderWithTheme(
      <ThemedBackground>
        <div data-testid="child">Child Content</div>
      </ThemedBackground>,
    )

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByTestId('child').textContent).toBe('Child Content')
  })

  it('should apply background color from theme context', () => {
    const { container } = renderWithTheme(
      <ThemedBackground>
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.backgroundColor).toBe('rgb(255, 255, 255)') // #FFFFFF converted
  })

  it('should render background image from theme context', () => {
    const { container } = renderWithTheme(
      <ThemedBackground>
        <div>Content</div>
      </ThemedBackground>,
    )

    const bgImageDiv = container.querySelector(
      '[style*="background-image"]',
    ) as HTMLElement
    expect(bgImageDiv).not.toBeNull()
    expect(bgImageDiv?.style.backgroundImage).toContain(
      'https://example.com/bg.jpg',
    )
  })

  it('should render overlay with correct opacity from theme context', () => {
    const { container } = renderWithTheme(
      <ThemedBackground>
        <div>Content</div>
      </ThemedBackground>,
    )

    const overlayDiv = container.querySelector(
      '[style*="opacity"]',
    ) as HTMLElement
    expect(overlayDiv).toBeDefined()
    expect(overlayDiv.style.opacity).toBe('0.5')
  })

  it('should apply fontFamily from theme context', () => {
    const { container } = renderWithTheme(
      <ThemedBackground>
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.fontFamily).toBe('Inter, sans-serif')
  })

  it('should not apply fontFamily when theme.fontFamily is null', () => {
    const themeWithoutFont: Theme = {
      ...mockTheme,
      fontFamily: null,
    }

    const { container } = renderWithTheme(
      <ThemedBackground>
        <div>Content</div>
      </ThemedBackground>,
      themeWithoutFont,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.fontFamily).toBe('')
  })

  // Background prop override tests
  describe('background prop override', () => {
    it('should use background prop instead of theme.background when provided', () => {
      const { container } = renderWithTheme(
        <ThemedBackground background={mockBackgroundOverride}>
          <div>Content</div>
        </ThemedBackground>,
      )

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.backgroundColor).toBe('rgb(255, 0, 0)') // #FF0000 converted
    })

    it('should use background prop image instead of theme image', () => {
      const { container } = renderWithTheme(
        <ThemedBackground background={mockBackgroundOverride}>
          <div>Content</div>
        </ThemedBackground>,
      )

      const bgImageDiv = container.querySelector(
        '[style*="background-image"]',
      ) as HTMLElement
      expect(bgImageDiv?.style.backgroundImage).toContain(
        'https://example.com/override.jpg',
      )
    })

    it('should use background prop overlayOpacity instead of theme', () => {
      const { container } = renderWithTheme(
        <ThemedBackground background={mockBackgroundOverride}>
          <div>Content</div>
        </ThemedBackground>,
      )

      const overlayDiv = container.querySelector(
        '[style*="opacity"]',
      ) as HTMLElement
      expect(overlayDiv.style.opacity).toBe('0.3')
    })
  })

  // No image/overlay tests
  describe('without background image', () => {
    it('should not render background image when image is null in theme', () => {
      const themeWithoutImage: Theme = {
        ...mockTheme,
        background: {
          ...mockTheme.background,
          image: null,
        },
      }

      const { container } = renderWithTheme(
        <ThemedBackground>
          <div>Content</div>
        </ThemedBackground>,
        themeWithoutImage,
      )

      const bgImageDiv = container.querySelector('[style*="backgroundImage"]')
      expect(bgImageDiv).toBeNull()
    })

    it('should not render overlay when overlayOpacity is 0', () => {
      const themeWithNoOverlay: Theme = {
        ...mockTheme,
        background: {
          ...mockTheme.background,
          overlayOpacity: 0,
        },
      }

      const { container } = renderWithTheme(
        <ThemedBackground>
          <div>Content</div>
        </ThemedBackground>,
        themeWithNoOverlay,
      )

      // Overlay should not be rendered when opacity is 0
      const overlays = container.querySelectorAll(
        '[class*="pointer-events-none"]',
      )
      const visibleOverlay = Array.from(overlays).find((el) => {
        const htmlEl = el as HTMLElement
        return htmlEl.style.opacity && parseFloat(htmlEl.style.opacity) > 0
      })
      expect(visibleOverlay).toBeUndefined()
    })

    it('should not render overlay when image is null', () => {
      const themeWithoutImage: Theme = {
        ...mockTheme,
        background: {
          ...mockTheme.background,
          image: null,
          overlayOpacity: 0.5,
        },
      }

      const { container } = renderWithTheme(
        <ThemedBackground>
          <div>Content</div>
        </ThemedBackground>,
        themeWithoutImage,
      )

      // Overlay should not be rendered when there's no image
      const overlays = container.querySelectorAll(
        '[class*="pointer-events-none"]',
      )
      expect(overlays.length).toBe(0)
    })
  })

  // Styling props tests
  describe('styling props', () => {
    it('should apply custom className to container', () => {
      const { container } = renderWithTheme(
        <ThemedBackground className="custom-class">
          <div>Content</div>
        </ThemedBackground>,
      )

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('custom-class')
    })

    it('should apply custom style prop to container', () => {
      const { container } = renderWithTheme(
        <ThemedBackground style={{ padding: '20px', margin: '10px' }}>
          <div>Content</div>
        </ThemedBackground>,
      )

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.padding).toBe('20px')
      expect(outerDiv.style.margin).toBe('10px')
    })

  })

  // Default styles tests
  describe('default styles', () => {
    it('should render with all default styles', () => {
      const { container } = renderWithTheme(
        <ThemedBackground>
          <div data-testid="child">Content</div>
        </ThemedBackground>,
      )

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('relative')
      expect(outerDiv.className).toContain('flex')
      expect(outerDiv.className).toContain('flex-1')
      expect(outerDiv.className).toContain('flex-col')
      expect(outerDiv.className).toContain('overflow-hidden')
      expect(screen.getByTestId('child')).toBeDefined()
    })

    it('should render default content wrapper', () => {
      const { container } = renderWithTheme(
        <ThemedBackground>
          <div data-testid="child">Content</div>
        </ThemedBackground>,
      )

      // Default content wrapper should exist
      const contentWrapper = container.querySelector('[class*="items-center"]')
      expect(contentWrapper).toBeDefined()
    })
  })

  // Error handling
  describe('error handling', () => {
    it('should throw when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(
          <ThemedBackground>
            <div>Content</div>
          </ThemedBackground>,
        )
      }).toThrow('useEventTheme must be used within a ThemeProvider')

      consoleSpy.mockRestore()
    })
  })
})
