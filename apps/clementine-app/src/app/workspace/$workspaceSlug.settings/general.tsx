import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceSettingsForm, useWorkspace } from '@/domains/workspace'

/**
 * General settings tab
 *
 * Route: /workspace/:workspaceSlug/settings/general
 * Renders the workspace name/slug form.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/settings/general',
)({
  component: GeneralTab,
})

function GeneralTab() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  if (!workspace) {
    return null
  }

  return <WorkspaceSettingsForm workspace={workspace} />
}
