import { Outlet, createFileRoute } from '@tanstack/react-router'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import { useWorkspaceStore } from '@/domains/workspace'
import { NotFound } from '@/shared/components/NotFound'
import type { Workspace } from '@/domains/workspace'

/**
 * Workspace layout route
 *
 * Route: /workspace/:workspaceSlug
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout route that renders child routes (projects, settings, etc.)
 * Resolves workspace by slug and stores last visited workspace for session persistence
 */
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: async ({ params }) => {
    const { workspaceSlug } = params

    // Resolve workspace by slug
    const q = query(
      collection(firestore, 'workspaces'),
      where('slug', '==', workspaceSlug),
      where('status', '==', 'active'),
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Workspace not found - will trigger notFoundComponent
      return { workspace: null }
    }

    const doc = snapshot.docs[0]
    const workspace: Workspace = {
      id: doc.id,
      ...(doc.data() as Omit<Workspace, 'id'>),
    }

    // Store last visited workspace for session persistence
    useWorkspaceStore.getState().setLastVisitedWorkspaceSlug(workspaceSlug)

    return { workspace }
  },
  component: WorkspaceLayout,
  notFoundComponent: WorkspaceNotFound,
})

function WorkspaceLayout() {
  return <Outlet />
}

function WorkspaceNotFound() {
  return (
    <NotFound
      title="Workspace Not Found"
      message="The workspace you're looking for doesn't exist or has been deleted."
      actionLabel="View All Workspaces"
      actionHref="/admin/workspaces"
    />
  )
}
