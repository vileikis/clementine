/**
 * OutcomeTypePicker Component
 *
 * Two-group card picker for selecting outcome type when no outcome is configured.
 * Groups: "Media" (Photo, GIF, Video) and "AI Generated" (AI Image, AI Video).
 * Disabled items show a "Coming soon" badge and are non-interactive.
 *
 * @see specs/072-outcome-schema-redesign — US1 + US7
 */
import { Camera, Film, Sparkles, Video } from 'lucide-react'

import { COMING_SOON_TYPES } from '../../lib/model-options'
import type { ReactNode } from 'react'
import type { OutcomeType } from '@clementine/shared'
import { cn } from '@/shared/utils'

export interface OutcomeTypePickerProps {
  /** Callback when outcome type is selected */
  onTypeSelect: (type: OutcomeType) => void
}

interface OutcomeOption {
  type: OutcomeType
  label: string
  description: string
  icon: ReactNode
  enabled: boolean
}

const MEDIA_OPTIONS: OutcomeOption[] = [
  {
    type: 'photo',
    label: 'Photo',
    description: 'Pass through a captured photo with optional overlay',
    icon: <Camera className="h-8 w-8" />,
    enabled: true,
  },
  {
    type: 'gif',
    label: 'GIF',
    description: 'Create animated images',
    icon: <Film className="h-8 w-8" />,
    enabled: false,
  },
  {
    type: 'video',
    label: 'Video',
    description: 'Produce short video clips',
    icon: <Video className="h-8 w-8" />,
    enabled: false,
  },
]

const AI_OPTIONS: OutcomeOption[] = [
  {
    type: 'ai.image',
    label: 'AI Image',
    description: 'Generate AI-enhanced images from prompts',
    icon: <Sparkles className="h-8 w-8" />,
    enabled: true,
  },
  {
    type: 'ai.video',
    label: 'AI Video',
    description: 'Generate AI video from prompts',
    icon: <Video className="h-8 w-8" />,
    enabled: false,
  },
]

function OptionCard({
  option,
  onSelect,
}: {
  option: OutcomeOption
  onSelect: (type: OutcomeType) => void
}) {
  const isComingSoon = COMING_SOON_TYPES.includes(option.type)

  return (
    <button
      key={option.type}
      type="button"
      onClick={() => onSelect(option.type)}
      disabled={!option.enabled}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
        option.enabled && 'hover:border-primary hover:bg-accent cursor-pointer',
        !option.enabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div
        className={cn(
          'text-muted-foreground',
          option.enabled && 'text-foreground',
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
      {isComingSoon && (
        <span className="bg-muted text-muted-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs">
          Coming soon
        </span>
      )}
    </button>
  )
}

/**
 * OutcomeTypePicker - Two-group card picker for outcome type selection
 */
export function OutcomeTypePicker({ onTypeSelect }: OutcomeTypePickerProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Choose Output Type</h3>
        <p className="text-muted-foreground text-sm">
          Select what type of content guests will receive
        </p>
      </div>

      {/* Media group */}
      <div className="space-y-2">
        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Media
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MEDIA_OPTIONS.map((option) => (
            <OptionCard
              key={option.type}
              option={option}
              onSelect={onTypeSelect}
            />
          ))}
        </div>
      </div>

      {/* AI Generated group */}
      <div className="space-y-2">
        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          AI Generated
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {AI_OPTIONS.map((option) => (
            <OptionCard
              key={option.type}
              option={option}
              onSelect={onTypeSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
