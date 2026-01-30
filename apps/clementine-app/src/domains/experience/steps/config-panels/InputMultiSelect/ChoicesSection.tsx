/**
 * ChoicesSection Component
 *
 * Manages the options/choices for multi-select steps.
 * Handles state, validation, and all option-related operations.
 */
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { OptionListItem } from './OptionListItem'
import type { MultiSelectOption } from '@clementine/shared'

import { Button } from '@/ui-kit/ui/button'
import { Label } from '@/ui-kit/ui/label'

interface ChoicesSectionProps {
  options: MultiSelectOption[]
  onOptionsChange: (options: MultiSelectOption[]) => void
  disabled?: boolean
}

export function ChoicesSection({
  options,
  onOptionsChange,
  disabled = false,
}: ChoicesSectionProps) {
  // Track which option's AI fields are expanded
  const [expandedOption, setExpandedOption] = useState<number | null>(null)

  const handleOptionChange = (
    index: number,
    updates: Partial<MultiSelectOption>,
  ) => {
    const newOptions = [...options]
    const currentOption = newOptions[index]

    // Create updated option, removing undefined values (Firestore doesn't support undefined)
    const updatedOption: MultiSelectOption = { ...currentOption }

    // Handle each update, converting undefined to field deletion
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        // Remove the key from the object (Firestore doesn't support undefined)
        delete (updatedOption as any)[key]
      } else {
        ;(updatedOption as any)[key] = value
      }
    })

    newOptions[index] = updatedOption
    onOptionsChange(newOptions)
  }

  const handleAddOption = () => {
    if (options.length < 10) {
      onOptionsChange([...options, { value: `Option ${options.length + 1}` }])
    }
  }

  const handleDuplicateOption = (index: number) => {
    if (options.length < 10) {
      const optionToDuplicate = options[index]
      const newOption = {
        ...optionToDuplicate,
        value: `${optionToDuplicate.value} (copy)`,
      }
      const newOptions = [
        ...options.slice(0, index + 1),
        newOption,
        ...options.slice(index + 1),
      ]
      onOptionsChange(newOptions)
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      onOptionsChange(newOptions)
      // Close expanded section if removing that option
      if (expandedOption === index) {
        setExpandedOption(null)
      } else if (expandedOption !== null && expandedOption > index) {
        setExpandedOption(expandedOption - 1)
      }
    }
  }

  const toggleExpanded = (index: number) => {
    setExpandedOption(expandedOption === index ? null : index)
  }

  return (
    <div className="space-y-2">
      {/* Header with label and add button */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-normal text-muted-foreground">
          Choices ({options.length}/10)
        </Label>
        {options.length < 10 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAddOption}
            disabled={disabled}
            title="Add option"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Options list */}
      <div>
        {options.map((option, index) => (
          <OptionListItem
            key={index}
            option={option}
            index={index}
            isExpanded={expandedOption === index}
            canDelete={options.length > 2}
            disabled={disabled}
            onValueChange={(value) => handleOptionChange(index, { value })}
            onToggleExpanded={() => toggleExpanded(index)}
            onDuplicate={() => handleDuplicateOption(index)}
            onDelete={() => handleRemoveOption(index)}
            onPromptFragmentChange={(value) =>
              handleOptionChange(index, { promptFragment: value })
            }
            onPromptMediaChange={(value) =>
              handleOptionChange(index, { promptMedia: value })
            }
          />
        ))}
      </div>
    </div>
  )
}
