import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import type { WithFieldValue } from 'firebase/firestore'
import type {
  CreateWorkspaceSchemaType,
  Workspace,
  WorkspaceStatus,
} from '@/domains/workspace'
import { createWorkspaceSchema } from '@/domains/workspace'
import { firestore } from '@/integrations/firebase/client'
import { generateSlug } from '@/shared/utils/slug-utils'

/**
 * Determine if error should be reported to Sentry
 * Expected validation errors should not be reported
 */
function shouldReportError(error: unknown): boolean {
  if (error instanceof Error) {
    // Don't report expected validation errors
    const expectedErrors = ['Slug already exists', 'Invalid workspace name']
    return !expectedErrors.some((msg) => error.message.includes(msg))
  }
  return true // Report unknown error types
}

/**
 * Create workspace mutation (dedicated hook with full business logic)
 *
 * Admin-only operation. Follows "mutations via dedicated hooks" pattern.
 * Mutation logic is directly in the hook, not in a separate service function.
 *
 * Uses Firestore client SDK transaction to enforce slug uniqueness atomically.
 * Security enforced via Firestore rules (admin-only writes with data validation).
 * Timestamps use serverTimestamp() for accuracy (server-side time, not client clock).
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

      // Check slug uniqueness before transaction
      const slugQuery = query(
        workspacesRef,
        where('slug', '==', slug),
        where('status', '==', 'active'),
        limit(1),
      )

      const existingDocs = await getDocs(slugQuery)

      if (!existingDocs.empty) {
        throw new Error('Slug already exists')
      }

      // Create workspace in transaction
      return await runTransaction(firestore, (transaction) => {
        const newWorkspaceRef = doc(workspacesRef)

        const workspaceData: WithFieldValue<Workspace> = {
          id: newWorkspaceRef.id,
          name: validated.name,
          slug,
          status: 'active' as WorkspaceStatus,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        transaction.set(newWorkspaceRef, workspaceData)

        return Promise.resolve({ id: newWorkspaceRef.id, slug })
      })
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => {
      // Report unexpected errors to Sentry (skip validation errors)
      if (shouldReportError(error)) {
        Sentry.captureException(error, {
          tags: {
            domain: 'admin/workspace',
            action: 'create-workspace',
          },
          extra: {
            errorType: 'workspace-creation-failure',
          },
        })
      }
      // Error available in mutation.error for UI display
    },
  })
}
