/**
 * StepListItem Component
 *
 * Individual step item in the step list sidebar.
 * Shows step icon, label, selected state, drag handle, and delete action.
 */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreVertical, Trash2 } from 'lucide-react'

import {
  getStepDefinition,
  getStepDisplayLabel,
} from '../../steps/registry/step-utils'
import type { Step } from '../../steps/registry/step-registry'
import { cn } from '@/shared/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu'

interface StepListItemProps {
  /** Step data */
  step: Step
  /** Whether this step is currently selected */
  isSelected: boolean
  /** Callback when step is clicked */
  onClick: () => void
  /** Callback when delete is triggered */
  onDelete: () => void
  /** Optional disabled state */
  disabled?: boolean
}

/**
 * Step list item with icon, label, drag handle, and context menu
 *
 * Displays step type icon and label with visual selection state.
 * Click to select the step for editing.
 * Drag via the grip handle to reorder.
 * Use context menu to delete.
 *
 * @example
 * ```tsx
 * <StepListItem
 *   step={step}
 *   isSelected={selectedStepId === step.id}
 *   onClick={() => selectStep(step.id)}
 *   onDelete={() => deleteStep(step.id)}
 * />
 * ```
 */
export function StepListItem({
  step,
  isSelected,
  onClick,
  onDelete,
  disabled,
}: StepListItemProps) {
  const definition = getStepDefinition(step.type)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!definition) {
    return null
  }

  const Icon = definition.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="option"
      id={step.id}
      aria-selected={isSelected}
      className={cn(
        'group flex items-center gap-1 rounded-md',
        'transition-colors duration-150',
        isDragging && 'opacity-50',
        isSelected && 'bg-accent text-accent-foreground',
        !isSelected && 'hover:bg-accent/50',
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          'flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground',
          'opacity-0 transition-opacity group-hover:opacity-100',
          'focus-visible:opacity-100 focus-visible:outline-none',
          isDragging && 'cursor-grabbing opacity-100',
          disabled && 'pointer-events-none',
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Main clickable area */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 py-2 pr-1 text-left text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {getStepDisplayLabel(step, definition)}
        </span>
        {isSelected && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        )}
      </button>

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-8 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground',
              'opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover:opacity-100',
              'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              disabled && 'pointer-events-none',
            )}
            disabled={disabled}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
