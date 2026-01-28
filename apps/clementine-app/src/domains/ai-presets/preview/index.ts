// Barrel exports for AI Preset Preview domain

export type {
  TestInputState,
  TestInputValue,
  ResolvedPrompt,
  MediaReference,
  MediaReferenceList,
  ValidationError,
  ValidationWarning,
  ValidationState,
} from './types'

// Components
export { TestInputsForm } from './components/TestInputsForm'
export { AIPresetPreviewPanel } from './components/AIPresetPreviewPanel'
export { PromptPreview } from './components/PromptPreview'
export { MediaPreviewGrid } from './components/MediaPreviewGrid'
export { ValidationDisplay } from './components/ValidationDisplay'

// Store
export { useAIPresetPreviewStore } from './store/useAIPresetPreviewStore'

// Hooks
export { useTestInputs } from './hooks/useTestInputs'
export { usePromptResolution } from './hooks/usePromptResolution'
export { usePresetValidation } from './hooks/usePresetValidation'
export { useMediaReferences } from './hooks/useMediaReferences'

// Utilities
export {
  resolvePrompt,
  extractMediaReferences,
  parseReferences,
} from './lib/prompt-resolution'
export { validatePresetInputs } from './lib/validation'
export { isMediaReference } from './lib/type-guards'
