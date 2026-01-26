/**
 * AIPresetsList Component
 *
 * Displays list of AI presets with loading and empty states.
 */
import { AIPresetItem } from './AIPresetItem'
import type { AIPreset } from '@clementine/shared'
import { Skeleton } from '@/ui-kit/ui/skeleton'

export interface AIPresetsListProps {
  /** List of AI presets to display */
  presets: AIPreset[]

  /** Loading state */
  isLoading?: boolean

  /** Render function for dropdown menu items per preset */
  renderMenuItems?: (preset: AIPreset) => React.ReactNode
}

/**
 * AIPresetsList component
 *
 * Displays all active AI presets in a list with loading and empty states.
 *
 * @example
 * ```tsx
 * <AIPresetsList
 *   presets={presets}
 *   isLoading={isLoading}
 *   renderMenuItems={(preset) => (
 *     <>
 *       <DropdownMenuItem>Rename</DropdownMenuItem>
 *       <DropdownMenuItem>Delete</DropdownMenuItem>
 *     </>
 *   )}
 * />
 * ```
 */
export function AIPresetsList({
  presets,
  isLoading = false,
  renderMenuItems,
}: AIPresetsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // Empty state
  if (!presets || presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">No AI Presets yet</h3>
          <p className="text-muted-foreground">
            Create your first AI preset to start configuring reusable AI image
            generation settings.
          </p>
        </div>
      </div>
    )
  }

  // Presets list
  return (
    <div className="space-y-2">
      {presets.map((preset) => (
        <AIPresetItem
          key={preset.id}
          preset={preset}
          renderMenuItems={
            renderMenuItems ? () => renderMenuItems(preset) : undefined
          }
        />
      ))}
    </div>
  )
}
