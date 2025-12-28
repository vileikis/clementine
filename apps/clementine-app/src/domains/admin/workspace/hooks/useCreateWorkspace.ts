import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  where,
} from 'firebase/firestore'
import type {
  Workspace,
  WorkspaceStatus,
} from '@/domains/workspace/types/workspace.types'
import type { CreateWorkspaceSchemaType } from '@/domains/workspace/schemas/workspace.schemas'
import { firestore } from '@/integrations/firebase/client'
import { generateSlug } from '@/shared/utils/slug-utils'
import { createWorkspaceSchema } from '@/domains/workspace/schemas/workspace.schemas'

/**
 * Create workspace mutation (dedicated hook with full business logic)
 *
 * Admin-only operation. Follows "mutations via dedicated hooks" pattern.
 * Mutation logic is directly in the hook, not in a separate service function.
 *
 * Uses Firestore client SDK transaction to enforce slug uniqueness atomically.
 * Security enforced via Firestore rules (admin-only writes with data validation).
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWorkspaceSchemaType) => {
      // Validate input
      const validated = createWorkspaceSchema.parse(data)
      const workspacesRef = collection(firestore, 'workspaces')

      // Generate or validate slug
      const slug = validated.slug?.toLowerCase() || generateSlug(validated.name)

      // Run transaction - Firestore ensures atomicity at database level
      return await runTransaction(firestore, async (transaction) => {
        // Check if slug exists (case-insensitive, includes deleted workspaces)
        const q = query(workspacesRef, where('slug', '==', slug), limit(1))
        const existingSnapshot = await getDocs(q)

        if (!existingSnapshot.empty) {
          throw new Error('Slug already exists')
        }

        // Create workspace
        const newWorkspaceRef = doc(workspacesRef)
        const now = Date.now()

        const workspaceData: Workspace = {
          id: newWorkspaceRef.id,
          name: validated.name,
          slug,
          status: 'active' as WorkspaceStatus,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        }

        transaction.set(newWorkspaceRef, workspaceData)

        return { id: newWorkspaceRef.id, slug }
      })
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error)
      // Error available in mutation.error for UI
    },
  })
}
