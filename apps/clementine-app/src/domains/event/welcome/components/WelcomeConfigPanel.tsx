/**
 * WelcomeConfigPanel Component
 *
 * Left panel control interface for customizing welcome screen properties.
 * Organized into sections: Content (title, description, media), Experiences (layout).
 */

import { Info, LayoutGrid, LayoutList } from 'lucide-react'
import {
  WELCOME_DESCRIPTION_MAX_LENGTH,
  WELCOME_TITLE_MAX_LENGTH,
} from '../constants'
import type { ExperiencePickerLayout } from '../schemas'
import type { WelcomeConfig } from '@/domains/event/shared'
import type { EditorOption } from '@/shared/editor-controls'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '@/domains/event/experiences'
import {
  EditorSection,
  MediaPickerField,
  TextField,
  TextareaField,
  ToggleGroupField,
} from '@/shared/editor-controls'
import { ExperienceSlotManager } from '@/domains/event/experiences'
import { Alert, AlertDescription } from '@/ui-kit/ui/alert'

export interface WelcomeConfigPanelProps {
  /** Current welcome values */
  welcome: WelcomeConfig
  /** Callback when a welcome field is updated */
  onUpdate: (updates: Partial<WelcomeConfig>) => void
  /** Callback when a hero media file is selected for upload */
  onUploadHeroMedia: (file: File) => void
  /** Whether controls are disabled (e.g., during save) */
  disabled?: boolean
  /** Whether a hero media upload is in progress */
  uploadingHeroMedia?: boolean
  /** Hero media upload progress (0-100) */
  uploadProgress?: number
  /** Workspace ID for fetching experiences */
  workspaceId: string
  /** Workspace slug for experience links */
  workspaceSlug: string
  /** Main experiences array */
  mainExperiences: MainExperienceReference[]
  /** All assigned experience IDs across all slots */
  assignedExperienceIds: string[]
  /** Callback when main experiences are updated */
  onUpdateMainExperiences: (experiences: MainExperienceReference[]) => void
  /** Pregate experience (optional, for info callout) */
  pregateExperience?: ExperienceReference | null
  /** Preshare experience (optional, for info callout) */
  preshareExperience?: ExperienceReference | null
}

// Layout options for experience picker
const LAYOUT_OPTIONS: EditorOption<ExperiencePickerLayout>[] = [
  { value: 'list', label: 'List', icon: <LayoutList className="size-4" /> },
  { value: 'grid', label: 'Grid', icon: <LayoutGrid className="size-4" /> },
]

export function WelcomeConfigPanel({
  welcome,
  onUpdate,
  onUploadHeroMedia,
  disabled = false,
  uploadingHeroMedia = false,
  uploadProgress,
  workspaceId,
  workspaceSlug,
  mainExperiences,
  assignedExperienceIds,
  onUpdateMainExperiences,
  pregateExperience,
  preshareExperience,
}: WelcomeConfigPanelProps) {
  // Check if pregate or preshare is configured
  const hasGuestFlowExperiences = Boolean(
    pregateExperience || preshareExperience,
  )
  return (
    <div className="space-y-0">
      {/* Content Section - title, description, hero media */}
      <EditorSection title="Content">
        <TextField
          label="Title"
          value={welcome.title}
          onChange={(value) => onUpdate({ title: value })}
          placeholder="Enter welcome title"
          maxLength={WELCOME_TITLE_MAX_LENGTH}
          disabled={disabled}
        />
        <TextareaField
          label="Description"
          value={welcome.description}
          onChange={(value) => onUpdate({ description: value })}
          placeholder="Optional description"
          maxLength={WELCOME_DESCRIPTION_MAX_LENGTH}
          rows={3}
          disabled={disabled}
        />
        <MediaPickerField
          label="Hero Image"
          value={welcome.media?.url ?? null}
          onChange={(value) =>
            // When removing, set to null; MediaPickerField doesn't handle creating new MediaReference
            onUpdate({
              media: value === null ? null : welcome.media,
            })
          }
          onUpload={onUploadHeroMedia}
          accept="image/*"
          removable
          uploading={uploadingHeroMedia}
          uploadProgress={uploadProgress}
          disabled={disabled}
        />
      </EditorSection>

      {/* Experiences Section - layout and experience list */}
      <EditorSection title="Experiences">
        {/* Info callout when pregate or preshare is configured */}
        {hasGuestFlowExperiences && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {pregateExperience && preshareExperience ? (
                <>
                  Pregate and preshare experiences are configured in{' '}
                  <span className="font-medium">Settings</span>.
                </>
              ) : pregateExperience ? (
                <>
                  A pregate experience is configured in{' '}
                  <span className="font-medium">Settings</span>.
                </>
              ) : (
                <>
                  A preshare experience is configured in{' '}
                  <span className="font-medium">Settings</span>.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <ToggleGroupField
          label="Layout"
          value={welcome.layout}
          onChange={(value) => onUpdate({ layout: value })}
          options={LAYOUT_OPTIONS}
          disabled={disabled}
        />

        {/* Experience Slot Manager for main experiences */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Connected Experiences</label>
          <ExperienceSlotManager
            mode="list"
            slot="main"
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            experiences={mainExperiences}
            onUpdate={(exps) =>
              onUpdateMainExperiences(exps as MainExperienceReference[])
            }
            assignedExperienceIds={assignedExperienceIds}
            isLoading={disabled}
          />
        </div>
      </EditorSection>
    </div>
  )
}
