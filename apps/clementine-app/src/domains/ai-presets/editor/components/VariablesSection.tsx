/**
 * VariablesSection Component
 *
 * Self-contained section for managing preset variables.
 * Features header with plus icon + dropdown, drag-and-drop reordering,
 * and inline variable editing.
 */
import { useCallback, useState } from 'react'
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
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'

interface VariablesSectionProps {
  /** Array of variable definitions */
  variables: PresetVariable[]
  /** Array of media entries for @mention in value mappings */
  media: PresetMediaEntry[]
  /** Workspace ID for updates */
  workspaceId: string
  /** Preset ID for updates */
  presetId: string
  /** Whether the section is disabled (e.g., during publish) */
  disabled?: boolean
  /** Whether to show the section header with + button */
  showHeader?: boolean
}

const generateVariableName = (
  type: 'text' | 'image',
  existingNames: string[],
): string => {
  // Generate default name
  const baseName = type === 'text' ? 'text_var' : 'image_var'
  const existingCount = existingNames.filter((n) => n.includes(baseName)).length
  return `${baseName}_${existingCount + 1}`
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
 *   media={preset.draft.mediaRegistry}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function VariablesSection({
  variables,
  media,
  workspaceId,
  presetId,
  disabled = false,
  showHeader = false,
}: VariablesSectionProps) {
  const [expandedVariableId, setExpandedVariableId] = useState<string | null>(null)
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

  // Handle add new variable (text or image)
  const handleAddVariable = useCallback(
    async (type: 'text' | 'image') => {
      try {
        // Generate default name
        const name = generateVariableName(type, existingNames)

        const newVariable: PresetVariable =
          type === 'text'
            ? {
                name,
                id: crypto.randomUUID(),
                type: 'text',
                defaultValue: null,
                valueMap: null,
              }
            : {
                name,
                id: crypto.randomUUID(),
                type: 'image',
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
    [variables, existingNames, updateVariables.mutateAsync],
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
    [variables, updateVariables.mutateAsync],
  )

  // Handle toggle expanded state (accordion pattern)
  const handleToggleExpanded = useCallback(
    (id: string) => {
      setExpandedVariableId((current) => (current === id ? null : id))
    },
    [],
  )

  // Handle update settings (inline editing, no dialog)
  const handleUpdateSettings = useCallback(
    async (
      variableId: string,
      updates: {
        defaultValue?: string | null
        valueMap?: { value: string; text: string }[] | null
      },
    ) => {
      try {
        const updatedVariables = variables.map((v) => {
          if (v.id === variableId && v.type === 'text') {
            return {
              ...v,
              ...(updates.defaultValue !== undefined && {
                defaultValue: updates.defaultValue,
              }),
              ...(updates.valueMap !== undefined && { valueMap: updates.valueMap }),
            }
          }
          return v
        })
        await updateVariables.mutateAsync(updatedVariables)
      } catch (error) {
        toast.error('Failed to update settings', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [variables, updateVariables.mutateAsync],
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
    [variables, updateVariables.mutateAsync],
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
    [variables, updateVariables.mutateAsync],
  )

  const isDisabled = disabled || updateVariables.isPending

  return (
    <div className="space-y-3">
      {/* Section Header with + button */}
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Variables</h2>
          <ContextDropdownMenu
            trigger={
              <Button
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add variable</span>
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
        </div>
      )}

      {/* Add Variable button (when no header) */}
      {!showHeader && (
        <ContextDropdownMenu
          trigger={
            <Button
              variant="outline"
              size="sm"
              disabled={isDisabled}
              className="h-8 gap-1.5 px-3 w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Variable</span>
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
      )}

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
            <div className="border-y">
              {variables.map((variable) => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  existingNames={existingNames}
                  media={media}
                  onRename={handleRename}
                  onUpdateSettings={handleUpdateSettings}
                  onDelete={handleDelete}
                  isExpanded={expandedVariableId === variable.id}
                  onToggleExpanded={handleToggleExpanded}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
