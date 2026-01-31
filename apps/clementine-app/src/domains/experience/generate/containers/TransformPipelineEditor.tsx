/**
 * TransformPipelineEditor Container
 *
 * Main editor container for managing transform pipeline nodes.
 * Single-column layout with collapsible node items and drag-drop reordering.
 */
import { useState } from 'react'
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
import { Plus } from 'lucide-react'

import { DeleteNodeDialog, EmptyState, NodeListItem } from '../components'
import { useUpdateTransformConfig } from '../hooks'
import { addNode, duplicateNode, removeNode, reorderNodes } from '../lib'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Experience } from '../../shared/schemas'
import { Button } from '@/ui-kit/ui/button'
import { ScrollArea } from '@/ui-kit/ui/scroll-area'

export interface TransformPipelineEditorProps {
  /** Experience with transform configuration */
  experience: Experience
  /** Workspace ID containing the experience */
  workspaceId: string
}

/**
 * Transform Pipeline Editor
 *
 * Features:
 * - Single-column layout with collapsible nodes
 * - Drag and drop reordering
 * - Add, duplicate, delete nodes
 * - Inline node settings (expanded by default)
 * - Auto-save with status indicator
 *
 * User Story 1 (P1): Complete CRUD operations for AI Image nodes
 * User Story 2 (P2): Configure node settings via inline collapsible
 */
export function TransformPipelineEditor({
  experience,
  workspaceId,
}: TransformPipelineEditorProps) {
  const updateTransform = useUpdateTransformConfig(workspaceId, experience.id)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)

  const transform = experience.draft.transform
  const nodes = transform?.nodes ?? []
  const hasNodes = nodes.length > 0

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

  const handleAddNode = () => {
    updateTransform.mutate({ transform: addNode(transform) })
  }

  const handleDuplicateNode = (nodeId: string) => {
    updateTransform.mutate({ transform: duplicateNode(transform, nodeId) })
  }

  const handleDeleteClick = (nodeId: string) => {
    setNodeToDelete(nodeId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!nodeToDelete) return

    updateTransform.mutate({ transform: removeNode(transform, nodeToDelete) })
    setDeleteDialogOpen(false)
    setNodeToDelete(null)
  }

  // Handle drag end to reorder nodes
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = nodes.findIndex((node) => node.id === active.id)
      const newIndex = nodes.findIndex((node) => node.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newNodes = [...nodes]
        const [movedNode] = newNodes.splice(oldIndex, 1)
        newNodes.splice(newIndex, 0, movedNode)
        updateTransform.mutate({ transform: reorderNodes(transform, newNodes) })
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Transform Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Configure AI transformations for your experience
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasNodes && (
            <Button
              onClick={handleAddNode}
              disabled={updateTransform.isPending}
              className="min-h-[44px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Node
            </Button>
          )}
        </div>
      </div>

      {/* Node list */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {hasNodes ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={nodes.map((node) => node.id)}
                strategy={verticalListSortingStrategy}
              >
                {nodes.map((node, index) => (
                  <NodeListItem
                    key={node.id}
                    node={node}
                    index={index + 1}
                    onDuplicate={() => handleDuplicateNode(node.id)}
                    onDelete={() => handleDeleteClick(node.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <EmptyState
              onAddNode={handleAddNode}
              isPending={updateTransform.isPending}
            />
          )}

          {/* Add node button at bottom when nodes exist */}
          {hasNodes && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleAddNode}
                disabled={updateTransform.isPending}
                className="min-h-[44px]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Node
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <DeleteNodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isPending={updateTransform.isPending}
      />
    </div>
  )
}
