import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDocs } from 'firebase/firestore'
import { useWorkspace } from './useWorkspace'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('@/integrations/firebase/client', () => ({
  firestore: {},
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
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should return null when workspace is not found', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
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

    vi.mocked(getDocs).mockResolvedValueOnce({
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
    expect(getDocs).not.toHaveBeenCalled()
  })

  it('should normalize slug to lowercase', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: true,
      docs: [],
    } as any)

    renderHook(() => useWorkspace('ACME-CORP'), { wrapper })

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled()
    })

    // Query key should have lowercase slug
    const queryKey = queryClient
      .getQueryCache()
      .getAll()[0]?.queryKey as string[]
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

    vi.mocked(getDocs).mockResolvedValueOnce({
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

    expect(getDocs).toHaveBeenCalledTimes(1)

    // Rerender should not trigger new fetch (cached)
    rerender()

    expect(getDocs).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockWorkspace)
  })
})
