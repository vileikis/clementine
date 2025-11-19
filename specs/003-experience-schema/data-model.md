# Data Model: Evolve Experiences Schema

**Feature**: 003-experience-schema
**Date**: 2025-11-19
**Status**: Complete

## Overview

This document defines the data models for the evolved experiences schema using TypeScript discriminated unions. The new schema supports multiple experience types (photo, video, gif, wheel, survey) while maintaining backward compatibility with the existing flat photo experience schema.

## Entity Relationship Diagram

```
Event (1) ──< (N) Experience
                    │
                    ├─ PhotoExperience
                    ├─ VideoExperience (future)
                    ├─ GifExperience (future)
                    ├─ WheelExperience (future)
                    └─ SurveyExperience (future)
```

## Core Entities

### Base Experience (Shared Fields)

All experience types share these common fields:

```typescript
interface BaseExperience {
  // Identity
  id: string;                    // Firestore document ID
  eventId: string;               // Parent event reference

  // Core Configuration
  label: string;                 // Display name (max 50 chars)
  type: ExperienceType;          // Discriminator: "photo" | "video" | "gif" | "wheel" | "survey"
  enabled: boolean;              // Active/inactive toggle
  hidden: boolean;               // Hidden from guest UI (for drafts)

  // Preview Media (optional)
  previewPath?: string;          // Public URL to preview image/gif/video
  previewType?: PreviewType;     // "image" | "gif" | "video"

  // Audit
  createdAt: number;             // Unix timestamp (milliseconds)
  updatedAt: number;             // Unix timestamp (milliseconds)
}
```

**Storage Location**: `/events/{eventId}/experiences/{experienceId}`

**Validation Rules**:
- `label`: Required, 1-50 characters
- `type`: Required, one of: `"photo" | "video" | "gif" | "wheel" | "survey"`
- `enabled`: Required, boolean
- `hidden`: Required, boolean (defaults to false)
- `previewPath`: Optional, full public URL (when provided)
- `previewType`: Required when `previewPath` is provided
- `createdAt`, `updatedAt`: Required, positive integers

---

### PhotoExperience (Implemented)

Photo capture experience with countdown and overlay frame support.

```typescript
interface PhotoExperience extends BaseExperience {
  type: "photo";                 // Discriminator
  config: PhotoConfig;           // Type-specific configuration
  aiConfig: AiConfig;            // Shared AI configuration
}

interface PhotoConfig {
  countdown: number;             // Countdown duration in seconds (0-10), 0 = disabled
  overlayFramePath: string | null;  // Public URL to overlay frame image, null = no overlay
}

interface AiConfig {
  enabled: boolean;              // AI transformation enabled/disabled
  model: string | null;          // AI model identifier (e.g., "flux-schnell"), null = no model
  prompt: string | null;         // AI transformation prompt (max 600 chars), null = no prompt
  referenceImagePaths: string[] | null;  // Public URLs to reference images (max 5), null = no references
  aspectRatio: AspectRatio;      // Output aspect ratio
}

type AspectRatio = "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
```

**Default Values** (when creating new photo experience):
- `config.countdown`: `0` (no countdown)
- `config.overlayFramePath`: `null` (no overlay)
- `aiConfig.enabled`: `false` (AI disabled)
- `aiConfig.model`: `null` (no model)
- `aiConfig.prompt`: `null` (no prompt)
- `aiConfig.referenceImagePaths`: `null` (no references)
- `aiConfig.aspectRatio`: `"1:1"` (square format)

**Validation Rules**:
- `config.countdown`: Required, integer, 0-10 seconds (0 = disabled)
- `config.overlayFramePath`: Required, full public URL or null
- `aiConfig.enabled`: Required, boolean
- `aiConfig.model`: Required, non-empty string or null
- `aiConfig.prompt`: Required, max 600 characters or null
- `aiConfig.referenceImagePaths`: Required, array of public URLs (max 5 images) or null
- `aiConfig.aspectRatio`: Required, one of the enum values

