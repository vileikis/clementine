/**
 * AI Preset Editor Hooks
 *
 * Barrel export for all editor hooks.
 *
 * Hook Organization:
 * - useAIPreset: Real-time subscription to a single preset
 * - useUpdateAIPreset: Top-level fields (name, description)
 * - useUpdateAIPresetDraft: Generic draft config updates
 * - useUpdateModelSettings: Model + aspect ratio (section-specific)
 * - useUpdateMediaRegistry: Media registry CRUD (section-specific)
 * - useUpdateVariables: Variables CRUD (section-specific)
 * - usePublishAIPreset: Publish draft to live
 */

export { useAIPreset } from './useAIPreset'
export { usePublishAIPreset } from './usePublishAIPreset'
export { useUpdateAIPreset } from './useUpdateAIPreset'
export { useUpdateAIPresetDraft } from './useUpdateAIPresetDraft'
export { useUpdateMediaRegistry } from './useUpdateMediaRegistry'
export { useUpdateModelSettings } from './useUpdateModelSettings'
export { useUpdateVariables } from './useUpdateVariables'
