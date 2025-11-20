// ============================================================================
// Shared components
// ============================================================================
export { ExperiencesList } from "./components/shared/ExperiencesList";
export { CreateExperienceForm } from "./components/shared/CreateExperienceForm";
export { ExperienceTypeSelector } from "./components/shared/ExperienceTypeSelector";
export { ExperienceEditor } from "./components/shared/ExperienceEditor";
export { ExperienceEditorWrapper } from "./components/shared/ExperienceEditorWrapper";
export { PreviewMediaUpload } from "./components/shared/PreviewMediaUpload";

// ============================================================================
// Photo-specific components
// ============================================================================
export { AITransformSettings } from "./components/photo/AITransformSettings";
export { CountdownSettings } from "./components/photo/CountdownSettings";
export { OverlaySettings } from "./components/photo/OverlaySettings";


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
// Import directly when needed: @/features/experiences/lib/repository
// ============================================================================
// NOTE: Repository functions are NOT exported from public API to avoid
// bundling server-only code in client bundles. Import directly from
// @/features/experiences/lib/repository in server-only code.

// ============================================================================
// Constants
// ============================================================================
export { AI_MODELS, DEFAULT_AI_MODEL } from "./lib/constants";

// ============================================================================
// Types (compile-time only)
// ============================================================================
export type {
  PhotoExperience,
  ExperienceType,
  PreviewType,
  AspectRatio,
} from "./lib/schemas";

// ============================================================================
// Validation Schemas (Safe to export)
// ============================================================================
export {
  experienceTypeSchema,
  previewTypeSchema,
  aspectRatioSchema,
  experienceSchema,
  photoExperienceSchema,
  surveyStepTypeSchema,
  surveyStepSchema,
  createPhotoExperienceSchema,
  updatePhotoExperienceSchema,
  uploadPreviewMediaSchema,
  previewMediaResultSchema,
  createSurveyStepSchema,
  updateSurveyStepSchema,
  // Legacy aliases for backward compatibility during migration
  createPhotoExperienceSchema as createExperienceSchema,
  updatePhotoExperienceSchema as updateExperienceSchema,
} from "./lib/schemas";
