/**
 * AIVideoTaskSelector Component
 *
 * Dropdown for selecting the AI video task type.
 * Active: image-to-video (Animate), ref-images-to-video (Remix)
 * Coming soon: transform, reimagine
 *
 * @see specs/075-ai-video-editor-v2 — US1
 */
import type { AIVideoTask } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

interface TaskOption {
  value: AIVideoTask
  label: string
  description: string
  comingSoon?: boolean
}

const TASK_OPTIONS: TaskOption[] = [
  {
    value: 'image-to-video',
    label: 'Animate',
    description: 'Bring a photo to life as video',
  },
  {
    value: 'ref-images-to-video',
    label: 'Remix',
    description:
      'Create a new video using photo and reference images as creative input',
  },
  {
    value: 'transform',
    label: 'Transform',
    description: 'Photo transitions into an AI-generated version',
    comingSoon: true,
  },
  {
    value: 'reimagine',
    label: 'Reimagine',
    description: 'Video between two AI-generated frames',
    comingSoon: true,
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
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.comingSoon}
            >
              <span>{option.label}</span>
              {option.comingSoon ? (
                <span className="bg-muted text-muted-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                  Coming soon
                </span>
              ) : (
                <span className="text-muted-foreground ml-2 text-xs">
                  — {option.description}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
