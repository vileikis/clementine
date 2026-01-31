# Quickstart Guide: Transform Pipeline Editor

**Feature**: Transform Pipeline Editor (Phase 1b-2)
**Date**: 2026-01-31
**Audience**: Developers implementing or extending this feature

## Overview

This guide provides step-by-step instructions for implementing and using the Transform Pipeline Editor feature. The editor enables experience creators to manage AI Image nodes in their transform pipeline through a dedicated UI in the `domains/experience/generate` domain.

---

## Prerequisites

### Required Knowledge

- React 19 + TypeScript
- TanStack Start, TanStack Router, TanStack Query
- Firebase Firestore (client SDK)
- Zustand state management
- shadcn/ui + Radix UI components
- Zod validation

### Required Setup

1. **Schemas**: Phase 1a must be complete (AI Image node schemas in `packages/shared`)
2. **Development environment**: Node.js, pnpm 10.18.1
3. **Firebase**: Firestore emulator or Firebase project configured
4. **Dependencies**: All listed in `apps/clementine-app/package.json`

---

## Implementation Checklist

### Phase 0: Research ✅ (Complete)

- [x] Understand AI Image node schemas
- [x] Review auto-save patterns
- [x] Review delete confirmation patterns
- [x] Review UI component library usage

### Phase 1: Setup & Structure

#### Step 1: Create Domain Structure

```bash
cd apps/clementine-app/src/domains/experience

# Create generate domain
mkdir -p generate/{components,containers,hooks,stores}

# Create index files for barrel exports
touch generate/components/index.ts
touch generate/containers/index.ts
touch generate/hooks/index.ts
touch generate/stores/index.ts
touch generate/index.ts
```

#### Step 2: Create Zustand Store

**File**: `domains/experience/generate/stores/useGenerateEditorStore.ts`

```typescript
import { create } from 'zustand'
import { createEditorStore, type EditorStoreState } from '@/shared/editor-status/stores/createEditorStore'

interface GenerateEditorState extends EditorStoreState {
  // Selected node state
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

export const useGenerateEditorStore = create<GenerateEditorState>()((set) => ({
  // Editor status tracking (from createEditorStore)
  ...createEditorStore(set),

  // Selected node state
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}))
```

**Export in `stores/index.ts`**:
```typescript
export { useGenerateEditorStore } from './useGenerateEditorStore'
```

### Phase 2: Hooks Implementation

#### Step 3: Update Transform Config Hook

**File**: `domains/experience/generate/hooks/useUpdateTransformConfig.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import type { TransformConfig } from '@clementine/shared'

interface UpdateTransformConfigInput {
  workspaceId: string
  experienceId: string
  transform: TransformConfig
}

export function useUpdateTransformConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, experienceId, transform }: UpdateTransformConfigInput) => {
      const docRef = doc(firestore, 'experiences', `${workspaceId}_${experienceId}`)

      await runTransaction(firestore, async (transaction) => {
        transaction.update(docRef, {
          'draft.transform': transform,
          draftVersion: increment(1),
          updatedAt: serverTimestamp(),
        })
      })

      return { workspaceId, experienceId }
    },
    onSuccess: ({ workspaceId, experienceId }) => {
      queryClient.invalidateQueries({
        queryKey: ['experience', workspaceId, experienceId],
      })
    },
  })
}
```

#### Step 4: Add Node Hook

**File**: `domains/experience/generate/hooks/useAddNode.ts`

```typescript
import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { TransformConfig, TransformNode, AIImageNodeConfig } from '@clementine/shared'
import { useUpdateTransformConfig } from './useUpdateTransformConfig'
import { useTrackedMutation } from '@/shared/editor-status/hooks/useTrackedMutation'
import { useGenerateEditorStore } from '../stores/useGenerateEditorStore'

interface UseAddNodeOptions {
  workspaceId: string
  experienceId: string
  transform: TransformConfig
  onTransformChange: (transform: TransformConfig) => void
}

export function useAddNode({
  workspaceId,
  experienceId,
  transform,
  onTransformChange,
}: UseAddNodeOptions) {
  const baseMutation = useUpdateTransformConfig()
  const store = useGenerateEditorStore()
  const updateTransform = useTrackedMutation(baseMutation, store)

  const addNode = useCallback(async () => {
    // Create default config
    const defaultConfig: AIImageNodeConfig = {
      model: 'gemini-2.5-pro',
      aspectRatio: '3:2',
      prompt: '',
      refMedia: [],
    }

    // Create new node
    const newNode: TransformNode = {
      id: nanoid(),
      type: 'ai.imageGeneration',
      config: defaultConfig,
    }

    // Update local state immediately
    const updatedTransform: TransformConfig = {
      ...transform,
      nodes: [...transform.nodes, newNode],
    }
    onTransformChange(updatedTransform)

    // Set as selected
    store.setSelectedNodeId(newNode.id)

    // Save to Firestore
    await updateTransform.mutateAsync({
      workspaceId,
      experienceId,
      transform: updatedTransform,
    })

    return newNode.id
  }, [workspaceId, experienceId, transform, onTransformChange, updateTransform, store])

  return { addNode, isPending: updateTransform.isPending }
}
```

