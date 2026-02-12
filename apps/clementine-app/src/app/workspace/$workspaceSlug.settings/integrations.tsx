import { createFileRoute } from '@tanstack/react-router'
import { useWorkspace } from '@/domains/workspace'
import { IntegrationsPage } from '@/domains/workspace/integrations'

/**
 * Integrations settings tab
 *
 * Route: /workspace/:workspaceSlug/settings/integrations
 * Renders workspace-level integration management (Dropbox).
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/settings/integrations',
)({
  component: IntegrationsTab,
})

function IntegrationsTab() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  if (!workspace) {
    return null
  }

  return (
    <IntegrationsPage workspace={workspace} workspaceSlug={workspaceSlug} />
  )
}
