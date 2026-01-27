/**
 * ExperienceSlotItem Component
 *
 * Simplified experience item card for slot manager.
 * Shows image, name, enabled toggle, and context menu.
 * Clicking the card opens the details sheet.
 */
import { ExternalLink, MoreVertical, Trash2 } from 'lucide-react'
import type { Experience } from '@/domains/experience/shared'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import { Switch } from '@/ui-kit/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils/style-utils'

export interface ExperienceSlotItemProps {
  /** Experience reference data */
  reference: ExperienceReference | MainExperienceReference

  /** Full experience data (fetched separately) */
  experience: Experience | null

  /** Workspace slug for edit link */
  workspaceSlug: string

  /** Callback when enabled state changes */
  onToggleEnabled: (enabled: boolean) => void

  /** Callback when card is clicked (opens details sheet) */
  onClick: () => void

  /** Callback when item is removed */
  onRemove: () => void

  /** Optional drag handle element (rendered by parent for list mode) */
  dragHandle?: React.ReactNode
}

/**
 * Simplified slot item component for displaying connected experiences
 *
 * Features:
 * - Thumbnail and name
 * - Enable toggle (no label)
 * - Context menu with edit and remove actions
 * - Clickable card to open details sheet
 * - Optional drag handle slot
 * - Missing experience placeholder
 *
 * @example
 * ```tsx
 * <ExperienceSlotItem
 *   reference={reference}
 *   experience={experience}
 *   workspaceSlug={workspaceSlug}
 *   onToggleEnabled={(enabled) => updateReference({ enabled })}
 *   onClick={() => setDetailsOpen(true)}
 *   onRemove={() => removeFromSlot(reference.experienceId)}
 *   dragHandle={<DragHandle />}
 * />
 * ```
 */
export function ExperienceSlotItem({
  reference,
  experience,
  workspaceSlug,
  onToggleEnabled,
  onClick,
  onRemove,
  dragHandle,
}: ExperienceSlotItemProps) {
  // Handle missing experience (deleted from workspace)
  if (!experience) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
        {dragHandle}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            Missing Experience
          </p>
          <p className="text-xs text-muted-foreground">
            This experience was deleted from the workspace
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="gap-2 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
    )
  }

  const handleEdit = () => {
    window.open(
      `/workspace/${workspaceSlug}/experiences/${reference.experienceId}`,
      '_blank',
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Drag Handle (provided by parent) */}
      {dragHandle}

      {/* Clickable Card Content */}
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden bg-muted">
          {experience.media?.url ? (
            <img
              src={experience.media.url}
              alt={experience.name}
              className={cn('w-full h-full object-cover', {
                'opacity-50': !reference.enabled,
              })}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-[10px]">No img</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3
          className={cn('font-medium text-sm truncate flex-1', {
            'text-muted-foreground': !reference.enabled,
          })}
        >
          {experience.name}
        </h3>
      </button>

      {/* Enable Toggle (no label) */}
      <Switch
        checked={reference.enabled}
        onCheckedChange={onToggleEnabled}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Enable ${experience.name}`}
      />

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Edit in new tab
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onRemove}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