**State Transitions**: None (photo experiences don't have workflow states)

---

### VideoExperience (Future - Schema Defined, UI Not Implemented)

Video capture experience with duration and retake configuration.

```typescript
interface VideoExperience extends BaseExperience {
  type: "video";
  config: VideoConfig;
  aiConfig: AiConfig;  // Same as PhotoExperience
}

interface VideoConfig {
  maxDurationSeconds: number;    // Maximum recording duration (1-60)
  allowRetake: boolean;          // Allow guest to re-record
  countdown?: number;            // Optional countdown before recording starts
}
```

**Default Values** (when implemented):
- `config.maxDurationSeconds`: `15`
- `config.allowRetake`: `true`
- `config.countdown`: `3`
- `aiConfig.enabled`: `false`
- `aiConfig.aspectRatio`: `"9:16"`

**Status**: Schema defined, UI disabled with "coming soon" indicator (FR-004)

---

### GifExperience (Future - Schema Defined, UI Not Implemented)

GIF capture experience (burst of photos converted to animated GIF).

```typescript
interface GifExperience extends BaseExperience {
  type: "gif";
  config: GifConfig;
  aiConfig: AiConfig;  // Same as PhotoExperience
}

interface GifConfig {
  frameCount: number;            // Number of frames to capture (3-10)
  intervalMs: number;            // Milliseconds between frames (100-1000)
  loopCount: number;             // 0 = infinite loop, N = loop N times
  countdown?: number;            // Optional countdown before first frame
}
```

**Default Values** (when implemented):
- `config.frameCount`: `5`
- `config.intervalMs`: `300` (0.3 seconds)
- `config.loopCount`: `0` (infinite)
- `config.countdown`: `3`
- `aiConfig.enabled`: `false`
- `aiConfig.aspectRatio`: `"1:1"`

**Status**: Schema defined, UI disabled with "coming soon" indicator (FR-004)

---

### WheelExperience (Future - Schema Defined, UI Not Implemented)

Interactive prize wheel experience (e.g., "Spin to Win").

```typescript
interface WheelExperience extends BaseExperience {
  type: "wheel";
  config: WheelConfig;
  // Note: WheelExperience does NOT use aiConfig (no AI transformation)
}

interface WheelConfig {
  items: WheelItem[];            // Wheel segments (2-12 items)
  spinDurationMs: number;        // Spin animation duration (2000-5000)
  autoSpin: boolean;             // Auto-spin on load vs. manual button
}

interface WheelItem {
  id: string;                    // Unique item ID
  label: string;                 // Display text on wheel segment
  weight: number;                // Probability weight (higher = more likely)
  color: string;                 // Hex color for wheel segment (#RRGGBB)
  imagePath?: string;            // Optional icon/image public URL
}
```

**Default Values** (when implemented):
- `config.spinDurationMs`: `3000` (3 seconds)
- `config.autoSpin`: `false`
- `config.items`: 4 default segments with equal weights

**Status**: Schema defined, UI disabled with "coming soon" indicator (FR-004)

**Related Collections**: WheelExperience may store selected items in `/events/{eventId}/sessions/{sessionId}` (future implementation)

---

### SurveyExperience (Future - Schema Defined, UI Not Implemented)

Survey experience (embedded survey steps within the photobooth flow).

```typescript
interface SurveyExperience extends BaseExperience {
  type: "survey";
  config: SurveyConfig;
  // Note: SurveyExperience does NOT use aiConfig (no AI transformation)
}

interface SurveyConfig {
  surveyStepIds: string[];       // Ordered array of surveyStep document IDs
  required: boolean;             // Must complete survey to proceed
  showProgressBar: boolean;      // Show "3 of 5" progress indicator
}
```

**Default Values** (when implemented):
- `config.required`: `false`
- `config.showProgressBar`: `true`
- `config.surveyStepIds`: `[]` (empty, creator adds steps)

**Status**: Schema defined, UI disabled with "coming soon" indicator (FR-004)

**Related Collections**: SurveySteps stored in `/events/{eventId}/surveySteps/{stepId}` (existing collection, not modified in this feature)

---

## Discriminated Union Type

The complete TypeScript discriminated union:

```typescript
type Experience =
  | PhotoExperience
  | VideoExperience
  | GifExperience
  | WheelExperience
  | SurveyExperience;
```

**Type Narrowing Example**:
```typescript
function renderExperienceConfig(experience: Experience) {
  switch (experience.type) {
    case "photo":
      // TypeScript knows: experience.config is PhotoConfig
      // TypeScript knows: experience.aiConfig exists
      return <PhotoConfigForm config={experience.config} aiConfig={experience.aiConfig} />;

    case "video":
      // TypeScript knows: experience.config is VideoConfig
      return <VideoConfigForm config={experience.config} />;

    case "wheel":
      // TypeScript knows: experience.config is WheelConfig
      // TypeScript knows: experience.aiConfig does NOT exist (no AI)
      return <WheelConfigForm config={experience.config} />;

    default:
      // Exhaustiveness check: if new type added, TypeScript will error here
      const _exhaustive: never = experience;
      return null;
  }
}
```

---

## Legacy Schema (Pre-Migration)

Before this feature, photo experiences used a flat schema:

```typescript
interface LegacyPhotoExperience {
  id: string;
  eventId: string;
  label: string;
  type: "photo";  // Always "photo" in legacy schema
  enabled: boolean;

  // Flat fields (to be migrated to config/aiConfig)
  previewPath?: string;
  previewType?: PreviewType;
  countdownEnabled?: boolean;      // → config.countdown (0 if false, N if true)
  countdownSeconds?: number;       // → config.countdown
  overlayEnabled?: boolean;        // (ignored, presence of overlayFramePath determines overlay)
  overlayFramePath?: string;       // → config.overlayFramePath

  // Flat AI fields (to be migrated to aiConfig)
  aiEnabled: boolean;              // → aiConfig.enabled
  aiModel?: string;                // → aiConfig.model
  aiPrompt?: string;               // → aiConfig.prompt
  aiReferenceImagePaths?: string[]; // → aiConfig.referenceImagePaths
  aiAspectRatio?: AspectRatio;     // → aiConfig.aspectRatio (default "1:1")

  createdAt: number;
  updatedAt: number;
}
```

**Migration Mapping**:
```typescript
// Old Schema → New Schema
{
  // Preserved as-is
  id, eventId, label, type, enabled, previewPath, previewType, createdAt, updatedAt

  // Migrated to config object
  countdownEnabled: boolean → config.countdown: number (0 if false, countdownSeconds if true)
  countdownSeconds: number → config.countdown: number
  overlayFramePath: string → config.overlayFramePath: string | null (null if missing)

  // Migrated to aiConfig object
  aiEnabled: boolean → aiConfig.enabled: boolean
  aiModel: string → aiConfig.model: string | null (null if missing)
  aiPrompt: string → aiConfig.prompt: string | null (null if missing)
  aiReferenceImagePaths: string[] → aiConfig.referenceImagePaths: string[] | null (null if missing)
  aiAspectRatio: AspectRatio → aiConfig.aspectRatio: AspectRatio (default "1:1")

  // Removed (deprecated)
  countdownEnabled, overlayEnabled
}
```

**Migration Trigger**: Automatic migration occurs when a legacy experience is saved via the builder UI (FR-008)

---

## Firestore Document Examples

### New Photo Experience (Created After Migration)

```json
{
  "id": "exp_abc123",
  "eventId": "evt_xyz789",
  "label": "Summer Photo Booth",
  "type": "photo",
  "enabled": true,
  "hidden": false,
  "previewPath": "https://storage.googleapis.com/bucket/images/preview/abc123.jpg",
  "previewType": "image",
  "config": {
    "countdown": 0,
    "overlayFramePath": "https://storage.googleapis.com/bucket/frames/summer.png"
  },
  "aiConfig": {
    "enabled": false,
    "model": null,
    "prompt": null,
    "referenceImagePaths": null,
    "aspectRatio": "1:1"
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

### Legacy Photo Experience (Before Migration)

```json
{
  "id": "exp_old456",
  "eventId": "evt_xyz789",
  "label": "Legacy Booth",
  "type": "photo",
  "enabled": true,
  "previewPath": "https://storage.googleapis.com/bucket/images/preview/old456.jpg",
  "previewType": "image",
  "countdownEnabled": true,
  "countdownSeconds": 3,
  "overlayEnabled": true,
  "overlayFramePath": "https://storage.googleapis.com/bucket/frames/legacy.png",
  "aiEnabled": true,
  "aiModel": "flux-schnell",
  "aiPrompt": "Transform into vintage polaroid style",
  "aiReferenceImagePaths": [
    "https://storage.googleapis.com/bucket/refs/vintage1.jpg"
  ],
  "aiAspectRatio": "1:1",
  "createdAt": 1690000000000,
  "updatedAt": 1690000000000
}
```

### Migrated Photo Experience (After Save)

```json
{
  "id": "exp_old456",
  "eventId": "evt_xyz789",
  "label": "Legacy Booth",
  "type": "photo",
  "enabled": true,
  "hidden": false,
  "previewPath": "https://storage.googleapis.com/bucket/images/preview/old456.jpg",
  "previewType": "image",
  "config": {
    "countdown": 3,
    "overlayFramePath": "https://storage.googleapis.com/bucket/frames/legacy.png"
  },
  "aiConfig": {
    "enabled": true,
    "model": "flux-schnell",
    "prompt": "Transform into vintage polaroid style",
    "referenceImagePaths": [
      "https://storage.googleapis.com/bucket/refs/vintage1.jpg"
    ],
    "aspectRatio": "1:1"
  },
  "createdAt": 1690000000000,
  "updatedAt": 1700000000000
}
```

**Note**: `countdownEnabled`, `countdownSeconds`, `overlayEnabled`, `aiEnabled`, `aiModel`, `aiPrompt`, `aiReferenceImagePaths`, `aiAspectRatio` fields removed after migration (FR-010)

---

## Validation Schemas (Zod)

### PhotoExperience Schema

```typescript
import { z } from "zod";

// Enum schemas
export const experienceTypeSchema = z.enum([
  "photo",
  "video",
  "gif",
  "wheel",
  "survey",
]);

export const previewTypeSchema = z.enum(["image", "gif", "video"]);

export const aspectRatioSchema = z.enum([
  "1:1",
  "3:4",
  "4:5",
  "9:16",
  "16:9",
]);

// Base experience schema
const baseExperienceSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  label: z.string().min(1).max(50),
  type: experienceTypeSchema,
  enabled: z.boolean(),
  hidden: z.boolean().default(false),
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// Type-specific config schemas
const photoConfigSchema = z.object({
  countdown: z.number().int().min(0).max(10),
  overlayFramePath: z.string().url().nullable(),
});

const aiConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string().nullable(),
  prompt: z.string().max(600).nullable(),
  referenceImagePaths: z.array(z.string().url()).max(5).nullable(),
  aspectRatio: aspectRatioSchema,
});

