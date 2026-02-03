/**
 * Hook tests for useCopyToClipboard
 * Feature: 011-project-share-dialog
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { useCopyToClipboard } from './useCopyToClipboard'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useCopyToClipboard', () => {
  let mockClipboard: { writeText: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    // Mock Clipboard API
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    }
    Object.assign(navigator, {
      clipboard: mockClipboard,
    })
    Object.assign(window, {
      isSecureContext: true,
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useCopyToClipboard())

    expect(result.current.isCopying).toBe(false)
    expect(result.current.copySuccess).toBe(false)
    expect(typeof result.current.copyToClipboard).toBe('function')
  })

  it('should copy text using Clipboard API when available', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    const testText = 'https://app.clementine.com/join/test-project'

    let copyPromise: Promise<boolean>
    act(() => {
      copyPromise = result.current.copyToClipboard(testText)
    })

    await act(async () => {
      await copyPromise
    })

    expect(mockClipboard.writeText).toHaveBeenCalledWith(testText)
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard')
    expect(result.current.copySuccess).toBe(true)
  })

  it('should set isCopying to true during copy operation', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    const testText = 'https://app.clementine.com/join/test-project'

    // Make writeText delay
    mockClipboard.writeText.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    )

    act(() => {
      void result.current.copyToClipboard(testText)
    })

    expect(result.current.isCopying).toBe(true)

    await waitFor(() => {
      expect(result.current.isCopying).toBe(false)
    })
  })

  it('should fallback to execCommand when Clipboard API fails', async () => {
    // Make Clipboard API unavailable
    Object.assign(navigator, { clipboard: undefined })

    // Mock execCommand function
    const execCommandMock = vi.fn().mockReturnValue(true)
    document.execCommand =
      execCommandMock as unknown as typeof document.execCommand

    const { result } = renderHook(() => useCopyToClipboard())
    const testText = 'https://app.clementine.com/join/test-project'

    await act(async () => {
      await result.current.copyToClipboard(testText)
    })

    expect(execCommandMock).toHaveBeenCalledWith('copy')
    expect(toast.success).toHaveBeenCalled()
    expect(result.current.copySuccess).toBe(true)

    // Restore clipboard
    Object.assign(navigator, { clipboard: mockClipboard })
  })

  it('should show error toast when copy fails', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Copy failed'))
    const { result } = renderHook(() => useCopyToClipboard())
    const testText = 'https://app.clementine.com/join/test-project'

    await act(async () => {
      await result.current.copyToClipboard(testText)
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to copy link. Please copy manually.',
    )
    expect(result.current.copySuccess).toBe(false)
  })

  it('should reset copySuccess after 3 seconds', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCopyToClipboard())
    const testText = 'https://app.clementine.com/join/test-project'

    await act(async () => {
      await result.current.copyToClipboard(testText)
    })

    expect(result.current.copySuccess).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.copySuccess).toBe(false)

    vi.useRealTimers()
  })
})
