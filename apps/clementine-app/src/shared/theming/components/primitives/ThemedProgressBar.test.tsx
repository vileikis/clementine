import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../providers/ThemeProvider'
import { ThemedProgressBar } from './ThemedProgressBar'
import type { Theme } from '../../types'

const mockTheme: Theme = {
  fontFamily: 'Inter, sans-serif',
  primaryColor: '#3B82F6',
  text: {
    color: '#1F2937',
    alignment: 'center',
  },
  button: {
    backgroundColor: null,
    textColor: '#FFFFFF',
    radius: 'rounded',
  },
  background: {
    color: '#FFFFFF',
    image: null,
    overlayOpacity: 0,
  },
}

describe('ThemedProgressBar', () => {
  it('renders with correct progress percentage', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={50} />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps values to 0-100 range', () => {
    const { rerender } = render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={150} />
      </ThemeProvider>,
    )

    let progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')

    rerender(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={-10} />
      </ThemeProvider>,
    )

    progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  it('applies theme primary color to indicator', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={75} />
      </ThemeProvider>,
    )

    const indicator = screen.getByRole('progressbar').querySelector('div')
    expect(indicator).toHaveStyle({
      backgroundColor: mockTheme.primaryColor,
    })
  })

  it('works without ThemeProvider using theme prop', () => {
    render(<ThemedProgressBar value={60} theme={mockTheme} />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')

    const indicator = progressBar.querySelector('div')
    expect(indicator).toHaveStyle({
      backgroundColor: mockTheme.primaryColor,
    })
  })

  it('handles indeterminate state', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={null} />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    // Radix UI sets aria-valuenow to null for indeterminate state
    expect(progressBar).not.toHaveAttribute('aria-valuenow')
  })

  it('uses custom accessibility label', () => {
    const getValueLabel = (value: number, max: number) =>
      `Step ${value} of ${max}`

    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar
          value={3}
          max={5}
          getValueLabel={getValueLabel}
        />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuetext', 'Step 3 of 5')
  })

  it('handles zero progress', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={0} />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  it('handles complete progress', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={100} />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('applies custom className to root', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={50} className="custom-class" />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('custom-class')
  })

  it('applies custom className to indicator', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar
          value={50}
          indicatorClassName="custom-indicator"
        />
      </ThemeProvider>,
    )

    const indicator = screen.getByRole('progressbar').querySelector('div')
    expect(indicator).toHaveClass('custom-indicator')
  })

  it('calculates transform correctly for different values', () => {
    const { rerender } = render(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={0} />
      </ThemeProvider>,
    )

    let indicator = screen.getByRole('progressbar').querySelector('div')
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })

    rerender(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={25} />
      </ThemeProvider>,
    )
    indicator = screen.getByRole('progressbar').querySelector('div')
    expect(indicator).toHaveStyle({ transform: 'translateX(-75%)' })

    rerender(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={50} />
      </ThemeProvider>,
    )
    indicator = screen.getByRole('progressbar').querySelector('div')
    expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' })

    rerender(
      <ThemeProvider theme={mockTheme}>
        <ThemedProgressBar value={100} />
      </ThemeProvider>,
    )
    indicator = screen.getByRole('progressbar').querySelector('div')
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' })
  })
})
