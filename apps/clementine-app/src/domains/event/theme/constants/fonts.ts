/**
 * Font Options
 *
 * Available font family options for the theme editor.
 * Uses web-safe fonts with system fallbacks.
 */

import type { EditorOption } from '@/shared/editor-controls'

export type FontFamily = (typeof FONT_OPTIONS)[number]['value']

export const FONT_OPTIONS: EditorOption<string>[] = [
  { value: 'system', label: 'System Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: '"Comic Sans MS", cursive', label: 'Comic Sans MS' },
]

/**
 * Get display label for a font family value
 */
export function getFontLabel(fontFamily: string | null): string {
  if (!fontFamily) return 'System Default'
  const option = FONT_OPTIONS.find((opt) => opt.value === fontFamily)
  return option?.label ?? fontFamily
}
