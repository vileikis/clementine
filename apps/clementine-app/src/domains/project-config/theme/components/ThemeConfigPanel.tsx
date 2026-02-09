/**
 * ThemeConfigPanel Component
 *
 * Left panel control interface for customizing theme properties.
 * Organized into collapsible sections: Text, Colors, Buttons, Background.
 */

import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import {
  TbBorderCornerPill,
  TbBorderCornerRounded,
  TbBorderCornerSquare,
} from 'react-icons/tb'
import { GoogleFontPicker } from './google-font-picker'
import type {
  ButtonRadius,
  Theme,
} from '@/shared/theming/schemas/theme.schemas'
import type { EditorOption } from '@/shared/editor-controls'
import {
  ColorPickerField,
  EditorSection,
  MediaPickerField,
  SliderField,
  ToggleGroupField,
} from '@/shared/editor-controls'

export interface ThemeConfigPanelProps {
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

// Button radius options with icons
const RADIUS_OPTIONS: EditorOption<ButtonRadius>[] = [
  {
    value: 'square',
    label: 'Square',
    icon: <TbBorderCornerSquare className="size-4" />,
  },
  {
    value: 'rounded',
    label: 'Rounded',
    icon: <TbBorderCornerRounded className="size-4" />,
  },
  {
    value: 'pill',
    label: 'Pill',
    icon: <TbBorderCornerPill className="size-4" />,
  },
]

export function ThemeConfigPanel({
  theme,
  onUpdate,
  onUploadBackground,
  disabled = false,
  uploadingBackground = false,
  uploadProgress,
}: ThemeConfigPanelProps) {
  return (
    <div className="space-y-0">
      {/* Text Section */}
      <EditorSection title="Text">
        <GoogleFontPicker
          label="Font"
          value={theme.fontFamily}
          onChange={(selection) => {
            if (selection === null) {
              onUpdate({
                fontFamily: null,
                fontSource: 'system',
                fontVariants: [400, 700],
              })
            } else {
              onUpdate({
                fontFamily: selection.family,
                fontSource: selection.source,
                fontVariants: selection.variants,
              })
            }
          }}
          disabled={disabled}
        />
        <ColorPickerField
          label="Text color"
          value={theme.text.color}
          onChange={(value) =>
            onUpdate({ text: { ...theme.text, color: value ?? '#1E1E1E' } })
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
              background: { ...theme.background, color: value ?? '#FFFFFF' },
            })
          }
          disabled={disabled}
        />
        <MediaPickerField
          label="Image"
          value={theme.background.image?.url ?? null}
          onChange={(value) =>
            // When removing, set to null; MediaPickerField doesn't handle creating new MediaReference (that's done via onUpload)
            onUpdate({
              background: {
                ...theme.background,
                image: value === null ? null : theme.background.image,
              },
            })
          }
          onUpload={onUploadBackground}
          removable
          uploading={uploadingBackground}
          uploadProgress={uploadProgress}
          disabled={disabled}
        />
        {theme.background.image?.url && (
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
