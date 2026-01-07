/**
 * ThemeControls Component
 *
 * Right panel control interface for customizing theme properties.
 * Organized into collapsible sections: Text, Colors, Buttons, Background.
 */

import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import { FONT_OPTIONS } from '../constants'
import type { Theme } from '@/shared/theming/schemas/theme.schemas'
import type { EditorOption } from '@/shared/editor-controls'
import {
  ColorPickerField,
  EditorSection,
  MediaPickerField,
  SelectField,
  SliderField,
  ToggleGroupField,
} from '@/shared/editor-controls'

export interface ThemeControlsProps {
  /** Current theme values */
  theme: Theme
  /** Callback when a theme field is updated */
  onUpdate: (updates: Partial<Theme>) => void
  /** Callback when a background image file is selected for upload */
  onUploadBackground: (file: File) => void
  /** Whether controls are disabled (e.g., during save) */
  disabled?: boolean
  /** Whether a background upload is in progress */
  uploadingBackground?: boolean
  /** Background upload progress (0-100) */
  uploadProgress?: number
}

// Text alignment options
const ALIGNMENT_OPTIONS: EditorOption<'left' | 'center' | 'right'>[] = [
  { value: 'left', label: 'Left', icon: <AlignLeft className="size-4" /> },
  {
    value: 'center',
    label: 'Center',
    icon: <AlignCenter className="size-4" />,
  },
  { value: 'right', label: 'Right', icon: <AlignRight className="size-4" /> },
]

// Button radius options
const RADIUS_OPTIONS: EditorOption<'none' | 'sm' | 'md' | 'full'>[] = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'full', label: 'Full' },
]

export function ThemeControls({
  theme,
  onUpdate,
  onUploadBackground,
  disabled = false,
  uploadingBackground = false,
  uploadProgress,
}: ThemeControlsProps) {
  return (
    <div className="space-y-0">
      {/* Text Section */}
      <EditorSection title="Text">
        <SelectField
          label="Font"
          value={theme.fontFamily ?? 'system'}
          onChange={(value) =>
            onUpdate({ fontFamily: value === 'system' ? null : value })
          }
          options={FONT_OPTIONS}
          disabled={disabled}
        />
        <ColorPickerField
          label="Text color"
          value={theme.text.color}
          onChange={(value) =>
            onUpdate({ text: { ...theme.text, color: value ?? '#FFFFFF' } })
          }
          disabled={disabled}
        />
        <ToggleGroupField
          label="Alignment"
          value={theme.text.alignment}
          onChange={(value) =>
            onUpdate({ text: { ...theme.text, alignment: value } })
          }
          options={ALIGNMENT_OPTIONS}
          disabled={disabled}
        />
      </EditorSection>

      {/* Colors Section */}
      <EditorSection title="Colors">
        <ColorPickerField
          label="Primary"
          value={theme.primaryColor}
          onChange={(value) => onUpdate({ primaryColor: value ?? '#3B82F6' })}
          disabled={disabled}
        />
      </EditorSection>

      {/* Buttons Section */}
      <EditorSection title="Buttons">
        <ColorPickerField
          label="Background"
          value={theme.button.backgroundColor}
          onChange={(value) =>
            onUpdate({ button: { ...theme.button, backgroundColor: value } })
          }
          nullable
          disabled={disabled}
        />
        <ColorPickerField
          label="Text color"
          value={theme.button.textColor}
          onChange={(value) =>
            onUpdate({
              button: { ...theme.button, textColor: value ?? '#FFFFFF' },
            })
          }
          disabled={disabled}
        />
        <ToggleGroupField
          label="Radius"
          value={theme.button.radius}
          onChange={(value) =>
            onUpdate({ button: { ...theme.button, radius: value } })
          }
          options={RADIUS_OPTIONS}
          disabled={disabled}
        />
      </EditorSection>

      {/* Background Section */}
      <EditorSection title="Background">
        <ColorPickerField
          label="Color"
          value={theme.background.color}
          onChange={(value) =>
            onUpdate({
              background: { ...theme.background, color: value ?? '#1E1E1E' },
            })
          }
          disabled={disabled}
        />
        <MediaPickerField
          label="Image"
          value={theme.background.image}
          onChange={(value) =>
            onUpdate({ background: { ...theme.background, image: value } })
          }
          onUpload={onUploadBackground}
          accept="image/*"
          removable
          uploading={uploadingBackground}
          uploadProgress={uploadProgress}
          disabled={disabled}
        />
        {theme.background.image && (
          <SliderField
            label="Overlay opacity"
            value={theme.background.overlayOpacity * 100}
            onChange={(value) =>
              onUpdate({
                background: {
                  ...theme.background,
                  overlayOpacity: value / 100,
                },
              })
            }
            min={0}
            max={100}
            step={5}
            formatValue={(v) => `${v}%`}
            disabled={disabled}
          />
        )}
      </EditorSection>
    </div>
  )
}