#### Step 5: Delete Node Hook

**File**: `domains/experience/generate/hooks/useDeleteNode.ts`

```typescript
import { useCallback } from 'react'
import type { TransformConfig } from '@clementine/shared'
import { useUpdateTransformConfig } from './useUpdateTransformConfig'
import { useTrackedMutation } from '@/shared/editor-status/hooks/useTrackedMutation'
import { useGenerateEditorStore } from '../stores/useGenerateEditorStore'

interface UseDeleteNodeOptions {
  workspaceId: string
  experienceId: string
  transform: TransformConfig
  onTransformChange: (transform: TransformConfig) => void
}

export function useDeleteNode({
  workspaceId,
  experienceId,
  transform,
  onTransformChange,
}: UseDeleteNodeOptions) {
  const baseMutation = useUpdateTransformConfig()
  const store = useGenerateEditorStore()
  const updateTransform = useTrackedMutation(baseMutation, store)

  const deleteNode = useCallback(
    async (nodeId: string) => {
      // Update local state immediately
      const updatedTransform: TransformConfig = {
        ...transform,
        nodes: transform.nodes.filter((node) => node.id !== nodeId),
      }
      onTransformChange(updatedTransform)

      // Clear selection if deleted node was selected
      if (store.selectedNodeId === nodeId) {
        store.setSelectedNodeId(null)
      }

      // Save to Firestore
      await updateTransform.mutateAsync({
        workspaceId,
        experienceId,
        transform: updatedTransform,
      })
    },
    [workspaceId, experienceId, transform, onTransformChange, updateTransform, store]
  )

  return { deleteNode, isPending: updateTransform.isPending }
}
```

#### Step 6: Export Hooks

**File**: `domains/experience/generate/hooks/index.ts`

```typescript
export { useUpdateTransformConfig } from './useUpdateTransformConfig'
export { useAddNode } from './useAddNode'
export { useDeleteNode } from './useDeleteNode'
```

### Phase 3: Components Implementation

#### Step 7: Add Node Button

**File**: `domains/experience/generate/components/AddNodeButton.tsx`

```tsx
import { Button } from '@/ui-kit/ui/button'
import { Plus } from 'lucide-react'

interface AddNodeButtonProps {
  onClick: () => void
  isPending?: boolean
}

export function AddNodeButton({ onClick, isPending }: AddNodeButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      className="min-h-[44px]"
      size="lg"
    >
      <Plus className="mr-2 h-5 w-5" />
      Add Node
    </Button>
  )
}
```

#### Step 8: Node Card

**File**: `domains/experience/generate/components/AIImageNodeCard.tsx`

