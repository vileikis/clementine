import { createFileRoute } from '@tanstack/react-router'

import { AIPresetEditorPage } from '@/domains/ai-presets/editor'
import { useWorkspace } from '@/domains/workspace'

/**
 * AI Preset editor page route
 *
 * Route: /workspace/:workspaceSlug/ai-presets/:presetId
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Renders the AI preset editor for configuring preset settings,
 * media registry, variables, and prompt template.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/ai-presets/$presetId',
)({
  component: AIPresetEditorRoute,
})

function AIPresetEditorRoute() {
  const { workspaceSlug, presetId } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  // Wait for valid workspace before rendering
  if (!workspace || !workspace.id) {
    return null
  }

  return (
    <AIPresetEditorPage
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      presetId={presetId}
    />
  )
}
