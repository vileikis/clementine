/**
 * AI Presets Domain
 *
 * Centralized exports for the AI presets feature.
 * Contains components, containers, and hooks for managing AI presets.
 */

// Components
export { AIPresetItem } from './components/AIPresetItem'
export { AIPresetsList } from './components/AIPresetsList'
export { CreateAIPresetButton } from './components/CreateAIPresetButton'
export { RenameAIPresetDialog } from './components/RenameAIPresetDialog'
export { DeleteAIPresetDialog } from './components/DeleteAIPresetDialog'

// Containers
export { AIPresetsPage } from './containers/AIPresetsPage'

// Hooks
export { useWorkspaceAIPresets } from './hooks/useWorkspaceAIPresets'
export { useCreateAIPreset } from './hooks/useCreateAIPreset'
export { useDuplicateAIPreset } from './hooks/useDuplicateAIPreset'
export { useRenameAIPreset } from './hooks/useRenameAIPreset'
export { useDeleteAIPreset } from './hooks/useDeleteAIPreset'

// Types (re-export from shared)
export type {
  AIPreset,
  AIPresetStatus,
  AIModel,
  AspectRatio,
} from '@clementine/shared'
