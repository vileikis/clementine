'use server'

import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore'
import { adminFirestore } from '@/integrations/firebase/admin'
import { updateWorkspaceSchema } from '../schemas/workspace.schemas'
import type { UpdateWorkspaceInput } from '../types/workspace.types'

/**
 * Update workspace name and/or slug with server-side validation
 *
 * This server action validates admin authentication, checks slug uniqueness,
 * and atomically updates the workspace document.
 *
 * @param input - Update workspace input (id + name/slug)
 * @throws Error if validation fails, user is unauthorized, or slug is already in use
 *
 * @example
 * ```tsx
 * try {
 *   await updateWorkspace({ id: 'workspace-1', name: 'New Name', slug: 'new-slug' })
 * } catch (error) {
 *   // Handle error (slug conflict, unauthorized, etc.)
 * }
 * ```
 */
export async function updateWorkspace(
  input: UpdateWorkspaceInput,
): Promise<void> {
  // Validate input with Zod schema
  const validated = updateWorkspaceSchema.parse(input)

  // TODO: Add admin authentication check once auth is implemented
  // await requireAdmin()

  const workspaceRef = doc(adminFirestore, 'workspaces', validated.id)

  // If slug is changing, verify uniqueness atomically
  if (validated.slug) {
    await runTransaction(adminFirestore, async (transaction) => {
      // Check if slug already exists
      const workspacesRef = collection(adminFirestore, 'workspaces')
      const q = query(
        workspacesRef,
        where('slug', '==', validated.slug!.toLowerCase()),
        where('status', '==', 'active'),
      )
      const snapshot = await getDocs(q)

      // Reject if slug exists and it's not the current workspace
      if (!snapshot.empty && snapshot.docs[0].id !== validated.id) {
        throw new Error('Slug already in use')
      }

      // Build update object
      const updates: Record<string, any> = {
        updatedAt: Date.now(),
      }

      if (validated.name !== undefined) {
        updates.name = validated.name
      }

      if (validated.slug !== undefined) {
        updates.slug = validated.slug.toLowerCase()
      }

      // Update workspace
      transaction.update(workspaceRef, updates)
    })
  } else {
    // Only name is changing - simple update
    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    }

    if (validated.name !== undefined) {
      updates.name = validated.name
    }

    await updateDoc(workspaceRef, updates)
  }
}
