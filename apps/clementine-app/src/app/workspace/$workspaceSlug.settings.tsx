import { createFileRoute } from '@tanstack/react-router'
import { useWorkspace } from '@/domains/workspace'
import { WorkspaceSettingsForm } from '@/domains/workspace/components/WorkspaceSettingsForm'

/**
 * Workspace settings page route
 *
 * Route: /workspace/:workspaceSlug/settings
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Allows admins to edit workspace name and slug.
 * Automatically redirects to new URL if slug is changed.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceSlug)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  if (isError || !workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Failed to load workspace</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace name and URL
        </p>
      </div>
      <WorkspaceSettingsForm workspace={workspace} />
    </div>
  )
}
