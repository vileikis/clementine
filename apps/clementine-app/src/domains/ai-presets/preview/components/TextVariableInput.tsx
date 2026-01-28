/**
 * TextVariableInput Component
 *
 * Input field for text variables without value mappings.
 * Displays variable mention badge and text input in inline layout.
 */

import { useId } from 'react'
import { VariableMention } from './VariableMention'
import type { TextVariable } from '@clementine/shared'
import { Input } from '@/ui-kit/ui/input'

interface TextVariableInputProps {
  /** Text variable configuration */
  variable: TextVariable
  /** Current input value */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Whether input is disabled */
  disabled?: boolean
}

/**
 * Text input field for free-form text variables.
 * Displays variable mention badge on left, input field on right.
 *
 * @example
 * ```tsx
 * <TextVariableInput
 *   variable={{ type: 'text', name: 'style', defaultValue: 'dramatic' }}
 *   value={testInputs.style}
 *   onChange={(v) => updateInput('style', v)}
 * />
 * ```
 */
export function TextVariableInput({
  variable,
  value,
  onChange,
  disabled = false,
}: TextVariableInputProps) {
  const id = useId()

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <VariableMention
        name={variable.name}
        type="text"
        defaultValue={variable.defaultValue}
      />
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${variable.name}...`}
        disabled={disabled}
        className="h-11 w-48"
        aria-label={`${variable.name} input${variable.defaultValue ? `, default: ${variable.defaultValue}` : ''}`}
      />
    </div>
  )
}
