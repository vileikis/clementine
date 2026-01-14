/**
 * ExperienceSlotItem Component
 *
 * Individual experience item within a slot manager.
 * Features drag handle, toggles, and context menu with edit/remove actions.
 */
import { ExternalLink, GripVertical, MoreVertical, Trash2 } from 'lucide-react'
import type { Experience } from '@/domains/experience/shared'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import type { SlotType } from '../constants'
import { ProfileBadge } from '@/domains/experience/library/components/ProfileBadge'
import { Switch } from '@/ui-kit/ui/switch'
import { Label } from '@/ui-kit/ui/label'
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

  /** Slot type - controls which toggles are shown */
  slot: SlotType

  /** Whether in list mode (shows drag handle) */
  isListMode: boolean

  /** Workspace slug for edit link */
  workspaceSlug: string

  /** Callback when enabled state changes */
  onToggleEnabled: (enabled: boolean) => void

  /** Callback when overlay state changes (main slot only) */
  onToggleOverlay?: (applyOverlay: boolean) => void

  /** Callback when item is removed */
  onRemove: () => void

  /** Callback for opening edit in new tab */
  onEdit: () => void
}

/**
 * Check if reference is MainExperienceReference
 */
function isMainReference(
  ref: ExperienceReference | MainExperienceReference,
): ref is MainExperienceReference {
  return 'applyOverlay' in ref
}

/**
 * Slot item component for managing experience connections
 *
 * Features:
 * - Drag handle (list mode only)
 * - Thumbnail, name, profile badge
 * - Enable toggle
 * - Overlay toggle (main slot only)
 * - Context menu with edit and remove actions
 * - Missing experience placeholder
 *
 * @example
 * ```tsx
 * <ExperienceSlotItem
 *   reference={reference}
 *   experience={experience}
 *   slot="main"
 *   isListMode={true}
 *   workspaceSlug={workspaceSlug}
 *   onToggleEnabled={(enabled) => updateReference({ enabled })}
 *   onToggleOverlay={(applyOverlay) => updateReference({ applyOverlay })}
 *   onRemove={() => removeFromSlot(reference.experienceId)}
 *   onEdit={() => openEditor(reference.experienceId)}
 * />
 * ```
 */
export function ExperienceSlotItem({
  reference,
  experience,
  slot,
  isListMode,
  workspaceSlug,
  onToggleEnabled,
  onToggleOverlay,
  onRemove,
  onEdit,
}: ExperienceSlotItemProps) {
  // Handle missing experience (deleted from workspace)
  if (!experience) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
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

  const isMainSlot = slot === 'main'
  const showOverlayToggle = isMainSlot && isMainReference(reference)

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {/* Drag Handle (list mode only) */}
      {isListMode && (
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
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
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3
            className={cn('font-medium text-sm truncate flex-1', {
              'text-muted-foreground': !reference.enabled,
            })}
          >
            {experience.name}
          </h3>
        </div>
        <ProfileBadge profile={experience.profile} />
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        {/* Enable Toggle */}
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`enabled-${reference.experienceId}`}
            className="text-xs"
          >
            Enabled
          </Label>
          <Switch
            id={`enabled-${reference.experienceId}`}
            checked={reference.enabled}
            onCheckedChange={onToggleEnabled}
          />
        </div>

        {/* Overlay Toggle (main slot only) */}
        {showOverlayToggle && (
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`overlay-${reference.experienceId}`}
              className="text-xs"
            >
              Overlay
            </Label>
            <Switch
              id={`overlay-${reference.experienceId}`}
              checked={reference.applyOverlay}
              onCheckedChange={onToggleOverlay}
            />
          </div>
        )}
      </div>

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit} className="gap-2">
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
