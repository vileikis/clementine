/**
 * Editor Controls Types
 *
 * Shared types for all editor control components.
 */

import type { ReactNode } from 'react'

/**
 * Base props for all editor field components
 */
export interface EditorFieldBaseProps {
  /** Field label displayed to the user */
  label: string
  /** Whether the field is disabled */
  disabled?: boolean
}

/**
 * Option type for select and toggle group fields
 */
export interface EditorOption<T extends string = string> {
  /** The value to be set when this option is selected */
  value: T
  /** The display label for this option */
  label: string
  /** Optional icon to display */
  icon?: ReactNode
}

/**
 * Props for EditorSection component
 */
export interface EditorSectionProps {
  /** Section title */
  title: string
  /** Section content */
  children: ReactNode
  /** Whether the section is open by default */
  defaultOpen?: boolean
}

/**
 * Props for EditorRow component
 */
export interface EditorRowProps {
  /** Row label */
  label: string
  /** Associated control ID for accessibility */
  htmlFor?: string
  /** Row content (the control) */
  children: ReactNode
  /** Whether to stack label and control vertically */
  stacked?: boolean
}

/**
 * Props for ColorPickerField component
 */
export interface ColorPickerFieldProps extends EditorFieldBaseProps {
  /** Current color value (hex format: #RRGGBB) */
  value: string | null
  /** Callback when color changes */
  onChange: (value: string | null) => void
  /** Whether the value can be set to null (no color) */
  nullable?: boolean
}

/**
 * Props for SelectField component
 */
export interface SelectFieldProps<
  T extends string = string,
> extends EditorFieldBaseProps {
  /** Current selected value */
  value: T
  /** Callback when selection changes */
  onChange: (value: T) => void
  /** Available options */
  options: EditorOption<T>[]
  /** Placeholder text when no value is selected */
  placeholder?: string
}

/**
 * Props for ToggleGroupField component
 */
export interface ToggleGroupFieldProps<
  T extends string = string,
> extends EditorFieldBaseProps {
  /** Current selected value */
  value: T
  /** Callback when selection changes */
  onChange: (value: T) => void
  /** Available options */
  options: EditorOption<T>[]
}

/**
 * Props for SliderField component
 */
export interface SliderFieldProps extends EditorFieldBaseProps {
  /** Current value */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Step increment */
  step?: number
  /** Function to format the displayed value */
  formatValue?: (value: number) => string
}

/**
 * Props for MediaPickerField component
 */
export interface MediaPickerFieldProps extends EditorFieldBaseProps {
  /** Current media URL (null if no media) */
  value: string | null
  /** Callback when media is removed */
  onChange: (value: string | null) => void
  /** Callback when a file is selected for upload */
  onUpload: (file: File) => void
  /** Accepted file types (e.g., 'image/*') */
  accept?: string
  /** Whether the media can be removed */
  removable?: boolean
  /** Whether an upload is in progress */
  uploading?: boolean
  /** Upload progress (0-100) */
  uploadProgress?: number
}
