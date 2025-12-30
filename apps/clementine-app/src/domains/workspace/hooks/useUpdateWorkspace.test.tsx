import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpdateWorkspace } from './useUpdateWorkspace'

// Create mock functions using vi.hoisted to avoid hoisting issues
const {
  mockRunTransaction,
  mockDoc,
  mockCollection,
  mockQuery,
  mockWhere,
  mockLimit,
  mockGetDocs,
  mockServerTimestamp,
} = vi.hoisted(() => ({
  mockRunTransaction: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockLimit: vi.fn(),
  mockGetDocs: vi.fn(),
  mockServerTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  limit: mockLimit,
  getDocs: mockGetDocs,
  runTransaction: mockRunTransaction,
  serverTimestamp: mockServerTimestamp,
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
    // Reset all mocks
    mockRunTransaction.mockReset()
    mockDoc.mockReset()
    mockCollection.mockReset()
    mockQuery.mockReset()
    mockWhere.mockReset()
    mockLimit.mockReset()
    mockGetDocs.mockReset()
    mockServerTimestamp.mockReset()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should update workspace name successfully', async () => {
    const mockTransaction = {
      update: vi.fn(),
    }

    mockRunTransaction.mockImplementation(async (_, callback) => {
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

    // Mock getDocs to return empty (slug doesn't exist)
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
    } as any)

    // Mock slug doesn't exist (unique)
    mockRunTransaction.mockImplementation(async (_, callback) => {
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

    expect(mockGetDocs).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalled()
  })

  it('should throw error if slug already in use', async () => {
    const mockTransaction = {
      get: vi.fn(),
    }

    // Mock getDocs to return existing slug for different workspace
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'different-workspace-id' }],
    } as any)

    // Mock slug exists for different workspace
    mockRunTransaction.mockImplementation(async (_, callback) => {
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

    // Mock getDocs to return existing slug for same workspace
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'workspace-1' }],
    } as any)

    // Mock slug exists for same workspace
    mockRunTransaction.mockImplementation(async (_, callback) => {
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

    expect(mockGetDocs).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalled()
  })

  it('should invalidate workspace queries on success', async () => {
    const mockTransaction = {
      update: vi.fn(),
    }

    mockRunTransaction.mockImplementation(async (_, callback) => {
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

    mockRunTransaction.mockReturnValue(transactionPromise as any)

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
