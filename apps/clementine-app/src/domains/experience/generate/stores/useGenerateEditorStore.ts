/**
 * Generate Editor Store
 *
 * Manages UI state for the transform pipeline editor:
 * - Selected node ID for editor panel
 * - Save status tracking (via createEditorStore mixin)
 */
import { create } from 'zustand'

import type { EditorStore } from '@/shared/editor-status/types'
import { createEditorStore } from '@/shared/editor-status/store/createEditorStore'

interface GenerateEditorState extends EditorStore {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

/**
 * Store for transform pipeline editor state
 *
 * Combines editor save tracking with node selection state
 */
export const useGenerateEditorStore = create<GenerateEditorState>()((set) => {
  const editorStore = createEditorStore()

  return {
    // Mixin: editor save status tracking
    ...editorStore.getState(),
    startSave: editorStore.getState().startSave,
    completeSave: editorStore.getState().completeSave,
    resetSaveState: editorStore.getState().resetSaveState,

    // Node selection state
    selectedNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  }
})