```tsx
import { Card } from '@/ui-kit/ui/card'
import { Badge } from '@/ui-kit/ui/badge'
import { Button } from '@/ui-kit/ui/button'
import { Trash2 } from 'lucide-react'
import type { TransformNode, AIImageNodeConfig } from '@clementine/shared'

interface AIImageNodeCardProps {
  node: TransformNode
  onSelect: () => void
  onDelete: () => void
  isSelected: boolean
}

export function AIImageNodeCard({
  node,
  onSelect,
  onDelete,
  isSelected,
}: AIImageNodeCardProps) {
  const config = node.config as AIImageNodeConfig

  return (
    <Card
      className={`p-4 cursor-pointer transition-colors group ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Badge variant="secondary" className="mb-2">
            AI Image Generation
          </Badge>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Model: {config.model}</div>
            <div>Aspect Ratio: {config.aspectRatio}</div>
            {config.prompt && (
              <div className="truncate">
                Prompt: {config.prompt.substring(0, 50)}
                {config.prompt.length > 50 ? '...' : ''}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </div>
    </Card>
  )
}
```

#### Step 9: Delete Confirmation Dialog

**File**: `domains/experience/generate/components/DeleteNodeDialog.tsx`

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui-kit/ui/alert-dialog'

interface DeleteNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export function DeleteNodeDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteNodeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Node?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The node and its configuration will
            be permanently removed from the transform pipeline.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="min-h-[44px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

#### Step 10: Node Editor Panel (Placeholder)

**File**: `domains/experience/generate/components/NodeEditorPanel.tsx`

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/ui-kit/ui/sheet'
import type { TransformNode } from '@clementine/shared'

interface NodeEditorPanelProps {
  node: TransformNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NodeEditorPanel({ node, open, onOpenChange }: NodeEditorPanelProps) {
  if (!node) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit AI Image Node</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Placeholder sections - implemented in future phases */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Model Settings</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1e: Model and aspect ratio controls
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Prompt</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1d: Lexical editor with mentions
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Reference Media</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1c: Upload and manage reference media
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Test Run</h3>
            <p className="text-sm text-muted-foreground">
              Phase 1g: Test prompt resolution and generate preview
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

#### Step 11: Export Components

**File**: `domains/experience/generate/components/index.ts`

```typescript
export { AddNodeButton } from './AddNodeButton'
export { AIImageNodeCard } from './AIImageNodeCard'
export { DeleteNodeDialog } from './DeleteNodeDialog'
export { NodeEditorPanel } from './NodeEditorPanel'
```

### Phase 4: Container Implementation

#### Step 12: Transform Pipeline Editor Container

**File**: `domains/experience/generate/containers/TransformPipelineEditor.tsx`

```tsx
import { useState, useCallback } from 'react'
import { EditorSaveStatus } from '@/shared/editor-status/components/EditorSaveStatus'
import { useGenerateEditorStore } from '../stores/useGenerateEditorStore'
import { useAddNode, useDeleteNode } from '../hooks'
import {
  AddNodeButton,
  AIImageNodeCard,
  DeleteNodeDialog,
  NodeEditorPanel,
} from '../components'
import type { TransformConfig } from '@clementine/shared'

interface TransformPipelineEditorProps {
  workspaceId: string
  experienceId: string
  transform: TransformConfig
  onTransformChange: (transform: TransformConfig) => void
}

export function TransformPipelineEditor({
  workspaceId,
  experienceId,
  transform,
  onTransformChange,
}: TransformPipelineEditorProps) {
  const store = useGenerateEditorStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)

  const { addNode, isPending: isAdding } = useAddNode({
    workspaceId,
    experienceId,
    transform,
    onTransformChange,
  })

  const { deleteNode, isPending: isDeleting } = useDeleteNode({
    workspaceId,
    experienceId,
    transform,
    onTransformChange,
  })

  const handleAddNode = useCallback(async () => {
    await addNode()
  }, [addNode])

  const handleDeleteClick = useCallback((nodeId: string) => {
    setNodeToDelete(nodeId)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (nodeToDelete) {
      await deleteNode(nodeToDelete)
      setDeleteDialogOpen(false)
      setNodeToDelete(null)
    }
  }, [nodeToDelete, deleteNode])

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      store.setSelectedNodeId(nodeId)
    },
    [store]
  )

  const handleCloseEditor = useCallback(() => {
    store.setSelectedNodeId(null)
  }, [store])

  const selectedNode = transform.nodes.find(
    (node) => node.id === store.selectedNodeId
  )

  return (
    <div className="space-y-4">
      {/* Save Status */}
      <div className="flex justify-end">
        <EditorSaveStatus
          pendingSaves={store.pendingSaves}
          lastCompletedAt={store.lastCompletedAt}
          successDuration={3000}
        />
      </div>

      {/* Node List or Empty State */}
      {transform.nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No transform nodes yet. Add your first AI Image node to get started.
          </p>
          <AddNodeButton onClick={handleAddNode} isPending={isAdding} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {transform.nodes.map((node) => (
              <AIImageNodeCard
                key={node.id}
                node={node}
                onSelect={() => handleSelectNode(node.id)}
                onDelete={() => handleDeleteClick(node.id)}
                isSelected={store.selectedNodeId === node.id}
              />
            ))}
          </div>
          <AddNodeButton onClick={handleAddNode} isPending={isAdding} />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteNodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />

      {/* Node Editor Panel */}
      <NodeEditorPanel
        node={selectedNode ?? null}
        open={!!store.selectedNodeId}
        onOpenChange={(open) => {
          if (!open) handleCloseEditor()
        }}
      />
    </div>
  )
}
```

#### Step 13: Export Container

**File**: `domains/experience/generate/containers/index.ts`

```typescript
export { TransformPipelineEditor } from './TransformPipelineEditor'
```

### Phase 5: Domain Public API

#### Step 14: Domain Index

**File**: `domains/experience/generate/index.ts`

```typescript
// Public API - export only components, hooks, and types
export { TransformPipelineEditor } from './containers'
export type { TransformPipelineEditorProps } from './containers/TransformPipelineEditor'

