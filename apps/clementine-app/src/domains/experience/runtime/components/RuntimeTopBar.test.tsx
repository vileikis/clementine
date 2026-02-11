import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RuntimeTopBar } from './RuntimeTopBar'
import type { Theme } from '@/shared/theming/types'
import { ThemeProvider } from '@/shared/theming/providers/ThemeProvider'

const mockTheme: Theme = {
  fontFamily: 'Inter, sans-serif',
  fontSource: 'system',
  fontVariants: [400, 700],
  fallbackStack:
    'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
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

// Mock useRuntime hook
const mockBack = vi.fn()
const mockRuntimeValues = {
  experienceName: 'Test Experience',
  currentStepIndex: 0,
  totalSteps: 5,
  isComplete: false,
  canGoBack: false,
  back: mockBack,
  // Required by RuntimeAPI but not used by RuntimeTopBar
  sessionId: 'test-session',
  projectId: 'test-project',
  currentStep: null,
  canProceed: true,
  isSyncing: false,
  next: vi.fn(),
  goToStep: vi.fn(),
  setStepResponse: vi.fn(),
  getResponse: vi.fn(),
  getResponses: vi.fn(() => []),
  getState: vi.fn(),
}

vi.mock('../hooks/useRuntime', () => ({
  useRuntime: () => mockRuntimeValues,
}))

// Helper to set mock values for each test
function setMockRuntime(overrides: Partial<typeof mockRuntimeValues>) {
  Object.assign(mockRuntimeValues, overrides)
}

// Reset mock values before each test
beforeEach(() => {
  setMockRuntime({
    experienceName: 'Test Experience',
    currentStepIndex: 0,
    totalSteps: 5,
    isComplete: false,
    canGoBack: false,
  })
  mockBack.mockClear()
})

describe('RuntimeTopBar', () => {
  it('renders experience name from store', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    expect(screen.getByText('Test Experience')).toBeInTheDocument()
  })

  it('shows "Experience" fallback when name is empty', () => {
    setMockRuntime({ experienceName: 'Experience' })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('calculates progress correctly for first step', () => {
    setMockRuntime({ currentStepIndex: 0, totalSteps: 5 })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    // Step 1 of 5 = 20%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '20')
  })

  it('calculates progress correctly for middle step', () => {
    setMockRuntime({ currentStepIndex: 2, totalSteps: 5 })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    // Step 3 of 5 = 60%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
  })

  it('calculates progress correctly for last step', () => {
    setMockRuntime({ currentStepIndex: 4, totalSteps: 5 })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    // Step 5 of 5 = 100%
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('hides progress bar for single-step experience', () => {
    setMockRuntime({ currentStepIndex: 0, totalSteps: 1 })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    // Progress bar should not be rendered for single-step experience
    const progressBar = screen.queryByRole('progressbar')
    expect(progressBar).not.toBeInTheDocument()
  })

  it('disables home button when onClose is undefined (preview mode)', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={undefined} />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    expect(homeButton).toBeDisabled()
  })

  it('enables home button when onClose is provided (guest mode)', () => {
    const handleClose = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={handleClose} />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    expect(homeButton).not.toBeDisabled()
  })

  it('opens confirmation dialog when home button is clicked', () => {
    const handleClose = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={handleClose} />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Dialog should open
    expect(screen.getByText('Exit Experience?')).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('calls onClose when exit is confirmed', () => {
    const handleClose = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={handleClose} />
      </ThemeProvider>,
    )

    // Click home button
    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Click exit button in dialog
    const exitButton = screen.getByText('Exit')
    fireEvent.click(exitButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when cancel is clicked', () => {
    const handleClose = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={handleClose} />
      </ThemeProvider>,
    )

    // Click home button
    const homeButton = screen.getByLabelText('Return to home')
    fireEvent.click(homeButton)

    // Click cancel button in dialog
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(handleClose).not.toHaveBeenCalled()
  })

  it('does not open dialog when button is disabled', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={undefined} />
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
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    const homeButton = screen.getByLabelText('Return to home')
    const icon = homeButton.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className to container', () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar className="custom-topbar-class" />
      </ThemeProvider>,
    )

    const topbar = container.firstChild
    expect(topbar).toHaveClass('custom-topbar-class')
  })

  it('generates correct accessibility label for progress', () => {
    setMockRuntime({ currentStepIndex: 2, totalSteps: 5 })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
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
    setMockRuntime({ currentStepIndex: 0, totalSteps: 0 })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    // Progress bar should not be rendered for zero-step experience
    const progressBar = screen.queryByRole('progressbar')
    expect(progressBar).not.toBeInTheDocument()
  })

  it('hides progress bar when isComplete is true', () => {
    setMockRuntime({ currentStepIndex: 2, totalSteps: 5, isComplete: true })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar />
      </ThemeProvider>,
    )

    // Progress bar hidden during completing state
    const progressBar = screen.queryByRole('progressbar')
    expect(progressBar).not.toBeInTheDocument()
  })

  it('shows X icon (close mode) when isComplete is true', () => {
    setMockRuntime({
      currentStepIndex: 4,
      totalSteps: 5,
      isComplete: true,
    })

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar onClose={vi.fn()} />
      </ThemeProvider>,
    )

    const closeButton = screen.getByLabelText('Close')
    expect(closeButton).toBeInTheDocument()
  })
})
