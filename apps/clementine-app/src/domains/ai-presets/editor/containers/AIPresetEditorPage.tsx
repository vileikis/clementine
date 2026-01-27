/**
 * AIPresetEditorPage Container
 *
 * Main page container for the AI preset editor.
 * Handles preset data fetching and renders the editor layout.
 */
import { Loader2 } from 'lucide-react'

import { useAIPreset } from '../hooks/useAIPreset'
import { AIPresetEditorLayout } from './AIPresetEditorLayout'

interface AIPresetEditorPageProps {
  workspaceId: string
  workspaceSlug: string
  presetId: string
}

/**
 * AI preset editor page with data fetching
 *
 * Features:
 * - Real-time preset subscription via useAIPreset
 * - Loading and error states
 * - Renders AIPresetEditorLayout when data is ready
 *
 * @example
 * ```tsx
 * function PresetRoute() {
 *   const { workspaceSlug, presetId } = Route.useParams()
 *   const { data: workspace } = useWorkspace(workspaceSlug)
 *
 *   return (
 *     <AIPresetEditorPage
 *       workspaceId={workspace?.id || ''}
 *       workspaceSlug={workspaceSlug}
 *       presetId={presetId}
 *     />
 *   )
 * }
 * ```
 */
export function AIPresetEditorPage({
  workspaceId,
  workspaceSlug,
  presetId,
}: AIPresetEditorPageProps) {
  const { data: preset, isLoading, error } = useAIPreset(workspaceId, presetId)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load preset</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  // Not found state
  if (!preset) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Preset not found</p>
        <p className="text-sm text-muted-foreground">
          The preset may have been deleted or you don&apos;t have access.
        </p>
      </div>
    )
  }

  return (
    <AIPresetEditorLayout
      preset={preset}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
    />
  )
}
