/**
 * ExperienceTypePicker Component
 *
 * Card-based picker for selecting experience type at creation time.
 * Selecting a type immediately triggers creation (no form, no name input).
 *
 * Layout:
 * - Row 1: Photo, GIF, Video, Survey — compact row cards (icon + text side-by-side)
 * - Row 2: AI Image, AI Video — large column cards (icon above text)
 *
 * @see specs/081-experience-type-flattening — US1
 */
import { Camera, Film, FormInput, Sparkles, Video } from 'lucide-react'

import type { ExperienceType } from '@clementine/shared'
import { typeMetadata } from '@/domains/experience/shared'
import { cn } from '@/shared/utils/style-utils'
import type { ReactNode } from 'react'

interface TypeOption {
  type: ExperienceType
  icon: ReactNode
}

/** Row 1: compact row-layout cards */
const ROW_OPTIONS: TypeOption[] = [
  { type: 'photo', icon: <Camera className="h-8 w-8" /> },
  { type: 'gif', icon: <Film className="h-8 w-8" /> },
  { type: 'video', icon: <Video className="h-8 w-8" /> },
  { type: 'survey', icon: <FormInput className="h-8 w-8" /> },
]

/** Row 2: large column-layout cards */
const AI_OPTIONS: TypeOption[] = [
  { type: 'ai.image', icon: <Sparkles className="h-8 w-8" /> },
  { type: 'ai.video', icon: <Video className="h-8 w-8" /> },
]

export interface ExperienceTypePickerProps {
  /** Callback when a type is selected — triggers immediate creation */
  onTypeSelect: (type: ExperienceType) => void
  /** Whether selection is disabled (e.g. creation in progress) */
  disabled?: boolean
}

function RowCard({
  option,
  onSelect,
  disabled,
}: {
  option: TypeOption
  onSelect: (type: ExperienceType) => void
  disabled?: boolean
}) {
  const meta = typeMetadata[option.type]
  const isComingSoon = meta.comingSoon === true
  const isDisabled = disabled || isComingSoon

  return (
    <button
      type="button"
      onClick={() => onSelect(option.type)}
      disabled={isDisabled}
      className={cn(
        'relative flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
        !isDisabled && 'hover:border-primary hover:bg-accent cursor-pointer',
        isDisabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div
        className={cn(
          'text-muted-foreground',
          !isDisabled && 'text-foreground',
        )}
      >
        {option.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{meta.label}</div>
        <div className="text-muted-foreground text-xs">{meta.description}</div>
        {isComingSoon && (
          <span className="bg-muted text-muted-foreground mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs">
            Coming soon
          </span>
        )}
      </div>
    </button>
  )
}

function AICard({
  option,
  onSelect,
  disabled,
}: {
  option: TypeOption
  onSelect: (type: ExperienceType) => void
  disabled?: boolean
}) {
  const meta = typeMetadata[option.type]

  return (
    <button
      type="button"
      onClick={() => onSelect(option.type)}
      disabled={disabled}
      className={cn(
        'relative flex w-full flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
        !disabled && 'hover:border-primary hover:bg-accent cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      style={{ maxWidth: '280px' }}
    >
      <div className="text-foreground">{option.icon}</div>
      <div>
        <div className="font-medium">{meta.label}</div>
        <div className="text-muted-foreground text-xs">{meta.description}</div>
      </div>
    </button>
  )
}

export function ExperienceTypePicker({
  onTypeSelect,
  disabled,
}: ExperienceTypePickerProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Choose Output Type</h2>
        <p className="text-muted-foreground text-sm">
          Select what type of content guests will receive
        </p>
      </div>

      {/* Row 1: all 4 in one row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROW_OPTIONS.map((option) => (
          <RowCard
            key={option.type}
            option={option}
            onSelect={onTypeSelect}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Row 2: AI cards — centered, max 280px each */}
      <div className="flex justify-center gap-4">
        {AI_OPTIONS.map((option) => (
          <AICard
            key={option.type}
            option={option}
            onSelect={onTypeSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
