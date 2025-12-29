import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkspaceStore } from './useWorkspaceStore'

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Reset store state after each test
    useWorkspaceStore.setState({ lastVisitedWorkspaceSlug: null })
  })

  it('should initialize with null lastVisitedWorkspaceSlug', () => {
    const { result } = renderHook(() => useWorkspaceStore())

    expect(result.current.lastVisitedWorkspaceSlug).toBeNull()
  })

  it('should update lastVisitedWorkspaceSlug', () => {
    const { result } = renderHook(() => useWorkspaceStore())

    act(() => {
      result.current.setLastVisitedWorkspaceSlug('acme-corp')
    })

    expect(result.current.lastVisitedWorkspaceSlug).toBe('acme-corp')
  })

  it('should persist lastVisitedWorkspaceSlug to localStorage', () => {
    const { result } = renderHook(() => useWorkspaceStore())

    act(() => {
      result.current.setLastVisitedWorkspaceSlug('test-workspace')
    })

    // Check localStorage
    const stored = localStorage.getItem('workspace-storage')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!)
    expect(parsed.state.lastVisitedWorkspaceSlug).toBe('test-workspace')
  })

  it('should restore lastVisitedWorkspaceSlug from localStorage', () => {
    // Manually set localStorage
    localStorage.setItem(
      'workspace-storage',
      JSON.stringify({
        state: { lastVisitedWorkspaceSlug: 'restored-workspace' },
        version: 0,
      }),
    )

    // Create new store instance (simulates page reload)
    const { result } = renderHook(() => useWorkspaceStore())

    // Wait for rehydration
    expect(result.current.lastVisitedWorkspaceSlug).toBe('restored-workspace')
  })

  it('should handle multiple updates', () => {
    const { result } = renderHook(() => useWorkspaceStore())

    act(() => {
      result.current.setLastVisitedWorkspaceSlug('workspace-1')
    })
    expect(result.current.lastVisitedWorkspaceSlug).toBe('workspace-1')

    act(() => {
      result.current.setLastVisitedWorkspaceSlug('workspace-2')
    })
    expect(result.current.lastVisitedWorkspaceSlug).toBe('workspace-2')

    act(() => {
      result.current.setLastVisitedWorkspaceSlug('workspace-3')
    })
    expect(result.current.lastVisitedWorkspaceSlug).toBe('workspace-3')
  })

  it('should access state imperatively via getState()', () => {
    act(() => {
      useWorkspaceStore.setState({
        lastVisitedWorkspaceSlug: 'imperative-test',
      })
    })

    const state = useWorkspaceStore.getState()
    expect(state.lastVisitedWorkspaceSlug).toBe('imperative-test')
  })
})
