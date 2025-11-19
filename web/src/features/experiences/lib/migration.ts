/**
 * Migration utilities for evolving experience schema from flat structure to discriminated unions
 *
 * This module handles migrating legacy photo experiences to the new schema structure with
 * nested `config` and `aiConfig` objects. Migration is triggered automatically on save operations.
 */

import { photoExperienceSchema, type PhotoExperience } from "./schemas";

/**
 * Legacy photo experience fields (pre-migration)
 */
interface LegacyPhotoExperience {
  id: string;
  eventId: string;
  label: string;
  type: "photo";
  enabled: boolean;
  hidden?: boolean;

  // Preview fields
  previewPath?: string;
  previewType?: "image" | "gif" | "video";

  // Legacy countdown fields (to be migrated to config)
  countdownEnabled?: boolean;
  countdownSeconds?: number;
  overlayEnabled?: boolean; // deprecated, will be ignored
  overlayFramePath?: string;

  // Legacy AI fields (to be migrated to aiConfig)
  aiEnabled?: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiReferenceImagePaths?: string[];
  aiAspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";

  // Audit fields
  createdAt: number;
  updatedAt: number;

  // New schema fields (if already partially migrated)
  config?: {
    countdown?: number;
    overlayFramePath?: string | null;
  };
  aiConfig?: {
    enabled?: boolean;
    model?: string | null;
    prompt?: string | null;
    referenceImagePaths?: string[] | null;
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
  };
}

/**
 * Checks if an experience document has already been migrated to the new schema
 */
function isAlreadyMigrated(data: unknown): boolean {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const record = data as Record<string, unknown>;

  // Check if both config and aiConfig exist with required structure
  const hasConfig =
    typeof record.config === "object" &&
    record.config !== null &&
    "countdown" in record.config &&
    "overlayFramePath" in record.config;

  const hasAiConfig =
    typeof record.aiConfig === "object" &&
    record.aiConfig !== null &&
    "enabled" in record.aiConfig &&
    "aspectRatio" in record.aiConfig;

  return hasConfig && hasAiConfig;
}

/**
 * Migrates a legacy photo experience document to the new discriminated union schema.
 *
 * Migration rules:
 * 1. If document already has `config` and `aiConfig`, validate and return as-is
 * 2. Extract legacy flat fields and restructure into nested objects
 * 3. Apply default values for missing fields
 * 4. Remove deprecated fields (countdownEnabled, overlayEnabled)
 * 5. Validate migrated document against photoExperienceSchema
 *
 * @param legacyData - Legacy photo experience document from Firestore
 * @returns Validated PhotoExperience document with new schema structure
 * @throws {Error} If migration fails or validation fails
 */
export function migratePhotoExperience(
  legacyData: unknown
): PhotoExperience {
  // Step 1: Check if already migrated
  if (isAlreadyMigrated(legacyData)) {
    return photoExperienceSchema.parse(legacyData);
  }

  // Step 2: Type guard and extract fields
  if (typeof legacyData !== "object" || legacyData === null) {
    throw new Error("Invalid legacy data: expected object");
  }

  const legacy = legacyData as LegacyPhotoExperience;

  // Step 3: Build new schema structure
  const migrated: PhotoExperience = {
    // Preserve base fields
    id: legacy.id,
    eventId: legacy.eventId,
    label: legacy.label,
    type: "photo",
    enabled: legacy.enabled,
    hidden: legacy.hidden ?? false,

    // Preserve preview fields
    ...(legacy.previewPath && { previewPath: legacy.previewPath }),
    ...(legacy.previewType && { previewType: legacy.previewType }),

    // Migrate countdown configuration
    // Priority: config.countdown > countdownSeconds (if countdownEnabled) > default 0
    config: {
      countdown:
        legacy.config?.countdown ??
        (legacy.countdownEnabled ? (legacy.countdownSeconds ?? 3) : 0),
      overlayFramePath:
        legacy.config?.overlayFramePath ??
        legacy.overlayFramePath ??
        null,
    },

    // Migrate AI configuration
    // Priority: aiConfig fields > legacy flat fields > defaults
    aiConfig: {
      enabled: legacy.aiConfig?.enabled ?? legacy.aiEnabled ?? false,
      model: legacy.aiConfig?.model ?? legacy.aiModel ?? null,
      prompt: legacy.aiConfig?.prompt ?? legacy.aiPrompt ?? null,
      referenceImagePaths:
        legacy.aiConfig?.referenceImagePaths ??
        legacy.aiReferenceImagePaths ??
        null,
      aspectRatio:
        legacy.aiConfig?.aspectRatio ?? legacy.aiAspectRatio ?? "1:1",
    },

    // Preserve audit fields
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
  };

  // Step 4: Validate migrated data against schema
  try {
    return photoExperienceSchema.parse(migrated);
  } catch (error) {
    throw new Error(
      `Migration validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Strips legacy fields from a migrated photo experience document.
 * This is called after migration to clean up deprecated fields before writing to Firestore.
 *
 * @param migratedData - Migrated photo experience with potential legacy fields
 * @returns Clean photo experience with only new schema fields
 */
export function stripLegacyFields(
  migratedData: PhotoExperience & Partial<LegacyPhotoExperience>
): PhotoExperience {
  const {
    // Legacy fields to remove
    countdownEnabled,
    countdownSeconds,
    overlayEnabled,
    aiEnabled,
    aiModel,
    aiPrompt,
    aiReferenceImagePaths,
    aiAspectRatio,
    // Keep only new schema fields
    ...cleanData
  } = migratedData as PhotoExperience & Record<string, unknown>;

  return cleanData as PhotoExperience;
}
