import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RuntimeTopBar } from './RuntimeTopBar'
import type { Theme } from '@/shared/theming/types'
import { ThemeProvider } from '@/shared/theming/providers/ThemeProvider'

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

describe('RuntimeTopBar', () => {
  it('renders experience name', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test Experience"
          currentStepIndex={0}
          totalSteps={5}
        />
      </ThemeProvider>,
    )

    expect(screen.getByText('Test Experience')).toBeInTheDocument()
  })

  it('shows fallback "Experience" when name is empty', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar experienceName="" currentStepIndex={0} totalSteps={1} />
      </ThemeProvider>,
    )

    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('calculates progress correctly for first step', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={5}
        />
      </ThemeProvider>,
    )

    // Step 1 of 5 = 20%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '20')
  })

  it('calculates progress correctly for middle step', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={2}
          totalSteps={5}
        />
      </ThemeProvider>,
    )

    // Step 3 of 5 = 60%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
  })

  it('calculates progress correctly for last step', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={4}
          totalSteps={5}
        />
      </ThemeProvider>,
    )

    // Step 5 of 5 = 100%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('hides progress bar for single-step experience', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
        />
      </ThemeProvider>,
    )

    // Progress bar should not be rendered for single-step experience
    const progressBar = screen.queryByRole('progressbar')
    expect(progressBar).not.toBeInTheDocument()
  })

  it('disables home button when onHomeClick is undefined (preview mode)', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={undefined}
        />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    expect(homeButton).toBeDisabled()
  })

  it('enables home button when onHomeClick is provided (guest mode)', () => {
    const handleClick = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={handleClick}
        />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    expect(homeButton).not.toBeDisabled()
  })

  it('opens confirmation dialog when home button is clicked', () => {
    const handleClick = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={handleClick}
        />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Dialog should open
    expect(screen.getByText('Exit Experience?')).toBeInTheDocument()
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('calls onHomeClick when exit is confirmed', () => {
    const handleClick = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={handleClick}
        />
      </ThemeProvider>,
    )

    // Click home button
    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Click exit button in dialog
    const exitButton = screen.getByText('Exit')
    fireEvent.click(exitButton)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onHomeClick when cancel is clicked', () => {
    const handleClick = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={handleClick}
        />
      </ThemeProvider>,
    )

    // Click home button
    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Click cancel button in dialog
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not open dialog when button is disabled', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={undefined}
        />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Dialog should not appear
    expect(screen.queryByText('Exit Experience?')).not.toBeInTheDocument()
  })

  it('renders home icon', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
        />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    const icon = homeButton.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className to container', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          className="custom-topbar-class"
        />
      </ThemeProvider>,
    )

    const topbar = container.firstChild
    expect(topbar).toHaveClass('custom-topbar-class')
  })

  it('generates correct accessibility label for progress', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={2}
          totalSteps={5}
        />
      </ThemeProvider>,
    )

    const progressBar = screen.getByRole('progressbar')
    // Step 3 of 5 (60% complete)
    expect(progressBar).toHaveAttribute(
      'aria-valuetext',
      'Step 3 of 5 (60% complete)',
    )
  })

  it('handles zero steps edge case gracefully', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={0}
        />
      </ThemeProvider>,
    )

    // Progress bar should not be rendered for zero-step experience
    const progressBar = screen.queryByRole('progressbar')
    expect(progressBar).not.toBeInTheDocument()
  })
})
