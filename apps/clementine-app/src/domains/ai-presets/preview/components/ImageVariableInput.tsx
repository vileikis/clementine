/**
 * ImageVariableInput Component
 *
 * Image upload field for image variables.
 * Displays variable mention badge above upload zone in stacked layout.
 */

import { VariableMention } from './VariableMention'
import type { ImageVariable, MediaReference } from '@clementine/shared'
import { MediaPickerField } from '@/shared/editor-controls'

interface ImageVariableInputProps {
  /** Image variable configuration */
  variable: ImageVariable
  /** Current uploaded image (MediaReference) */
  value: MediaReference | null
  /** Callback when image is removed */
  onChange: (value: string | null) => void
  /** Callback when image file is selected for upload */
  onUpload: (file: File) => Promise<void>
  /** Whether upload field is disabled */
  disabled?: boolean
  /** Whether upload is in progress */
  uploading?: boolean
}

/**
 * Image upload field for image variables.
 * Uploads to Firebase Storage and stores MediaReference for persistence.
 *
 * Layout: Stacked (mention badge above upload zone) to accommodate image preview.
 *
 * @example
 * ```tsx
 * <ImageVariableInput
 *   variable={{ type: 'image', name: 'profilePic' }}
 *   value={testInputs.profilePic}
 *   onChange={(v) => updateInput('profilePic', v)}
 *   onUpload={(file) => handleUploadImage('profilePic', file)}
 *   uploading={uploadingImages.profilePic}
 * />
 * ```
 */
export function ImageVariableInput({
  variable,
  value,
  onChange,
  onUpload,
  disabled = false,
  uploading = false,
}: ImageVariableInputProps) {
  return (
    <div className="space-y-2">
      <VariableMention name={variable.name} type="image" />
      <div className="w-full max-w-[200px]">
        <MediaPickerField
          label=""
          value={value?.url ?? null}
          onChange={onChange}
          onUpload={onUpload}
          accept={[
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp',
            'image/gif',
          ]}
          disabled={disabled}
          removable={true}
          uploading={uploading}
        />
      </div>
    </div>
  )
}
