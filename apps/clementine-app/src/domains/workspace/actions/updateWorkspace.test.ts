import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateWorkspace } from './updateWorkspace'
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  runTransaction: vi.fn(),
}))

vi.mock('@/integrations/firebase/admin', () => ({
  adminFirestore: {},
}))

describe('updateWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update workspace name only', async () => {
    const input = {
      id: 'workspace-1',
      name: 'New Workspace Name',
    }

    vi.mocked(updateDoc).mockResolvedValueOnce(undefined)

    await updateWorkspace(input)

    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      name: 'New Workspace Name',
      updatedAt: expect.any(Number),
    })
  })

  it('should update workspace slug with uniqueness check', async () => {
    const input = {
      id: 'workspace-1',
      slug: 'new-slug',
    }

    const mockTransaction = {
      update: vi.fn(),
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      // Mock getDocs to return empty (slug is unique)
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any)

      await callback(mockTransaction as any)
    })

    await updateWorkspace(input)

    expect(runTransaction).toHaveBeenCalled()
    expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
      slug: 'new-slug',
      updatedAt: expect.any(Number),
    })
  })

  it('should update both name and slug', async () => {
    const input = {
      id: 'workspace-1',
      name: 'New Name',
      slug: 'new-slug',
    }

    const mockTransaction = {
      update: vi.fn(),
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any)

      await callback(mockTransaction as any)
    })

    await updateWorkspace(input)

    expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
      name: 'New Name',
      slug: 'new-slug',
      updatedAt: expect.any(Number),
    })
  })

  it('should throw error if slug already in use by another workspace', async () => {
    const input = {
      id: 'workspace-1',
      slug: 'existing-slug',
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'workspace-2', // Different workspace
          },
        ],
      } as any)

      await callback({} as any)
    })

    await expect(updateWorkspace(input)).rejects.toThrow('Slug already in use')
  })

  it('should allow updating slug to same value (same workspace)', async () => {
    const input = {
      id: 'workspace-1',
      slug: 'same-slug',
    }

    const mockTransaction = {
      update: vi.fn(),
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'workspace-1', // Same workspace
          },
        ],
      } as any)

      await callback(mockTransaction as any)
    })

    await expect(updateWorkspace(input)).resolves.toBeUndefined()
    expect(mockTransaction.update).toHaveBeenCalled()
  })

  it('should normalize slug to lowercase', async () => {
    const input = {
      id: 'workspace-1',
      slug: 'UPPERCASE-SLUG',
    }

    const mockTransaction = {
      update: vi.fn(),
    }

    vi.mocked(runTransaction).mockImplementation(async (_, callback) => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any)

      await callback(mockTransaction as any)
    })

    await updateWorkspace(input)

    expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
      slug: 'uppercase-slug', // Lowercased
      updatedAt: expect.any(Number),
    })
  })

  it('should throw validation error if neither name nor slug provided', async () => {
    const input = {
      id: 'workspace-1',
    }

    await expect(updateWorkspace(input as any)).rejects.toThrow()
  })

  it('should throw validation error if name is too long', async () => {
    const input = {
      id: 'workspace-1',
      name: 'a'.repeat(101), // Max is 100
    }

    await expect(updateWorkspace(input)).rejects.toThrow()
  })

  it('should throw validation error if slug is invalid format', async () => {
    const input = {
      id: 'workspace-1',
      slug: 'invalid slug with spaces',
    }

    await expect(updateWorkspace(input)).rejects.toThrow()
  })
})
