import { Outlet, createFileRoute } from '@tanstack/react-router'
import type { TabItem } from '@/domains/navigation'
import { useWorkspace } from '@/domains/workspace'
import { NavTabs } from '@/domains/navigation'

const settingsTabs: TabItem[] = [
  {
    id: 'general',
    label: 'General',
    to: '/workspace/$workspaceSlug/settings/general',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    to: '/workspace/$workspaceSlug/settings/integrations',
  },
]

/**
 * Workspace settings layout route
 *
 * Route: /workspace/:workspaceSlug/settings
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout with page header, NavTabs (General, Integrations), and Outlet for child content.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
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
          Manage your workspace configuration
        </p>
      </div>
      <div className="border-b mb-6">
        <NavTabs tabs={settingsTabs} />
      </div>
      <Outlet />
    </div>
  )
}
