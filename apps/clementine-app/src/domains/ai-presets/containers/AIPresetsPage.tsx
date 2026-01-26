/**
 * AIPresetsPage Container
 *
 * Main container for the AI presets list page.
 * Displays list of presets with loading states and header.
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AIPresetsList } from '../components/AIPresetsList'
import { CreateAIPresetButton } from '../components/CreateAIPresetButton'
import { RenameAIPresetDialog } from '../components/RenameAIPresetDialog'
import { DeleteAIPresetDialog } from '../components/DeleteAIPresetDialog'
import { useWorkspaceAIPresets } from '../hooks/useWorkspaceAIPresets'
import { useDuplicateAIPreset } from '../hooks/useDuplicateAIPreset'
import type { AIPreset } from '@clementine/shared'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/ui-kit/ui/dropdown-menu'

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
 * - Context menu with duplicate action
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

  // Dialog state
  const [renamePreset, setRenamePreset] = useState<AIPreset | null>(null)
  const [deletePreset, setDeletePreset] = useState<AIPreset | null>(null)

  // Fetch presets with real-time updates
  const { data: presets, isLoading } = useWorkspaceAIPresets(workspaceId)

  // Mutations
  const duplicatePreset = useDuplicateAIPreset(workspaceId)

  const handlePresetCreated = (presetId: string) => {
    navigate({
      to: '/workspace/$workspaceSlug/ai-presets/$presetId',
      params: { workspaceSlug, presetId },
    })
  }

  const handleDuplicate = async (preset: AIPreset) => {
    try {
      await duplicatePreset.mutateAsync({ presetId: preset.id })
      toast.success('Preset duplicated', {
        description: `Created "Copy of ${preset.name}"`,
      })
    } catch (error) {
      toast.error('Failed to duplicate preset', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  // Render context menu items for each preset
  const renderMenuItems = (preset: AIPreset) => (
    <>
      <DropdownMenuItem
        onClick={() => setRenamePreset(preset)}
        className="min-h-[44px] cursor-pointer"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleDuplicate(preset)}
        className="min-h-[44px] cursor-pointer"
      >
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => setDeletePreset(preset)}
        className="text-destructive focus:text-destructive min-h-[44px] cursor-pointer"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </>
  )

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
        isLoading={isLoading}
        renderMenuItems={renderMenuItems}
      />

      {/* Rename dialog */}
      {renamePreset && (
        <RenameAIPresetDialog
          presetId={renamePreset.id}
          workspaceId={workspaceId}
          initialName={renamePreset.name}
          open={!!renamePreset}
          onOpenChange={(open) => !open && setRenamePreset(null)}
        />
      )}

      {/* Delete dialog */}
      {deletePreset && (
        <DeleteAIPresetDialog
          presetId={deletePreset.id}
          workspaceId={workspaceId}
          presetName={deletePreset.name}
          open={!!deletePreset}
          onOpenChange={(open) => !open && setDeletePreset(null)}
        />
      )}
    </div>
  )
}
