/**
 * TransformPipelineEditor Container
 *
 * Main editor container for managing transform pipeline nodes.
 * Integrates add/delete logic, node list display, empty state, and delete dialog.
 */
import { useState } from 'react'

import {
  AIImageNodeCard,
  AddNodeButton,
  DeleteNodeDialog,
  EmptyState,
} from '../components'
import { useAddNode, useDeleteNode } from '../hooks'
import type { Experience } from '../../shared/schemas'

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
 * - Add new AI Image nodes
 * - Display node list with cards
 * - Delete nodes with confirmation
 * - Empty state when no nodes
 * - Delete dialog state management
 *
 * User Story 1 (P1): Complete CRUD operations for AI Image nodes
 */
export function TransformPipelineEditor({
  experience,
  workspaceId,
}: TransformPipelineEditorProps) {
  const addNode = useAddNode()
  const deleteNode = useDeleteNode()

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)

  const nodes = experience.draft.transform?.nodes ?? []
  const hasNodes = nodes.length > 0

  const handleAddNode = async () => {
    await addNode.mutateAsync({ experience, workspaceId })
  }

  const handleDeleteClick = (nodeId: string) => {
    setNodeToDelete(nodeId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!nodeToDelete) return

    await deleteNode.mutateAsync({
      experience,
      workspaceId,
      nodeId: nodeToDelete,
    })

    setDeleteDialogOpen(false)
    setNodeToDelete(null)
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Node button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Transform Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Manage AI Image nodes in your transform pipeline
          </p>
        </div>
        {hasNodes && (
          <AddNodeButton
            onClick={handleAddNode}
            isPending={addNode.isPending}
          />
        )}
      </div>

      {/* Node list or empty state */}
      {hasNodes ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node) => (
            <AIImageNodeCard
              key={node.id}
              node={node}
              onDelete={() => handleDeleteClick(node.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onAddNode={handleAddNode} isPending={addNode.isPending} />
      )}

      {/* Delete confirmation dialog */}
      <DeleteNodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isPending={deleteNode.isPending}
      />
    </div>
  )
}
