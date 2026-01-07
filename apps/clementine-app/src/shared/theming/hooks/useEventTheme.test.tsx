import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../components/ThemeProvider'
import { useEventTheme } from './useEventTheme'
import type { Theme } from '../types'

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
    radius: 'rounded',
  },
  background: {
    color: '#FFFFFF',
    image: 'https://example.com/bg.jpg',
    overlayOpacity: 0.5,
  },
}

function TestComponent() {
  const { theme, buttonBgColor, buttonTextColor, buttonRadius } =
    useEventTheme()
  return (
    <div>
      <div data-testid="theme-primary">{theme.primaryColor}</div>
      <div data-testid="button-bg">{buttonBgColor}</div>
      <div data-testid="button-text">{buttonTextColor}</div>
      <div data-testid="button-radius">{buttonRadius}</div>
    </div>
  )
}

describe('useEventTheme', () => {
  it('should return theme context when used within ThemeProvider', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <TestComponent />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme-primary').textContent).toBe('#FF5733')
    expect(screen.getByTestId('button-bg').textContent).toBe('#00FF00')
    expect(screen.getByTestId('button-text').textContent).toBe('#FFFFFF')
    expect(screen.getByTestId('button-radius').textContent).toBe('0.5rem')
  })

  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test since we expect an error
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useEventTheme must be used within a ThemeProvider')

    console.error = originalError
  })

  it('should provide access to raw theme object', () => {
    function ThemeAccessTest() {
      const { theme } = useEventTheme()
      return (
        <div>
          <div data-testid="font-family">{theme.fontFamily}</div>
          <div data-testid="text-color">{theme.text.color}</div>
          <div data-testid="text-alignment">{theme.text.alignment}</div>
          <div data-testid="bg-color">{theme.background.color}</div>
          <div data-testid="bg-image">{theme.background.image}</div>
          <div data-testid="bg-overlay">{theme.background.overlayOpacity}</div>
        </div>
      )
    }

    render(
      <ThemeProvider theme={mockTheme}>
        <ThemeAccessTest />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('font-family').textContent).toBe('Arial')
    expect(screen.getByTestId('text-color').textContent).toBe('#000000')
    expect(screen.getByTestId('text-alignment').textContent).toBe('center')
    expect(screen.getByTestId('bg-color').textContent).toBe('#FFFFFF')
    expect(screen.getByTestId('bg-image').textContent).toBe(
      'https://example.com/bg.jpg',
    )
    expect(screen.getByTestId('bg-overlay').textContent).toBe('0.5')
  })

  it('should provide computed button values', () => {
    function ButtonValuesTest() {
      const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme()
      return (
        <div>
          <div data-testid="computed-bg">{buttonBgColor}</div>
          <div data-testid="computed-text">{buttonTextColor}</div>
          <div data-testid="computed-radius">{buttonRadius}</div>
        </div>
      )
    }

    render(
      <ThemeProvider theme={mockTheme}>
        <ButtonValuesTest />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('computed-bg').textContent).toBe('#00FF00')
    expect(screen.getByTestId('computed-text').textContent).toBe('#FFFFFF')
    expect(screen.getByTestId('computed-radius').textContent).toBe('0.5rem')
  })

  it('should work in nested components', () => {
    function ParentComponent() {
      return (
        <div>
          <ChildComponent />
        </div>
      )
    }

    function ChildComponent() {
      return (
        <div>
          <GrandchildComponent />
        </div>
      )
    }

    function GrandchildComponent() {
      const { theme } = useEventTheme()
      return <div data-testid="nested-primary">{theme.primaryColor}</div>
    }

    render(
      <ThemeProvider theme={mockTheme}>
        <ParentComponent />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('nested-primary').textContent).toBe('#FF5733')
  })
})
