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
// import { createPhotoExperience } from "@/features/experiences/actions/photo-create";
// import { updatePhotoExperience } from "@/features/experiences/actions/photo-update";
// import { deleteExperience } from "@/features/experiences/actions/shared";
// import { uploadPreviewMedia, deletePreviewMedia } from "@/features/experiences/actions/photo-media";
//
// Type exports (safe for client):
export type { ActionResponse } from "./actions/types";

// ============================================================================
// Repository - NOT EXPORTED from public API
// Repository functions contain server-only code (Firebase Admin SDK)
// Import directly when needed: @/features/experiences/repositories
// ============================================================================
// NOTE: Repository functions are NOT exported from public API to avoid
// bundling server-only code in client bundles. Import directly from
// @/features/experiences/repositories in server-only code.

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
  Experience,
  PhotoExperience,
  GifExperience,
  VideoExperience,
  ExperienceType,
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
  experienceTypeSchema,
  previewTypeSchema,
  aspectRatioSchema,
  experienceSchema,
  photoExperienceSchema,
  gifExperienceSchema,
  videoExperienceSchema,
  createPhotoExperienceSchema,
  updatePhotoExperienceSchema,
  createGifExperienceSchema,
  updateGifExperienceSchema,
  uploadPreviewMediaSchema,
  previewMediaResultSchema,
  // Legacy aliases for backward compatibility during migration
  createPhotoExperienceSchema as createExperienceSchema,
  updatePhotoExperienceSchema as updateExperienceSchema,
} from "./schemas";
