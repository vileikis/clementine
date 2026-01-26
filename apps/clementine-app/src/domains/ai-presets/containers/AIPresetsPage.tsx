/**
 * AIPresetsPage Container
 *
 * Main container for the AI presets list page.
 * Displays list of presets with loading states and header.
 */
import { useNavigate } from '@tanstack/react-router'
import { AIPresetsList } from '../components/AIPresetsList'
import { CreateAIPresetButton } from '../components/CreateAIPresetButton'
import { useWorkspaceAIPresets } from '../hooks/useWorkspaceAIPresets'
import { Skeleton } from '@/ui-kit/ui/skeleton'

interface AIPresetsPageProps {
  /** Workspace ID for data fetching */
  workspaceId: string
  /** Workspace slug for navigation */
  workspaceSlug: string
}

/**
 * AI Presets page container
 *
 * Features:
 * - Lists all active AI presets
 * - Loading skeleton state
 * - Empty state with guidance
 * - Header with page title and create button
 * - Navigates to editor on preset creation
 *
 * @example
 * ```tsx
 * <AIPresetsPage workspaceId="abc123" workspaceSlug="my-workspace" />
 * ```
 */
export function AIPresetsPage({
  workspaceId,
  workspaceSlug,
}: AIPresetsPageProps) {
  const navigate = useNavigate()

  // Fetch presets with real-time updates
  const { data: presets, isLoading } = useWorkspaceAIPresets(workspaceId)

  const handlePresetCreated = (presetId: string) => {
    navigate({
      to: '/workspace/$workspaceSlug/ai-presets/$presetId',
      params: { workspaceSlug, presetId },
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Presets</h1>
        <CreateAIPresetButton
          workspaceId={workspaceId}
          onPresetCreated={handlePresetCreated}
        />
      </div>

      {/* Presets list */}
      <AIPresetsList
        presets={presets || []}
        workspaceId={workspaceId}
        isLoading={isLoading}
      />
    </div>
  )
}
