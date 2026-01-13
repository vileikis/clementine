/**
 * WelcomeConfigPanel Component
 *
 * Left panel control interface for customizing welcome screen properties.
 * Organized into sections: Content (title, description, media), Experiences (layout).
 */

import { LayoutGrid, LayoutList } from 'lucide-react'
import {
  WELCOME_DESCRIPTION_MAX_LENGTH,
  WELCOME_TITLE_MAX_LENGTH,
} from '../constants'
import type { ExperiencePickerLayout } from '../schemas'
import type { WelcomeConfig } from '@/domains/event/shared'
import type { EditorOption } from '@/shared/editor-controls'
import {
  EditorSection,
  MediaPickerField,
  TextField,
  TextareaField,
  ToggleGroupField,
} from '@/shared/editor-controls'

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
}: WelcomeConfigPanelProps) {
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

      {/* Experiences Section - layout (future: experience list) */}
      <EditorSection title="Experiences">
        <ToggleGroupField
          label="Layout"
          value={welcome.layout}
          onChange={(value) => onUpdate({ layout: value })}
          options={LAYOUT_OPTIONS}
          disabled={disabled}
        />
      </EditorSection>
    </div>
  )
}
