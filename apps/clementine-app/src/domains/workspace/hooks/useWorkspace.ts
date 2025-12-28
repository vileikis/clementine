import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { workspaceSchema } from '../schemas/workspace.schemas'
import { firestore } from '@/integrations/firebase/client'

/**
 * Fetch a single workspace by slug
 *
 * This hook is workspace-scoped (used when viewing/editing a specific workspace).
 * For admin operations (list all, create, delete), use hooks from domains/admin/workspace/.
 *
 * @param slug - Workspace slug (case-insensitive)
 * @returns Workspace data or undefined if not found
 */
export function useWorkspace(slug: string | undefined) {
  return useQuery({
    queryKey: ['workspace', slug?.toLowerCase()],
    queryFn: async () => {
      if (!slug) {
        return null
      }

      const workspacesRef = collection(firestore, 'workspaces')
      const q = query(
        workspacesRef,
        where('slug', '==', slug.toLowerCase()),
        where('status', '==', 'active'),
        limit(1),
      )

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return null
      }

      // Runtime validation using Zod schema
      // Validates all required fields and enforces business rules
      return workspaceSchema.parse(snapshot.docs[0].data())
    },
    enabled: !!slug, // Only run query if slug is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}
