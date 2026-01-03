import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkspace } from './useWorkspace'

// Create mock functions using vi.hoisted to avoid hoisting issues
const { mockGetDocs, mockCollection, mockQuery, mockWhere, mockLimit } =
  vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
    mockCollection: vi.fn(),
    mockQuery: vi.fn(),
    mockWhere: vi.fn(),
    mockLimit: vi.fn(),
  }))

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  limit: mockLimit,
  getDocs: mockGetDocs,
}))

vi.mock('@/integrations/firebase/client', () => ({
  firestore: {},
}))

vi.mock('@/shared/utils', () => ({
  convertFirestoreDoc: vi.fn((doc) => {
    const data = doc.data()
    return { id: doc.id, ...data }
  }),
}))

describe('useWorkspace', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    // Reset all mocks
    mockGetDocs.mockReset()
    mockCollection.mockReset()
    mockQuery.mockReset()
    mockWhere.mockReset()
    mockLimit.mockReset()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should return null when workspace is not found', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
    } as any)

    const { result } = renderHook(() => useWorkspace('nonexistent-slug'), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeNull()
  })

  it('should return workspace when found', async () => {
    const mockWorkspace = {
      id: 'workspace-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      status: 'active',
      deletedAt: null,
      createdAt: 1234567890,
      updatedAt: 1234567890,
    }

    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'workspace-1',
          data: () => ({
            name: 'Acme Corp',
            slug: 'acme-corp',
            status: 'active',
            deletedAt: null,
            createdAt: 1234567890,
            updatedAt: 1234567890,
          }),
        },
      ],
    } as any)

    const { result } = renderHook(() => useWorkspace('acme-corp'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockWorkspace)
  })

  it('should not run query when slug is undefined', () => {
    const { result } = renderHook(() => useWorkspace(undefined), { wrapper })

    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetDocs).not.toHaveBeenCalled()
  })

  it('should normalize slug to lowercase', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
    } as any)

    renderHook(() => useWorkspace('ACME-CORP'), { wrapper })

    await waitFor(() => {
      expect(mockGetDocs).toHaveBeenCalled()
    })

    // Query key should have lowercase slug
    const queryKey = queryClient.getQueryCache().getAll()[0]
      ?.queryKey as string[]
    expect(queryKey[1]).toBe('acme-corp')
  })

  it('should cache results for 5 minutes', async () => {
    const mockWorkspace = {
      id: 'workspace-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      status: 'active',
      deletedAt: null,
      createdAt: 1234567890,
      updatedAt: 1234567890,
    }

    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'workspace-1',
          data: () => ({
            name: 'Acme Corp',
            slug: 'acme-corp',
            status: 'active',
            deletedAt: null,
            createdAt: 1234567890,
            updatedAt: 1234567890,
          }),
        },
      ],
    } as any)

    const { result, rerender } = renderHook(() => useWorkspace('acme-corp'), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetDocs).toHaveBeenCalledTimes(1)

    // Rerender should not trigger new fetch (cached)
    rerender()

    expect(mockGetDocs).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockWorkspace)
  })
})
