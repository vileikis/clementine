import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemedBackground } from './ThemedBackground'
import type { ThemeBackground } from '../types'

const mockBackground: ThemeBackground = {
  color: '#FFFFFF',
  image: 'https://example.com/bg.jpg',
  overlayOpacity: 0.5,
}

describe('ThemedBackground', () => {
  it('should render children', () => {
    render(
      <ThemedBackground background={mockBackground}>
        <div data-testid="child">Child Content</div>
      </ThemedBackground>,
    )

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByTestId('child').textContent).toBe('Child Content')
  })

  it('should apply background color', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground}>
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.backgroundColor).toBe('rgb(255, 255, 255)') // #FFFFFF converted
  })

  it('should render background image', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground}>
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

  it('should render overlay with correct opacity', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground}>
        <div>Content</div>
      </ThemedBackground>,
    )

    const overlayDiv = container.querySelector(
      '[style*="opacity"]',
    ) as HTMLElement
    expect(overlayDiv).toBeDefined()
    expect(overlayDiv.style.opacity).toBe('0.5')
  })

  it('should not render background image when image is null', () => {
    const bgWithoutImage: ThemeBackground = {
      ...mockBackground,
      image: null,
    }

    const { container } = render(
      <ThemedBackground background={bgWithoutImage}>
        <div>Content</div>
      </ThemedBackground>,
    )

    const bgImageDiv = container.querySelector('[style*="backgroundImage"]')
    expect(bgImageDiv).toBeNull()
  })

  it('should not render overlay when overlayOpacity is 0', () => {
    const bgWithNoOverlay: ThemeBackground = {
      ...mockBackground,
      overlayOpacity: 0,
    }

    const { container } = render(
      <ThemedBackground background={bgWithNoOverlay}>
        <div>Content</div>
      </ThemedBackground>,
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
    const bgWithoutImage: ThemeBackground = {
      ...mockBackground,
      image: null,
      overlayOpacity: 0.5,
    }

    const { container } = render(
      <ThemedBackground background={bgWithoutImage}>
        <div>Content</div>
      </ThemedBackground>,
    )

    // Overlay should not be rendered when there's no image
    const overlays = container.querySelectorAll(
      '[class*="pointer-events-none"]',
    )
    expect(overlays.length).toBe(0)
  })

  it('should apply fontFamily to container', () => {
    const { container } = render(
      <ThemedBackground
        background={mockBackground}
        fontFamily="Arial, sans-serif"
      >
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.fontFamily).toBe('Arial, sans-serif')
  })

  it('should not apply fontFamily when null', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground} fontFamily={null}>
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.fontFamily).toBe('')
  })

  it('should apply custom className to container', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground} className="custom-class">
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.className).toContain('custom-class')
  })

  it('should apply custom style prop to container', () => {
    const { container } = render(
      <ThemedBackground
        background={mockBackground}
        style={{ padding: '20px', margin: '10px' }}
      >
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.padding).toBe('20px')
    expect(outerDiv.style.margin).toBe('10px')
  })

  it('should render default content wrapper', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground}>
        <div data-testid="child">Content</div>
      </ThemedBackground>,
    )

    // Default content wrapper should exist
    const contentWrapper = container.querySelector('[class*="items-center"]')
    expect(contentWrapper).toBeDefined()
  })

  it('should apply custom contentClassName', () => {
    const { container } = render(
      <ThemedBackground
        background={mockBackground}
        contentClassName="custom-content"
      >
        <div>Content</div>
      </ThemedBackground>,
    )

    const contentWrapper = container.querySelector('[class*="custom-content"]')
    expect(contentWrapper).toBeDefined()
  })

  it('should disable content wrapper when contentClassName is empty string', () => {
    const { container } = render(
      <ThemedBackground background={mockBackground} contentClassName="">
        <div data-testid="child">Content</div>
      </ThemedBackground>,
    )

    // Content wrapper should not have the default centered classes
    const contentWrapper = container.querySelector('[class*="items-center"]')
    expect(contentWrapper).toBeNull()
  })

  it('should use white background color when background prop is not provided', () => {
    const { container } = render(
      <ThemedBackground>
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.backgroundColor).toBe('rgb(255, 255, 255)') // #FFFFFF converted
  })

  it('should handle partial background configuration', () => {
    const partialBg: Partial<ThemeBackground> = {
      color: '#FF0000',
    }

    const { container } = render(
      <ThemedBackground background={partialBg}>
        <div>Content</div>
      </ThemedBackground>,
    )

    const outerDiv = container.firstChild as HTMLElement
    expect(outerDiv.style.backgroundColor).toBe('rgb(255, 0, 0)') // #FF0000 converted

    // Should not render background image (not provided)
    const bgImageDiv = container.querySelector('[style*="backgroundImage"]')
    expect(bgImageDiv).toBeNull()
  })

  it('should render with all default styles when no props provided except children', () => {
    const { container } = render(
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
})
