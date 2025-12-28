import { WorkspaceList } from '../components/WorkspaceList'

/**
 * Workspaces page container
 *
 * Main page for admin workspace management. Displays list of all active workspaces
 * with real-time updates.
 *
 * Features:
 * - View all active workspaces
 * - Create new workspace (links to /admin/workspaces/create)
 * - Click workspace to navigate to /workspace/[slug]
 * - Delete workspace with confirmation
 * - Real-time updates when workspaces are created/deleted
 */
export function WorkspacesPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground">
          Manage your organization's workspaces
        </p>
      </div>
      <WorkspaceList />
    </div>
  )
}
