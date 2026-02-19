/**
 * TaskSelector Component
 *
 * Dropdown for selecting the AI image task type.
 * When switching to text-to-image, signals parent to set captureStepId to null.
 *
 * @see specs/072-outcome-schema-redesign — US2
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

type AIImageTask = 'text-to-image' | 'image-to-image'

const TASK_OPTIONS: { value: AIImageTask; label: string }[] = [
  { value: 'text-to-image', label: 'Text to Image' },
  { value: 'image-to-image', label: 'Image to Image' },
]

export interface TaskSelectorProps {
  /** Current task type */
  task: AIImageTask
  /** Callback when task changes */
  onTaskChange: (task: AIImageTask) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * TaskSelector - Dropdown to select AI image task type
 */
export function TaskSelector({
  task,
  onTaskChange,
  disabled,
}: TaskSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Task</label>
      <Select
        value={task}
        onValueChange={(value) => onTaskChange(value as AIImageTask)}
        disabled={disabled}
      >
        <SelectTrigger className="min-h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
