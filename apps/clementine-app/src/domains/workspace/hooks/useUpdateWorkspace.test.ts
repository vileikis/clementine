import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { doc, runTransaction } from 'firebase/firestore'
import { useUpdateWorkspace } from './useUpdateWorkspace'

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

vi.mock('@/integrations/firebase/client', () => ({
  firestore: {},
}))

// Mock Sentry
vi.mock('@sentry/tanstackstart-react', () => ({
  captureException: vi.fn(),
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

  it('should update workspace name successfully', async () => {
    const mockTransaction = {
      update: vi.fn(),
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      await callback(mockTransaction as any)
    })

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    const input = {
      id: 'workspace-1',
      name: 'New Name',
    }

    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockTransaction.update).toHaveBeenCalled()
  })

  it('should update workspace slug with uniqueness check', async () => {
    const mockTransaction = {
      get: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
    }

    // Mock slug doesn't exist (unique)
    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: () => false,
      } as any)
      await callback(mockTransaction as any)
    })

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    const input = {
      id: 'workspace-1',
      slug: 'new-slug',
    }

    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockTransaction.get).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalled()
    expect(mockTransaction.set).toHaveBeenCalled()
  })

  it('should throw error if slug already in use', async () => {
    const mockTransaction = {
      get: vi.fn(),
    }

    // Mock slug exists for different workspace
    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ workspaceId: 'different-workspace-id' }),
      } as any)
      await callback(mockTransaction as any)
    })

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    const input = {
      id: 'workspace-1',
      slug: 'taken-slug',
    }

    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
      expect(result.current.error).toEqual(new Error('Slug already in use'))
    })
  })

  it('should allow updating slug to same value (same workspace)', async () => {
    const mockTransaction = {
      get: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
    }

    // Mock slug exists for same workspace
    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ workspaceId: 'workspace-1' }),
      } as any)
      await callback(mockTransaction as any)
    })

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    const input = {
      id: 'workspace-1',
      slug: 'same-slug',
    }

    result.current.mutate(input)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockTransaction.update).toHaveBeenCalled()
  })

  it('should invalidate workspace queries on success', async () => {
    const mockTransaction = {
      update: vi.fn(),
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      await callback(mockTransaction as any)
    })

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

  it('should update isPending state during mutation', async () => {
    let resolveTransaction: () => void
    const transactionPromise = new Promise<void>((resolve) => {
      resolveTransaction = resolve
    })

    vi.mocked(runTransaction).mockReturnValue(transactionPromise as any)

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper })

    result.current.mutate({ id: 'workspace-1', name: 'New Name' })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    resolveTransaction!()

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})