// Photo experience schema
export const photoExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("photo"),
  config: photoConfigSchema,
  aiConfig: aiConfigSchema,
});

// Discriminated union (full schema)
export const experienceSchema = z.discriminatedUnion("type", [
  photoExperienceSchema,
  // Future: videoExperienceSchema, gifExperienceSchema, etc.
]);

// Creation/update schemas
export const createPhotoExperienceSchema = z.object({
  label: z.string().trim().min(1, "Experience name is required").max(50),
  type: z.literal("photo"),
});

export const updatePhotoExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),
  config: photoConfigSchema.partial().optional(),
  aiConfig: aiConfigSchema.partial().optional(),
}).strict();

// Type exports
export type PhotoExperience = z.infer<typeof photoExperienceSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type PhotoConfig = z.infer<typeof photoConfigSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
```

---

## Indexing Strategy

### Firestore Indexes

**Composite Indexes** (required for queries):
```
Collection: experiences (subcollection under events/{eventId})
Fields: enabled ASC, type ASC, createdAt DESC
```

**Single-Field Indexes** (auto-created by Firestore):
- `type` (for filtering by experience type)
- `enabled` (for filtering active/inactive)
- `hidden` (for filtering visible/hidden)
- `createdAt` (for sorting by creation date)

**Common Queries**:
```typescript
// Get all enabled photo experiences for an event
db.collection(`events/${eventId}/experiences`)
  .where("type", "==", "photo")
  .where("enabled", "==", true)
  .orderBy("createdAt", "desc");

