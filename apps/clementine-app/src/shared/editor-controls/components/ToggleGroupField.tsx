/**
 * ToggleGroupField Component
 *
 * A toggle group wrapper with label for selecting from a set of options.
 * Commonly used for alignment, radius, and other enum-like selections.
 */

import { EditorRow } from './EditorRow'
import type { ToggleGroupFieldProps } from '../types'
import { ToggleGroup, ToggleGroupItem } from '@/ui-kit/components/toggle-group'

export function ToggleGroupField<T extends string = string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: ToggleGroupFieldProps<T>) {
  return (
    <EditorRow label={label}>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => {
          // Only call onChange if a value is selected (prevent deselection)
          if (newValue) {
            onChange(newValue as T)
          }
        }}
        disabled={disabled}
        size="sm"
        variant="outline"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            className="px-2"
          >
            {option.icon ?? option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </EditorRow>
  )
}