// Hooks (if needed outside domain)
export { useUpdateTransformConfig, useAddNode, useDeleteNode } from './hooks'

// DO NOT export stores (internal implementation detail)
```

---

## Usage Example

### In Experience Designer Route

```tsx
// app/routes/workspaces/$workspaceId/experiences/$experienceId/generate.tsx
import { TransformPipelineEditor } from '@/domains/experience/generate'
import { useExperience } from '@/domains/experience/shared/hooks/useExperience'

export default function GeneratePage() {
  const { workspaceId, experienceId } = Route.useParams()
  const { data: experience } = useExperience({ workspaceId, experienceId })
  const [transform, setTransform] = useState(experience.draft.transform)

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Transform Pipeline</h1>
      <TransformPipelineEditor
        workspaceId={workspaceId}
        experienceId={experienceId}
        transform={transform}
        onTransformChange={setTransform}
      />
    </div>
  )
}
```

---

## Testing

### Unit Tests

**Test file**: `domains/experience/generate/hooks/useAddNode.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAddNode } from './useAddNode'
import { describe, it, expect, vi } from 'vitest'

describe('useAddNode', () => {
  it('creates node with default config', async () => {
    const onTransformChange = vi.fn()
    const { result } = renderHook(() =>
      useAddNode({
        workspaceId: 'ws-1',
        experienceId: 'exp-1',
        transform: { nodes: [], outputFormat: null },
        onTransformChange,
      })
    )

    await result.current.addNode()

    await waitFor(() => {
      expect(onTransformChange).toHaveBeenCalled()
      const newTransform = onTransformChange.mock.calls[0][0]
      expect(newTransform.nodes).toHaveLength(1)
      expect(newTransform.nodes[0].config.model).toBe('gemini-2.5-pro')
    })
  })
})
```

### Manual Testing Checklist

- [ ] Add node creates new node with default config
- [ ] Node card displays model, aspect ratio, prompt preview
- [ ] Delete button shows on hover
- [ ] Delete confirmation dialog opens
- [ ] Delete confirmation removes node
- [ ] Click node card opens editor panel
- [ ] Editor panel shows placeholder sections
- [ ] Close editor panel clears selection
- [ ] Save status shows "Saving..." → "Saved"
- [ ] Empty state shows when no nodes
- [ ] Mobile: All buttons are 44x44px minimum
- [ ] Mobile: Touch interactions work smoothly

---

## Troubleshooting

### Issue: Save status not updating

**Solution**: Ensure `useTrackedMutation` wraps your mutation and store has `createEditorStore` mixin.

### Issue: Node not showing after creation

**Solution**: Check that `onTransformChange` updates local state immediately before Firestore save.

### Issue: Delete confirmation not closing

**Solution**: Ensure `onOpenChange` is called with `false` on successful deletion.

### Issue: Editor panel not opening

**Solution**: Verify `selectedNodeId` is being set in store when node card is clicked.

---

## Next Steps

After completing Phase 1b-2:

1. **Phase 1c**: Implement RefMedia management (upload, edit, delete)
2. **Phase 1d**: Implement Lexical prompt editor (mentions, autocomplete)
3. **Phase 1e**: Implement model and aspect ratio controls
4. **Phase 1f**: Implement prompt resolution logic
5. **Phase 1g**: Implement test run dialog
6. **Phase 1h**: Comprehensive testing and documentation

---

## Resources

- **TanStack Query**: https://tanstack.com/query
- **Zustand**: https://github.com/pmndrs/zustand
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Firebase Firestore**: https://firebase.google.com/docs/firestore

---

**Last Updated**: 2026-01-31
