import { createFileRoute } from '@tanstack/react-router'

/**
 * AI Preset editor page route (placeholder)
 *
 * Route: /workspace/:workspaceSlug/ai-presets/:presetId
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Placeholder route for the AI preset editor. Full editor will be
 * implemented in Phase 3 of the AI Presets feature.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/ai-presets/$presetId',
)({
  component: AIPresetEditorPlaceholder,
})

function AIPresetEditorPlaceholder() {
  const { presetId } = Route.useParams()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">AI Preset Editor</h1>
      <p className="text-muted-foreground mt-2">
        Editor for preset{' '}
        <code className="bg-muted px-1 rounded">{presetId}</code> coming in
        Phase 3
      </p>
    </div>
  )
}
