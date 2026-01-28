/**
 * TestInputsForm Component
 *
 * Dynamic form for entering test values for preset variables.
 * Delegates rendering to specialized input components:
 * - TextVariableInput: Text variables without value mappings
 * - SelectVariableInput: Text variables with value mappings
 * - ImageVariableInput: Image variables with upload
 *
 * T016-T022: Test Variable Inputs
 */

import { memo } from 'react'
import { RotateCcw } from 'lucide-react'
import { isMediaReference } from '../lib/type-guards'
import { TextVariableInput } from './TextVariableInput'
import { SelectVariableInput } from './SelectVariableInput'
import { ImageVariableInput } from './ImageVariableInput'
import type { PresetVariable } from '@clementine/shared'
import type { TestInputState } from '../types'
import { Button } from '@/ui-kit/ui/button'
import { EditorSection } from '@/shared/editor-controls'
import { cn } from '@/shared/utils'

interface TestInputsFormProps {
  variables: PresetVariable[]
  testInputs: TestInputState
  onInputChange: (name: string, value: TestInputState[string]) => void
  onUploadImage: (name: string, file: File) => Promise<void>
  onReset: () => void
  disabled?: boolean
  className?: string
  uploadingImages?: Record<string, boolean>
}

/**
 * Form for entering test values for preset variables.
 * Dynamically renders appropriate input types based on variable configuration.
 * Optimized with React.memo to prevent unnecessary re-renders.
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
function TestInputsFormInner({
  variables,
  testInputs,
  onInputChange,
  onUploadImage,
  onReset,
  disabled = false,
  className,
  uploadingImages = {},
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
        {variables.map((variable) => {
          const inputValue = testInputs[variable.name]

          if (variable.type === 'text') {
            // Text variable with value mappings - render dropdown
            if (variable.valueMap && variable.valueMap.length > 0) {
              return (
                <SelectVariableInput
                  key={variable.id}
                  variable={{
                    ...variable,
                    valueMap: variable.valueMap,
                  }}
                  value={typeof inputValue === 'string' ? inputValue : ''}
                  onChange={(value) => onInputChange(variable.name, value)}
                  disabled={disabled}
                />
              )
            }

            // Text variable without value mappings - render text input
            return (
              <TextVariableInput
                key={variable.id}
                variable={variable}
                value={typeof inputValue === 'string' ? inputValue : ''}
                onChange={(value) => onInputChange(variable.name, value)}
                disabled={disabled}
              />
            )
          }

          // Image variable - render upload zone
          return (
            <ImageVariableInput
              key={variable.id}
              variable={variable}
              value={isMediaReference(inputValue) ? inputValue : null}
              onChange={(value) => onInputChange(variable.name, value)}
              onUpload={(file) => onUploadImage(variable.name, file)}
              disabled={disabled}
              uploading={uploadingImages[variable.name] ?? false}
            />
          )
        })}
      </EditorSection>
    </div>
  )
}

export const TestInputsForm = memo(TestInputsFormInner)
