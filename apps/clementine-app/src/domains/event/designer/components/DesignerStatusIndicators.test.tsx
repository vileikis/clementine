import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useEventDesignerStore } from '../stores/useEventDesignerStore'
import { DesignerStatusIndicators } from './DesignerStatusIndicators'

describe('DesignerStatusIndicators', () => {
  beforeEach(() => {
    // Reset store state before each test (wrap in act)
    act(() => {
      useEventDesignerStore.getState().resetSaveState()
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should show nothing when idle', () => {
    const { container } = render(<DesignerStatusIndicators />)

    expect(container.firstChild).toBeNull()
  })

  it('should show spinner when pendingSaves > 0', () => {
    const { startSave } = useEventDesignerStore.getState()

    act(() => {
      startSave()
    })

    render(<DesignerStatusIndicators />)

    // Check for Loader2 icon (spinner)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()

    // Check for screen reader text
    expect(screen.getByText('Saving changes...')).toBeTruthy()
  })

  it('should show checkmark for 3 seconds after save completes', () => {
    const { startSave, completeSave } = useEventDesignerStore.getState()

    act(() => {
      startSave()
      completeSave()
    })

    render(<DesignerStatusIndicators />)

    // Should show checkmark immediately
    const checkmark = screen.getByText('Changes saved successfully')
    expect(checkmark).toBeTruthy()

    // Fast-forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Checkmark should disappear
    expect(screen.queryByText('Changes saved successfully')).not.toBeTruthy()
  })

  it('should hide checkmark before 3 seconds if new save starts', () => {
    const { startSave, completeSave } = useEventDesignerStore.getState()

    // Complete a save
    act(() => {
      startSave()
      completeSave()
    })

    const { rerender } = render(<DesignerStatusIndicators />)

    // Checkmark should be visible
    expect(screen.getByText('Changes saved successfully')).toBeTruthy()

    // Start a new save before 3 seconds
    act(() => {
      vi.advanceTimersByTime(1000) // 1 second elapsed
      startSave()
    })
    rerender(<DesignerStatusIndicators />)

    // Spinner should replace checkmark
    expect(screen.queryByText('Changes saved successfully')).not.toBeTruthy()
    expect(screen.getByText('Saving changes...')).toBeTruthy()
  })

  it('should clean up timer on unmount', () => {
    const { startSave, completeSave } = useEventDesignerStore.getState()

    act(() => {
      startSave()
      completeSave()
    })

    const { unmount } = render(<DesignerStatusIndicators />)

    // Unmount before 3 seconds
    unmount()

    // Advance timers - no error should occur
    vi.advanceTimersByTime(5000)

    // Test passes if no error thrown
    expect(true).toBe(true)
  })

  it('should show spinner for multiple concurrent saves', () => {
    const { startSave } = useEventDesignerStore.getState()

    act(() => {
      startSave()
      startSave()
      startSave()
    })

    render(<DesignerStatusIndicators />)

    expect(screen.getByText('Saving changes...')).toBeTruthy()
  })

  it('should NOT show checkmark until ALL saves complete', () => {
    const { startSave, completeSave } = useEventDesignerStore.getState()

    act(() => {
      startSave()
      startSave()
    })

    const { rerender } = render(<DesignerStatusIndicators />)

    // Spinner should be visible
    expect(screen.getByText('Saving changes...')).toBeTruthy()

    // Complete first save
    act(() => {
      completeSave()
    })
    rerender(<DesignerStatusIndicators />)

    // Spinner should STILL be visible (one save pending)
    expect(screen.getByText('Saving changes...')).toBeTruthy()
    expect(screen.queryByText('Changes saved successfully')).not.toBeTruthy()

    // Complete second save
    act(() => {
      completeSave()
    })
    rerender(<DesignerStatusIndicators />)

    // Now checkmark should appear
    expect(screen.getByText('Changes saved successfully')).toBeTruthy()
  })

  it('should have proper ARIA attributes', () => {
    const { startSave } = useEventDesignerStore.getState()

    act(() => {
      startSave()
    })

    const { container } = render(<DesignerStatusIndicators />)

    const statusElement = container.querySelector('[role="status"]')
    expect(statusElement).toBeTruthy()
    expect(statusElement?.getAttribute('aria-live')).toBe('polite')
  })

  it('should handle rapid state changes correctly', () => {
    const { startSave, completeSave } = useEventDesignerStore.getState()

    const { rerender } = render(<DesignerStatusIndicators />)

    // Rapid sequence: start → complete → start → complete
    act(() => {
      startSave()
    })
    rerender(<DesignerStatusIndicators />)
    expect(screen.getByText('Saving changes...')).toBeTruthy()

    act(() => {
      completeSave()
    })
    rerender(<DesignerStatusIndicators />)
    expect(screen.getByText('Changes saved successfully')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(500) // Wait 0.5 seconds
    })

    act(() => {
      startSave()
    })
    rerender(<DesignerStatusIndicators />)
    expect(screen.getByText('Saving changes...')).toBeTruthy()

    act(() => {
      completeSave()
    })
    rerender(<DesignerStatusIndicators />)
    expect(screen.getByText('Changes saved successfully')).toBeTruthy()
  })
})
