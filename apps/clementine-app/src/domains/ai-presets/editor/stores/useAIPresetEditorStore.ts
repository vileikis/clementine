/**
 * AI Preset Editor Store
 *
 * Zustand store for tracking editor save state.
 * Uses the shared createEditorStore factory for consistency.
 */
import { createEditorStore } from '@/shared/editor-status'

export const useAIPresetEditorStore = createEditorStore()
