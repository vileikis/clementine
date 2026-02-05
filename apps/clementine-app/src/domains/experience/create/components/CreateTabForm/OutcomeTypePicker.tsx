/**
 * OutcomeTypePicker Component
 *
 * Card-based picker for selecting outcome type when no outcome is configured.
 * Shows Image, GIF, and Video options as visual cards.
 *
 * @see spec.md - US1 (Select Outcome Type)
 */
import { Film, Image as ImageIcon, Video } from 'lucide-react'

import type { OutcomeType } from '@clementine/shared'
import { cn } from '@/shared/utils'

export interface OutcomeTypePickerProps {
  /** Callback when outcome type is selected */
  onSelect: (type: OutcomeType) => void
  /** Whether the picker is disabled */
  disabled?: boolean
}

interface OutcomeOption {
  type: OutcomeType
  label: string
  description: string
  icon: React.ReactNode
  disabled: boolean
  comingSoon: boolean
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  {
    type: 'image',
    label: 'Image',
    description: 'Generate AI-enhanced photos',
    icon: <ImageIcon className="h-8 w-8" />,
    disabled: false,
    comingSoon: false,
  },
  {
    type: 'gif',
    label: 'GIF',
    description: 'Create animated images',
    icon: <Film className="h-8 w-8" />,
    disabled: true,
    comingSoon: true,
  },
  {
    type: 'video',
    label: 'Video',
    description: 'Produce short video clips',
    icon: <Video className="h-8 w-8" />,
    disabled: true,
    comingSoon: true,
  },
]

/**
 * OutcomeTypePicker - Card picker for outcome type selection
 */
export function OutcomeTypePicker({
  onSelect,
  disabled,
}: OutcomeTypePickerProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Choose Outcome Type</h3>
        <p className="text-muted-foreground text-sm">
          Select what type of content guests will receive
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {OUTCOME_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            disabled={disabled || option.disabled}
            className={cn(
              'relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all',
              'hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              option.disabled && 'cursor-not-allowed opacity-50',
              !option.disabled && 'cursor-pointer',
            )}
          >
            <div
              className={cn(
                'text-muted-foreground',
                !option.disabled && 'text-foreground',
              )}
            >
              {option.icon}
            </div>
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-muted-foreground text-xs">
                {option.description}
              </div>
            </div>
            {option.comingSoon && (
              <span className="bg-muted text-muted-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
