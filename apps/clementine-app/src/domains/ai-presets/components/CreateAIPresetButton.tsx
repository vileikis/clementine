/**
 * CreateAIPresetButton Component
 *
 * Button to create new AI presets with default name "Untitled preset".
 * Only visible to admin users.
 */
'use client'

import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateAIPreset } from '../hooks/useCreateAIPreset'
import { Button } from '@/ui-kit/ui/button'

export interface CreateAIPresetButtonProps {
  /** Workspace ID */
  workspaceId: string

  /** Optional callback after preset creation */
  onPresetCreated?: (presetId: string) => void
}

/**
 * CreateAIPresetButton component
 *
 * Button to create a new AI preset with default name "Untitled preset".
 * Mobile-optimized with 44x44px minimum touch target.
 *
 * @example
 * ```tsx
 * <CreateAIPresetButton
 *   workspaceId={workspaceId}
 *   onPresetCreated={(presetId) => navigate(`/ai-presets/${presetId}`)}
 * />
 * ```
 */
export function CreateAIPresetButton({
  workspaceId,
  onPresetCreated,
}: CreateAIPresetButtonProps) {
  const createPreset = useCreateAIPreset(workspaceId)

  const handleCreate = async () => {
    try {
      const result = await createPreset.mutateAsync({})

      toast.success('AI Preset created', {
        description: 'Your new preset is ready to configure.',
      })

      // Call optional callback with new preset ID
      if (onPresetCreated) {
        onPresetCreated(result.presetId)
      }
    } catch (error) {
      toast.error('Failed to create preset', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={createPreset.isPending}
      className="min-h-[44px] min-w-[44px]"
      aria-label="Create new AI preset"
    >
      <Plus className="mr-2 h-4 w-4" />
      {createPreset.isPending ? 'Creating...' : 'Create Preset'}
    </Button>
  )
}
