/**
 * AIVideoTaskSelector Component
 *
 * Dropdown for selecting the AI video task type (animate, transform, reimagine).
 *
 * @see specs/073-ai-video-editor — US1
 */
import type { AIVideoTask } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

const TASK_OPTIONS: {
  value: AIVideoTask
  label: string
  description: string
}[] = [
  {
    value: 'animate',
    label: 'Animate',
    description: 'Bring a photo to life as video',
  },
  {
    value: 'transform',
    label: 'Transform',
    description: 'Photo transitions into AI-generated version',
  },
  {
    value: 'reimagine',
    label: 'Reimagine',
    description: 'Video between two AI-generated frames',
  },
]

export interface AIVideoTaskSelectorProps {
  /** Current task type */
  task: AIVideoTask
  /** Callback when task changes */
  onTaskChange: (task: AIVideoTask) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * AIVideoTaskSelector - Dropdown to select AI video task type
 */
export function AIVideoTaskSelector({
  task,
  onTaskChange,
  disabled,
}: AIVideoTaskSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Task</label>
      <Select
        value={task}
        onValueChange={(value) => onTaskChange(value as AIVideoTask)}
        disabled={disabled}
      >
        <SelectTrigger className="min-h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span>{option.label}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                — {option.description}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
