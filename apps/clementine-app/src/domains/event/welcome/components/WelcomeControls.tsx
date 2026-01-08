/**
 * WelcomeControls Component
 *
 * Right panel control interface for customizing welcome screen properties.
 * Organized into sections: Content (title, description, media), Experiences (layout).
 */

import { LayoutGrid, LayoutList } from 'lucide-react'
import type { WelcomeConfig } from '@/domains/event/shared'
import type { ExperiencePickerLayout } from '../schemas'
import type { EditorOption } from '@/shared/editor-controls'
import {
  EditorSection,
  MediaPickerField,
  ToggleGroupField,
} from '@/shared/editor-controls'
import { Input } from '@/ui-kit/components/input'
import { Textarea } from '@/ui-kit/components/ui/textarea'
import { Label } from '@/ui-kit/components/label'

export interface WelcomeControlsProps {
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

export function WelcomeControls({
  welcome,
  onUpdate,
  onUploadHeroMedia,
  disabled = false,
  uploadingHeroMedia = false,
  uploadProgress,
}: WelcomeControlsProps) {
  return (
    <div className="space-y-0">
      {/* Content Section - title, description, hero media */}
      <EditorSection title="Content">
        <div className="space-y-2">
          <Label
            htmlFor="welcome-title"
            className="text-sm font-normal text-muted-foreground"
          >
            Title
          </Label>
          <Input
            id="welcome-title"
            value={welcome.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter welcome title"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="welcome-description"
            className="text-sm font-normal text-muted-foreground"
          >
            Description
          </Label>
          <Textarea
            id="welcome-description"
            value={welcome.description ?? ''}
            onChange={(e) =>
              onUpdate({
                description: e.target.value || null,
              })
            }
            placeholder="Optional description"
            disabled={disabled}
            rows={3}
          />
        </div>
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
