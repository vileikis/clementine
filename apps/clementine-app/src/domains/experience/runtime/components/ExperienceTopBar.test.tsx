import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExperienceTopBar } from './ExperienceTopBar'
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

function renderTopBar(props: Parameters<typeof ExperienceTopBar>[0] = {}) {
  return render(
    <ThemeProvider theme={mockTheme}>
      <ExperienceTopBar {...props} />
    </ThemeProvider>,
  )
}

describe('ExperienceTopBar', () => {
  it('renders title when provided', () => {
    renderTopBar({ title: 'Test Experience' })
    expect(screen.getByText('Test Experience')).toBeInTheDocument()
  })

  it('shows progress bar when progress prop is provided with total > 1', () => {
    renderTopBar({ progress: { current: 1, total: 5 } })
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '20')
  })

  it('calculates progress correctly for middle step', () => {
    renderTopBar({ progress: { current: 3, total: 5 } })
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
  })

  it('calculates progress correctly for last step', () => {
    renderTopBar({ progress: { current: 5, total: 5 } })
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('hides progress bar when progress is not provided', () => {
    renderTopBar({ title: 'Test' })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('hides progress bar for single-step experience', () => {
    renderTopBar({ progress: { current: 1, total: 1 } })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows back button when onBack is provided', () => {
    const handleBack = vi.fn()
    renderTopBar({ onBack: handleBack, onClose: vi.fn() })

    const backButton = screen.getByLabelText('Go back')
    expect(backButton).toBeInTheDocument()
    fireEvent.click(backButton)
    expect(handleBack).toHaveBeenCalledTimes(1)
  })

  it('shows close button when onBack is not provided but onClose is', () => {
    renderTopBar({ onClose: vi.fn() })
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('hides left button when neither onBack nor onClose is provided', () => {
    renderTopBar({ title: 'Test' })
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument()
  })

  it('disables home button when onClose is not provided', () => {
    renderTopBar({ title: 'Test' })
    const homeButton = screen.getByLabelText('Return to home')
    expect(homeButton).toBeDisabled()
  })

  it('enables home button when onClose is provided', () => {
    renderTopBar({ onClose: vi.fn() })
    const homeButton = screen.getByLabelText('Return to home')
    expect(homeButton).not.toBeDisabled()
  })

  it('opens confirmation dialog when home button is clicked', () => {
    const handleClose = vi.fn()
    renderTopBar({ onClose: handleClose })

    fireEvent.click(screen.getByLabelText('Return to home'))
    expect(screen.getByText('Exit Experience?')).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('calls onClose when exit is confirmed', () => {
    const handleClose = vi.fn()
    renderTopBar({ onClose: handleClose })

    fireEvent.click(screen.getByLabelText('Return to home'))
    fireEvent.click(screen.getByText('Exit'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when cancel is clicked', () => {
    const handleClose = vi.fn()
    renderTopBar({ onClose: handleClose })

    fireEvent.click(screen.getByLabelText('Return to home'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('does not open dialog when home button is disabled', () => {
    renderTopBar({ title: 'Test' })
    fireEvent.click(screen.getByLabelText('Return to home'))
    expect(screen.queryByText('Exit Experience?')).not.toBeInTheDocument()
  })

  it('applies custom className to container', () => {
    const { container } = renderTopBar({ className: 'custom-topbar-class' })
    const topbar = container.firstChild
    expect(topbar).toHaveClass('custom-topbar-class')
  })

  it('generates correct accessibility label for progress', () => {
    renderTopBar({ progress: { current: 3, total: 5 } })
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute(
      'aria-valuetext',
      'Step 3 of 5 (60% complete)',
    )
  })

  it('opens confirmation dialog when close (X) button is clicked', () => {
    const handleClose = vi.fn()
    renderTopBar({ onClose: handleClose })

    fireEvent.click(screen.getByLabelText('Close'))
    expect(screen.getByText('Exit Experience?')).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()
  })
})
