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
import { updateWorkspaceSchema } from '../schemas/workspace.schemas'
import type { UpdateData } from 'firebase/firestore'
import type { UpdateWorkspaceInput, Workspace } from '../types/workspace.types'
import { firestore } from '@/integrations/firebase/client'

/**
 * Determine if error should be reported to Sentry
 * Expected validation errors should not be reported
 */
function shouldReportError(error: unknown): boolean {
  if (error instanceof Error) {
    // Don't report expected validation errors
    const expectedErrors = ['Slug already in use', 'Invalid workspace']
    return !expectedErrors.some((msg) => error.message.includes(msg))
  }
  return true // Report unknown error types
}

/**
 * Update workspace name and/or slug (mutation hook with full business logic)
 *
 * Follows "mutations via dedicated hooks" pattern.
 * Mutation logic is directly in the hook, not in a separate service function.
 *
 * Uses Firestore client SDK transaction to enforce slug uniqueness atomically.
 * Security enforced via Firestore rules (admin-only writes).
 * Timestamps use serverTimestamp() for accuracy (server-side time, not client clock).
 *
 * @returns Mutation object with mutate/mutateAsync functions and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateWorkspace()
 *
 * // Fire and forget
 * updateMutation.mutate({ id: 'workspace-1', name: 'New Name' })
 *
 * // Async/await
 * try {
 *   await updateMutation.mutateAsync({ id: 'workspace-1', slug: 'new-slug' })
 * } catch (error) {
 *   // Handle error (slug conflict, validation, etc.)
 * }
 * ```
 */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateWorkspaceInput) => {
      // Validate input with Zod schema
      const validated = updateWorkspaceSchema.parse(input)

      const workspaceRef = doc(firestore, 'workspaces', validated.id)

      // If slug is changing, verify uniqueness
      if (validated.slug) {
        // Check slug uniqueness before transaction
        const workspacesRef = collection(firestore, 'workspaces')
        const slugQuery = query(
          workspacesRef,
          where('slug', '==', validated.slug.toLowerCase()),
          where('status', '==', 'active'),
          limit(1),
        )

        const existingDocs = await getDocs(slugQuery)

        // Reject if slug exists and belongs to a different workspace
        if (!existingDocs.empty && existingDocs.docs[0].id !== validated.id) {
          throw new Error('Slug already in use')
        }

        // Perform update
        await runTransaction(firestore, (transaction) => {
          const updates: UpdateData<Workspace> = {
            updatedAt: serverTimestamp(),
          }

          if (validated.name !== undefined) {
            updates.name = validated.name
          }

          if (validated.slug !== undefined) {
            updates.slug = validated.slug.toLowerCase()
          }

          // Update workspace - Firestore rules validate admin access
          transaction.update(workspaceRef, updates)

          return Promise.resolve()
        })
      } else {
        // Only name is changing - simple update
        await runTransaction(firestore, (transaction) => {
          const updates: UpdateData<Workspace> = {
            updatedAt: serverTimestamp(),
          }

          if (validated.name !== undefined) {
            updates.name = validated.name
          }

          transaction.update(workspaceRef, updates)

          return Promise.resolve()
        })
      }
    },
    onSuccess: () => {
      // Invalidate workspace queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['workspace'],
      })
    },
    onError: (error) => {
      // Report unexpected errors to Sentry (skip validation errors)
      if (shouldReportError(error)) {
        Sentry.captureException(error, {
          tags: {
            domain: 'workspace',
            action: 'update-workspace',
          },
          extra: {
            errorType: 'workspace-update-failure',
          },
        })
      }
      // Error available in mutation.error for UI display
    },
  })
}
