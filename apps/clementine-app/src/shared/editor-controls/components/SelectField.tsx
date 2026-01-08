/**
 * SelectField Component
 *
 * A select dropdown wrapper with label and consistent styling.
 */

import { useId } from 'react'
import { EditorRow } from './EditorRow'
import type { SelectFieldProps } from '../types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

export function SelectField<T extends string = string>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
}: SelectFieldProps<T>) {
  const id = useId()

  return (
    <EditorRow label={label} htmlFor={id}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} size="sm" className="w-36">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.icon && (
                <span className="mr-2 inline-flex">{option.icon}</span>
              )}
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </EditorRow>
  )
}