// Get all visible experiences (not hidden)
db.collection(`events/${eventId}/experiences`)
  .where("hidden", "==", false)
  .orderBy("createdAt", "desc");
```

---

## Data Migration

### Migration Function (Pseudo-code)

```typescript
function migratePhotoExperience(legacyData: unknown): PhotoExperience {
  // Step 1: Check if already migrated
  if ("config" in legacyData && "aiConfig" in legacyData) {
    // Already migrated, validate and return
    return photoExperienceSchema.parse(legacyData);
  }

  // Step 2: Extract legacy fields
  const {
    countdownEnabled,
    countdownSeconds,
    overlayEnabled,
    overlayFramePath,
    aiEnabled,
    aiModel,
    aiPrompt,
    aiReferenceImagePaths,
    aiAspectRatio,
    ...baseFields
  } = legacyData;

  // Step 3: Build new schema
  const migrated = {
    ...baseFields,
    type: "photo",
    hidden: baseFields.hidden ?? false,
    config: {
      countdown: countdownEnabled ? (countdownSeconds ?? 3) : 0,
      overlayFramePath: overlayFramePath ?? null,
    },
    aiConfig: {
      enabled: aiEnabled ?? false,
      model: aiModel ?? null,
      prompt: aiPrompt ?? null,
      referenceImagePaths: aiReferenceImagePaths ?? null,
      aspectRatio: aiAspectRatio ?? "1:1",
    },
  };

  // Step 4: Validate migrated data
  return photoExperienceSchema.parse(migrated);
}
```

**Location**: `web/src/features/experiences/lib/migration.ts`

**Testing**: See `migration.test.ts` for comprehensive test cases

---

## References

- **Feature Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Firebase Standards**: `/standards/backend/firebase.md`
- **Validation Standards**: `/standards/global/validation.md`
- **Zod Documentation**: https://zod.dev/
