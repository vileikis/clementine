/**
 * ControlRow Component
 *
 * Bottom row of PromptComposer containing model select,
 * aspect ratio select, and add media button.
 * Accepts options via props for reusability across outcome types.
 */
import { AddMediaButton } from './AddMediaButton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

export interface SelectOption {
  value: string
  label: string
}

export interface ControlRowProps {
  /** Current model value */
  model: string
  /** Callback when model changes */
  onModelChange: (model: string) => void
  /** Available model options */
  modelOptions: readonly SelectOption[]
  /** Current aspect ratio value */
  aspectRatio: string
  /** Callback when aspect ratio changes */
  onAspectRatioChange: (aspectRatio: string) => void
  /** Available aspect ratio options */
  aspectRatioOptions: readonly SelectOption[]
  /**
   * Whether to hide the aspect ratio selector.
   * @default false
   */
  hideAspectRatio?: boolean
  /** Current duration value */
  duration?: string
  /** Callback when duration changes */
  onDurationChange?: (duration: string) => void
  /** Available duration options — when provided, duration picker is rendered */
  durationOptions?: readonly SelectOption[]
  /** Callback when files are selected for upload */
  onFilesSelected: (files: File[]) => void
  /** Whether the add media button is disabled */
  isAddDisabled?: boolean
  /** Whether controls are disabled */
  disabled?: boolean
}

/**
 * ControlRow - Model, aspect ratio, and add media controls
 */
export function ControlRow({
  model,
  onModelChange,
  modelOptions,
  aspectRatio,
  onAspectRatioChange,
  aspectRatioOptions,
  hideAspectRatio = false,
  duration,
  onDurationChange,
  durationOptions,
  onFilesSelected,
  isAddDisabled,
  disabled,
}: ControlRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Model Select */}
      <Select value={model} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger
          className="h-11 w-auto min-w-32 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
          aria-label="Select AI model"
        >
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          {modelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Aspect Ratio Select - hidden when controlled at outcome level */}
      {!hideAspectRatio && (
        <Select
          value={aspectRatio}
          onValueChange={onAspectRatioChange}
          disabled={disabled}
        >
          <SelectTrigger
            className="h-11 w-auto min-w-20 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
            aria-label="Select aspect ratio"
          >
            <SelectValue placeholder="Ratio" />
          </SelectTrigger>
          <SelectContent>
            {aspectRatioOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Duration Select - shown when durationOptions is provided */}
      {durationOptions && onDurationChange && (
        <Select
          value={duration}
          onValueChange={onDurationChange}
          disabled={disabled}
        >
          <SelectTrigger
            className="h-11 w-auto min-w-20 cursor-pointer border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
            aria-label="Select duration"
          >
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            {durationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Spacer to push add button to right */}
      <div className="flex-1" />

      {/* Add Media Button */}
      <AddMediaButton
        onFilesSelected={onFilesSelected}
        disabled={isAddDisabled}
      />
    </div>
  )
}
