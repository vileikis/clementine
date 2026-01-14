/**
 * ExperienceDetailsSheet Component
 *
 * Sheet for viewing and editing experience settings within a slot.
 * Shows full controls: enabled toggle, overlay toggle, edit, remove.
 */
import { ExternalLink, Trash2 } from 'lucide-react'
import type { Experience } from '@/domains/experience/shared'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import type { SlotType } from '../constants'
import { ProfileBadge } from '@/domains/experience/library/components/ProfileBadge'
import { Switch } from '@/ui-kit/ui/switch'
import { Label } from '@/ui-kit/ui/label'
import { Button } from '@/ui-kit/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui-kit/ui/sheet'

export interface ExperienceDetailsSheetProps {
  /** Controlled open state */
  open: boolean

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void

  /** Experience reference data */
  reference: ExperienceReference | MainExperienceReference

  /** Full experience data */
  experience: Experience

  /** Slot type - controls which toggles are shown */
  slot: SlotType

  /** Workspace slug for edit link */
  workspaceSlug: string

  /** Callback when enabled state changes */
  onToggleEnabled: (enabled: boolean) => void

  /** Callback when overlay state changes (main slot only) */
  onToggleOverlay?: (applyOverlay: boolean) => void

  /** Callback when item is removed */
  onRemove: () => void
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
 * Sheet component for viewing and editing experience settings
 *
 * Features:
 * - Experience preview (image, name, profile)
 * - Enable toggle with label
 * - Overlay toggle (main slot only)
 * - Edit in new tab button
 * - Remove button
 *
 * @example
 * ```tsx
 * <ExperienceDetailsSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   reference={reference}
 *   experience={experience}
 *   slot="main"
 *   workspaceSlug={workspaceSlug}
 *   onToggleEnabled={(enabled) => updateReference({ enabled })}
 *   onToggleOverlay={(applyOverlay) => updateReference({ applyOverlay })}
 *   onRemove={() => removeFromSlot(reference.experienceId)}
 * />
 * ```
 */
export function ExperienceDetailsSheet({
  open,
  onOpenChange,
  reference,
  experience,
  slot,
  workspaceSlug,
  onToggleEnabled,
  onToggleOverlay,
  onRemove,
}: ExperienceDetailsSheetProps) {
  const isMainSlot = slot === 'main'
  const showOverlayToggle = isMainSlot && isMainReference(reference)

  const handleEdit = () => {
    window.open(
      `/workspace/${workspaceSlug}/experiences/${reference.experienceId}`,
      '_blank',
    )
  }

  const handleRemove = () => {
    onRemove()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Experience Settings</SheetTitle>
          <SheetDescription>
            Configure how this experience behaves in your event
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6">
          {/* Experience Preview */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
              {experience.media?.url ? (
                <img
                  src={experience.media.url}
                  alt={experience.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base truncate">
                {experience.name}
              </h3>
              <div className="mt-1">
                <ProfileBadge profile={experience.profile} />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Settings
            </h4>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="experience-enabled">Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Show this experience to guests
                </p>
              </div>
              <Switch
                id="experience-enabled"
                checked={reference.enabled}
                onCheckedChange={onToggleEnabled}
              />
            </div>

            {/* Overlay Toggle (main slot only) */}
            {showOverlayToggle && (
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="experience-overlay">Apply Overlay</Label>
                  <p className="text-xs text-muted-foreground">
                    Apply event overlay to generated images
                  </p>
                </div>
                <Switch
                  id="experience-overlay"
                  checked={reference.applyOverlay}
                  onCheckedChange={onToggleOverlay}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="w-full gap-2 justify-center"
            >
              <ExternalLink className="h-4 w-4" />
              Edit Experience
            </Button>
            <Button
              variant="outline"
              onClick={handleRemove}
              className="w-full gap-2 justify-center text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove from Event
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
