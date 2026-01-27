/**
 * VariablesSection Component
 *
 * Self-contained section for managing preset variables.
 * Features header with plus icon + dropdown, drag-and-drop reordering,
 * and inline variable editing.
 */
import { useCallback } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Image, Plus, Type } from 'lucide-react'
import { toast } from 'sonner'

import { useUpdateVariables } from '../hooks/useUpdateVariables'
import { VariableCard } from './VariableCard'
import type { DragEndEvent } from '@dnd-kit/core'
import type { PresetVariable } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui-kit/ui/tooltip'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'

interface VariablesSectionProps {
  /** Array of variable definitions */
  variables: PresetVariable[]
  /** Workspace ID for updates */
  workspaceId: string
  /** Preset ID for updates */
  presetId: string
  /** Whether the section is disabled (e.g., during publish) */
  disabled?: boolean
}

/**
 * Variables section with header, dropdown menu, and drag-and-drop
 *
 * Self-contained component that handles its own updates via useUpdateVariables.
 * Variables are color-coded by type and can be reordered via drag-and-drop.
 *
 * @example
 * ```tsx
 * <VariablesSection
 *   variables={preset.draft.variables}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function VariablesSection({
  variables,
  workspaceId,
  presetId,
  disabled = false,
}: VariablesSectionProps) {
  const updateVariables = useUpdateVariables(workspaceId, presetId)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Get existing names for uniqueness validation
  const existingNames = variables.map((v) => v.name)

  // Generate unique ID for new variables
  const generateId = () =>
    `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Handle add new variable (text or image)
  const handleAddVariable = useCallback(
    async (type: 'text' | 'image') => {
      try {
        // Generate default name
        const baseName = type === 'text' ? 'text_var' : 'image_var'
        let name = baseName
        let counter = 1
        while (existingNames.includes(name)) {
          name = `${baseName}_${counter}`
          counter++
        }

        const newVariable: PresetVariable =
          type === 'text'
            ? {
                id: generateId(),
                type: 'text',
                name,
                defaultValue: null,
                valueMap: null,
              }
            : {
                id: generateId(),
                type: 'image',
                name,
              }

        const updatedVariables = [...variables, newVariable]
        await updateVariables.mutateAsync(updatedVariables)
        toast.success(`Added ${type} variable @${name}`)
      } catch (error) {
        toast.error('Failed to add variable', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [variables, existingNames, updateVariables],
  )

  // Handle rename variable
  const handleRename = useCallback(
    async (id: string, newName: string) => {
      try {
        const updatedVariables = variables.map((v) =>
          v.id === id ? { ...v, name: newName } : v,
        )
        await updateVariables.mutateAsync(updatedVariables)

        const variable = variables.find((v) => v.id === id)
        if (variable && variable.name !== newName) {
          toast.success(`Renamed @${variable.name} to @${newName}`)
        }
      } catch (error) {
        toast.error('Failed to rename variable', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [variables, updateVariables],
  )

  // Handle settings (placeholder for now)
  const handleSettings = useCallback(
    (id: string) => {
      const variable = variables.find((v) => v.id === id)
      if (variable) {
        toast.info(`Settings for @${variable.name} coming soon`)
      }
    },
    [variables],
  )

  // Handle delete variable
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const variable = variables.find((v) => v.id === id)
        const updatedVariables = variables.filter((v) => v.id !== id)
        await updateVariables.mutateAsync(updatedVariables)
        if (variable) {
          toast.success(`Deleted variable @${variable.name}`)
        }
      } catch (error) {
        toast.error('Failed to delete variable', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [variables, updateVariables],
  )

  // Handle drag end to reorder variables
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = variables.findIndex((v) => v.id === active.id)
        const newIndex = variables.findIndex((v) => v.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newVariables = [...variables]
          const [movedVariable] = newVariables.splice(oldIndex, 1)
          newVariables.splice(newIndex, 0, movedVariable)

          updateVariables.mutate(newVariables)
        }
      }
    },
    [variables, updateVariables],
  )

  const isDisabled = disabled || updateVariables.isPending

  return (
    <div className="space-y-3">
      {/* Header with Add Variable dropdown */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Variables</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <ContextDropdownMenu
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDisabled}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add Variable</span>
                </Button>
              }
              actions={[
                {
                  key: 'text',
                  label: 'Text',
                  icon: Type,
                  onClick: () => handleAddVariable('text'),
                },
                {
                  key: 'image',
                  label: 'Image',
                  icon: Image,
                  onClick: () => handleAddVariable('image'),
                },
              ]}
              aria-label="Add variable"
            />
          </TooltipTrigger>
          <TooltipContent>Add Variable</TooltipContent>
        </Tooltip>
      </div>

      {/* Empty state */}
      {variables.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No variables yet. Variables allow you to create dynamic prompts with
            placeholders.
          </p>
        </div>
      )}

      {/* Variables list with drag-and-drop */}
      {variables.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={variables.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {variables.map((variable) => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  existingNames={existingNames}
                  onRename={handleRename}
                  onSettings={handleSettings}
                  onDelete={handleDelete}
                  disabled={isDisabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
