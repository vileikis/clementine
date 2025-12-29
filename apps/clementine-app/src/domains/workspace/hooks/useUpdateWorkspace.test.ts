import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpdateWorkspace } from './useUpdateWorkspace'
import { updateWorkspace } from '../actions/updateWorkspace'

// Mock updateWorkspace action
vi.mock('../actions/updateWorkspace', () => ({
  updateWorkspace: vi.fn(),
}))

describe('useUpdateWorkspace', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should call updateWorkspace action with correct input', async () => {
    vi.mocked(updateWorkspace).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    const input = {
      id: 'workspace-1',
      name: 'New Name',
    }

    result.current.mutate(input)

    await waitFor(() => {
      expect(updateWorkspace).toHaveBeenCalledWith(input)
    })
  })

  it('should update isPending state during mutation', async () => {
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(updateWorkspace).mockReturnValueOnce(promise)

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    result.current.mutate({ id: 'workspace-1', name: 'New Name' })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    resolvePromise!()

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('should set isError state on failure', async () => {
    vi.mocked(updateWorkspace).mockRejectedValueOnce(
      new Error('Slug already in use'),
    )

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    result.current.mutate({ id: 'workspace-1', slug: 'taken-slug' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toEqual(new Error('Slug already in use'))
    })
  })

  it('should invalidate workspace queries on success', async () => {
    vi.mocked(updateWorkspace).mockResolvedValueOnce(undefined)

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    result.current.mutate({ id: 'workspace-1', name: 'New Name' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['workspace'],
    })
  })

  it('should support mutateAsync for async/await usage', async () => {
    vi.mocked(updateWorkspace).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    const input = {
      id: 'workspace-1',
      slug: 'new-slug',
    }

    await result.current.mutateAsync(input)

    expect(updateWorkspace).toHaveBeenCalledWith(input)
    expect(result.current.isSuccess).toBe(true)
  })

  it('should throw error with mutateAsync on failure', async () => {
    vi.mocked(updateWorkspace).mockRejectedValueOnce(
      new Error('Slug already in use'),
    )

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    await expect(
      result.current.mutateAsync({ id: 'workspace-1', slug: 'taken-slug' }),
    ).rejects.toThrow('Slug already in use')
  })
})
