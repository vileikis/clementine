// ============================================================================
// Shared components
// ============================================================================
export { ExperiencesList } from "./components/shared/ExperiencesList";
export { CreateExperienceForm } from "./components/shared/CreateExperienceForm";
export { ExperienceTypeSelector } from "./components/shared/ExperienceTypeSelector";
export { ExperienceEditor } from "./components/shared/ExperienceEditor";
export { ExperienceEditorWrapper } from "./components/shared/ExperienceEditorWrapper";
export { PreviewMediaUpload } from "./components/shared/PreviewMediaUpload";
export { BaseExperienceFields } from "./components/shared/BaseExperienceFields";
export { DeleteExperienceButton } from "./components/shared/DeleteExperienceButton";
export { AITransformSettings } from "./components/shared/AITransformSettings";
export { ExperiencesSidebar as DesignSidebar } from "./components/shared/ExperiencesSidebar";

// ============================================================================
// Photo-specific components
// ============================================================================
export { PhotoExperienceEditor } from "./components/photo/PhotoExperienceEditor";
export { CountdownSettings } from "./components/photo/CountdownSettings";
export { OverlaySettings } from "./components/photo/OverlaySettings";

// ============================================================================
// GIF-specific components
// ============================================================================
export { GifExperienceEditor } from "./components/gif/GifExperienceEditor";
export { GifCaptureSettings } from "./components/gif/GifCaptureSettings";


// ============================================================================
// Server Actions - NOT EXPORTED from public API
// ============================================================================
// Server Actions should be imported directly from their source files to avoid
// bundling server-only code (Firebase Admin SDK, next/headers) in client bundles.
//
// Import Server Actions directly:
// import { createPhotoAiPreset } from "@/features/ai-presets/actions/photo-create";
// import { updatePhotoAiPreset } from "@/features/ai-presets/actions/photo-update";
// import { deleteAiPreset } from "@/features/ai-presets/actions/shared";
// import { uploadPreviewMedia, deletePreviewMedia } from "@/features/ai-presets/actions/photo-media";
//
// Type exports (safe for client):
export type { ActionResponse } from "./actions/types";

// ============================================================================
// Repository - NOT EXPORTED from public API
// Repository functions contain server-only code (Firebase Admin SDK)
// Import directly when needed: @/features/ai-presets/repositories
// ============================================================================
// NOTE: Repository functions are NOT exported from public API to avoid
// bundling server-only code in client bundles. Import directly from
// @/features/ai-presets/repositories in server-only code.

// ============================================================================
// Constants
// ============================================================================
export {
  AI_MODELS,
  DEFAULT_AI_MODEL,
} from "./constants";

// ============================================================================
// Types (compile-time only)
// Refactored for normalized Firestore design (data-model-v4)
// ============================================================================
export type {
  // New naming convention
  AiPreset,
  PhotoAiPreset,
  GifAiPreset,
  VideoAiPreset,
  AiPresetType,
  // Legacy aliases for backward compatibility
  Experience,
  PhotoExperience,
  GifExperience,
  VideoExperience,
  ExperienceType,
  // Common types
  PreviewType,
  AspectRatio,
  PhotoCaptureConfig,
  GifCaptureConfig,
  VideoCaptureConfig,
  AiPhotoConfig,
  AiVideoConfig,
} from "./schemas";

// ============================================================================
// Validation Schemas (Safe to export)
// ============================================================================
export {
  // New naming convention
  aiPresetTypeSchema,
  aiPresetSchema,
  photoAiPresetSchema,
  gifAiPresetSchema,
  videoAiPresetSchema,
  createPhotoAiPresetSchema,
  updatePhotoAiPresetSchema,
  createGifAiPresetSchema,
  updateGifAiPresetSchema,
  // Legacy aliases for backward compatibility
  experienceTypeSchema,
  experienceSchema,
  photoExperienceSchema,
  gifExperienceSchema,
  videoExperienceSchema,
  createPhotoExperienceSchema,
  updatePhotoExperienceSchema,
  createGifExperienceSchema,
  updateGifExperienceSchema,
  // Common schemas
  previewTypeSchema,
  aspectRatioSchema,
  uploadPreviewMediaSchema,
  previewMediaResultSchema,
  // Legacy aliases for backward compatibility during migration
  createPhotoExperienceSchema as createExperienceSchema,
  updatePhotoExperienceSchema as updateExperienceSchema,
} from "./schemas";
