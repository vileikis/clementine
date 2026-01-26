import { createFileRoute } from '@tanstack/react-router'

import { AIPresetsPage } from '@/domains/ai-presets'
import { useWorkspace } from '@/domains/workspace'

/**
 * AI Presets list page route
 *
 * Route: /workspace/:workspaceSlug/ai-presets (exact match)
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Lists all active AI presets in the workspace.
 * Workspace context is maintained via parent route.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/ai-presets/')({
  component: AIPresetsPageRoute,
})

function AIPresetsPageRoute() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  return (
    <AIPresetsPage
      workspaceId={workspace?.id || ''}
      workspaceSlug={workspaceSlug}
    />
  )
}
