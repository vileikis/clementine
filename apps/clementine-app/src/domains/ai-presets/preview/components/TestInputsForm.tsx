/**
 * TestInputsForm Component
 *
 * Dynamic form for entering test values for preset variables.
 * Renders different input types based on variable configuration:
 * - Text input for text variables without value mappings
 * - Select dropdown for text variables with value mappings
 * - Image upload zone for image variables
 *
 * Color coding matches editor mentions:
 * - Text variables: Blue (#1976d2)
 * - Image variables: Green (#2e7d32)
 *
 * T016-T022: Test Variable Inputs
 */

import { useId } from 'react'
import { RotateCcw } from 'lucide-react'
import type { PresetVariable } from '@clementine/shared'
import type { TestInputState } from '../types'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'
import { EditorSection, MediaPickerField } from '@/shared/editor-controls'
import { cn } from '@/shared/utils'

interface TestInputsFormProps {
  variables: PresetVariable[]
  testInputs: TestInputState
  onInputChange: (name: string, value: string | File | null) => void
  onReset: () => void
  disabled?: boolean
  className?: string
}

/**
 * Inline text input field with mention-style label (blue background for text variables)
 */
function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  defaultValue,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  defaultValue?: string
}) {
  const id = useId()

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium"
          style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
          }}
        >
          @{label}
        </span>
        {defaultValue && (
          <span className="text-xs text-muted-foreground">
            (default: {defaultValue})
          </span>
        )}
      </div>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        size="sm"
        className="w-48"
      />
    </div>
  )
}

/**
 * Inline select field with mention-style label (blue background for text variables with value mappings)
 */
function SelectInputField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  defaultValue,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  defaultValue?: string
}) {
  const id = useId()

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium"
          style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
          }}
        >
          @{label}
        </span>
        {defaultValue && (
          <span className="text-xs text-muted-foreground">
            (default: {defaultValue})
          </span>
        )}
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} size="sm" className="w-48">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Form for entering test values for preset variables.
 * Dynamically renders appropriate input types based on variable configuration.
 *
 * @example
 * ```tsx
 * <TestInputsForm
 *   variables={preset.draft.variables}
 *   testInputs={testInputs}
 *   onInputChange={updateInput}
 *   onReset={resetToDefaults}
 * />
 * ```
 */
export function TestInputsForm({
  variables,
  testInputs,
  onInputChange,
  onReset,
  disabled = false,
  className,
}: TestInputsFormProps) {
  // No variables to display
  if (variables.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-muted-foreground">
          No variables defined in this preset.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Add variables in the Edit tab to see test inputs here.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)}>
      {/* Form Header with Reset Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-medium">Test Input Values</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter test values to preview the resolved prompt
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={disabled}
        >
          <RotateCcw className="size-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Variable Inputs organized by type */}
      <EditorSection title="Variables" defaultOpen={true}>
        {variables.map((variable) => (
          <div key={variable.id}>
            {variable.type === 'text' ? (
              // Text variable - either input or select
              variable.valueMap && variable.valueMap.length > 0 ? (
                // Text variable with value mappings - render dropdown
                <SelectInputField
                  label={variable.name}
                  value={
                    typeof testInputs[variable.name] === 'string'
                      ? (testInputs[variable.name] as string)
                      : ''
                  }
                  onChange={(value) => onInputChange(variable.name, value)}
                  options={variable.valueMap.map((m) => ({
                    value: m.value,
                    label: m.value,
                  }))}
                  disabled={disabled}
                  placeholder="Select a value..."
                  defaultValue={variable.defaultValue}
                />
              ) : (
                // Text variable without value mappings - render text input
                <TextInputField
                  label={variable.name}
                  value={
                    typeof testInputs[variable.name] === 'string'
                      ? (testInputs[variable.name] as string)
                      : ''
                  }
                  onChange={(value) => onInputChange(variable.name, value)}
                  placeholder={`Enter ${variable.name}...`}
                  disabled={disabled}
                  defaultValue={variable.defaultValue}
                />
              )
            ) : (
              // Image variable - render stacked upload zone with green mention-style label
              <div className="space-y-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium"
                  style={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                  }}
                >
                  @{variable.name}
                </span>
                <div className="w-full max-w-[200px]">
                  <MediaPickerField
                    label=""
                    value={
                      testInputs[variable.name] instanceof File
                        ? URL.createObjectURL(testInputs[variable.name] as File)
                        : typeof testInputs[variable.name] === 'string'
                          ? (testInputs[variable.name] as string)
                          : null
                    }
                    onChange={(value) => onInputChange(variable.name, value)}
                    onUpload={(file) => onInputChange(variable.name, file)}
                    accept={[
                      'image/png',
                      'image/jpeg',
                      'image/jpg',
                      'image/webp',
                      'image/gif',
                    ]}
                    disabled={disabled}
                    removable={true}
                    uploading={false}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </EditorSection>
    </div>
  )
}
