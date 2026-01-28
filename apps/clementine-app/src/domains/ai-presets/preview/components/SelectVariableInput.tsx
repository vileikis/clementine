/**
 * SelectVariableInput Component
 *
 * Dropdown selector for text variables with value mappings.
 * Displays variable mention badge and select dropdown in inline layout.
 */

import { useId } from 'react'
import { VariableMention } from './VariableMention'
import type { TextVariable } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

interface SelectVariableInputProps {
  /** Text variable with value mappings */
  variable: TextVariable & {
    valueMap: NonNullable<TextVariable['valueMap']>
  }
  /** Current selected value */
  value: string
  /** Callback when selection changes */
  onChange: (value: string) => void
  /** Whether dropdown is disabled */
  disabled?: boolean
}

/**
 * Select dropdown for text variables with predefined value mappings.
 * Displays variable mention badge on left, select dropdown on right.
 *
 * @example
 * ```tsx
 * <SelectVariableInput
 *   variable={{
 *     type: 'text',
 *     name: 'style',
 *     valueMap: [
 *       { value: 'dramatic', text: 'High contrast, dramatic lighting' },
 *       { value: 'soft', text: 'Soft, gentle lighting' }
 *     ]
 *   }}
 *   value={testInputs.style}
 *   onChange={(v) => updateInput('style', v)}
 * />
 * ```
 */
export function SelectVariableInput({
  variable,
  value,
  onChange,
  disabled = false,
}: SelectVariableInputProps) {
  const id = useId()

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <VariableMention
        name={variable.name}
        type="text"
        defaultValue={variable.defaultValue}
      />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="h-9 w-48">
          <SelectValue placeholder="Select a value..." />
        </SelectTrigger>
        <SelectContent>
          {variable.valueMap.map((mapping: { value: string; text: string }) => (
            <SelectItem key={mapping.value} value={mapping.value}>
              {mapping.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
