import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useProjectConfigDesignerStore } from '../stores/useProjectConfigDesignerStore'
import { useTrackedMutation } from './useTrackedMutation'
import type { UseMutationResult } from '@tanstack/react-query'

// Mock mutation result
function createMockMutation(
  isPending: boolean,
): UseMutationResult<unknown, unknown, unknown> {
  return {
    isPending,
    data: undefined,
    error: null,
    isError: false,
    isIdle: !isPending,
    isSuccess: false,
    status: isPending ? 'pending' : 'idle',
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    submittedAt: 0,
  } as UseMutationResult<unknown, unknown, unknown>
}

describe('useTrackedMutation', () => {
  beforeEach(() => {
    // Reset store state before each test (wrap in act to avoid warnings)
    act(() => {
      useProjectConfigDesignerStore.getState().resetSaveState()
    })
  })

  it('should call startSave on idle → pending transition', async () => {
    const mutation = createMockMutation(false) // Start idle

    const { rerender } = renderHook(() => useTrackedMutation(mutation))

    expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)

    // Transition to pending
    mutation.isPending = true
    rerender()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
    })
  })

  it('should call completeSave on pending → idle transition', async () => {
    const mutation = createMockMutation(true) // Start pending

    const { rerender } = renderHook(() => useTrackedMutation(mutation))

    // Manually increment to simulate the save started (wrap in act)
    act(() => {
      useProjectConfigDesignerStore.getState().startSave()
    })
    expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)

    // Transition to idle
    mutation.isPending = false
    rerender()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)
    })
  })

  it('should NOT double-count on re-renders with same state', async () => {
    const mutation = createMockMutation(false)

    const { rerender } = renderHook(() => useTrackedMutation(mutation))

    // Re-render multiple times with same state
    rerender()
    rerender()
    rerender()

    expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)

    // Now transition to pending
    mutation.isPending = true
    rerender()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
    })

    // Re-render again with pending state
    rerender()
    rerender()

    // Should still be 1 (no double-counting)
    expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
  })

  it('should track multiple mutation transitions correctly', async () => {
    const mutation1 = createMockMutation(false)
    const mutation2 = createMockMutation(false)

    const { rerender: rerender1 } = renderHook(() =>
      useTrackedMutation(mutation1),
    )
    const { rerender: rerender2 } = renderHook(() =>
      useTrackedMutation(mutation2),
    )

    // Start mutation 1
    mutation1.isPending = true
    rerender1()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
    })

    // Start mutation 2
    mutation2.isPending = true
    rerender2()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(2)
    })

    // Complete mutation 1
    mutation1.isPending = false
    rerender1()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
    })

    // Complete mutation 2
    mutation2.isPending = false
    rerender2()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)
      expect(useProjectConfigDesignerStore.getState().lastCompletedAt).not.toBeNull()
    })
  })

  it('should return the original mutation unchanged (passthrough)', () => {
    const mutation = createMockMutation(false)

    const { result } = renderHook(() => useTrackedMutation(mutation))

    // Verify all properties are passed through
    expect(result.current).toBe(mutation)
    expect(result.current.isPending).toBe(false)
    expect(result.current.mutate).toBe(mutation.mutate)
    expect(result.current.mutateAsync).toBe(mutation.mutateAsync)
  })

  it('should handle rapid state changes without errors', async () => {
    const mutation = createMockMutation(false)

    const { rerender } = renderHook(() => useTrackedMutation(mutation))

    // Rapid transitions
    mutation.isPending = true
    rerender()

    mutation.isPending = false
    rerender()

    mutation.isPending = true
    rerender()

    mutation.isPending = false
    rerender()

    await waitFor(() => {
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)
    })
  })
})
