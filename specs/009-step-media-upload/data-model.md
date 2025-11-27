# Data Model: Step Media Upload

**Feature**: 009-step-media-upload
**Date**: 2025-11-27

## Entity Changes

### Step (existing entity - modified)

**Collection**: `/events/{eventId}/steps/{stepId}`

#### New Fields

| Field       | Type                                      | Required | Description                                     |
|-------------|-------------------------------------------|----------|-------------------------------------------------|
| `mediaType` | `"image" \| "gif" \| "video" \| "lottie"` | No       | Type of media for proper rendering              |

#### Existing Fields (unchanged)

| Field         | Type         | Required | Description                          |
|---------------|--------------|----------|--------------------------------------|
| `id`          | string       | Yes      | Step document ID                     |
| `eventId`     | string       | Yes      | Parent event ID                      |
| `journeyId`   | string       | Yes      | Parent journey ID                    |
| `type`        | StepType     | Yes      | Step type discriminator              |
| `title`       | string       | No       | Display title                        |
| `description` | string       | No       | Subtitle/helper text                 |
| `mediaUrl`    | string (URL) | No       | Public URL to media asset            |
| `ctaLabel`    | string       | No       | Button text                          |
| `config`      | object       | Varies   | Type-specific configuration          |
| `createdAt`   | number       | Yes      | Creation timestamp                   |
| `updatedAt`   | number       | Yes      | Last update timestamp                |

## Type Definitions

### StepMediaType (new)

```typescript
// web/src/features/steps/types/step.types.ts

/**
 * Media types supported in step editors
 */
export type StepMediaType = "image" | "gif" | "video" | "lottie";
```

### StepBase (modified)

```typescript
// web/src/features/steps/types/step.types.ts

/**
 * Base fields shared by all step types
 */
export interface StepBase {
  id: string;
  eventId: string;
  journeyId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;  // NEW
  ctaLabel?: string | null;
  createdAt: number;
  updatedAt: number;
}
```

## Schema Definitions

### stepBaseSchema (modified)

```typescript
// web/src/features/steps/schemas/step.schemas.ts

/**
 * Media type enum schema
 */
export const stepMediaTypeSchema = z.enum(["image", "gif", "video", "lottie"]);

/**
 * Step base schema - fields shared by all step types
 */
const stepBaseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  journeyId: z.string(),
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  mediaType: stepMediaTypeSchema.nullish(),  // NEW
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

### updateStepInputSchema (modified)

```typescript
// web/src/features/steps/schemas/step.schemas.ts

/**
 * Update step input schema
 */
export const updateStepInputSchema = z.object({
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  mediaType: stepMediaTypeSchema.nullish(),  // NEW
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  config: z.record(z.string(), z.unknown()).optional(),
});
```

## Validation Rules

### File Upload Validation

```typescript
// web/src/features/steps/utils/media-validation.ts

export const MEDIA_VALIDATION = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  gif: {
    mimeTypes: ["image/gif"],
    extensions: [".gif"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm"],
    extensions: [".mp4", ".webm"],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  lottie: {
    mimeTypes: ["application/json"],
    extensions: [".json"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
} as const;
```

### Lottie Structure Validation

```typescript
// web/src/features/steps/utils/lottie-validation.ts

/**
 * Minimum required fields for a valid Lottie JSON
 */
export interface LottieJSON {
  v: string;       // Version
  fr: number;      // Frame rate
  ip: number;      // In point (start frame)
  op: number;      // Out point (end frame)
  w: number;       // Width
  h: number;       // Height
  layers: unknown[]; // Animation layers
}

export function isValidLottie(json: unknown): json is LottieJSON {
  if (typeof json !== "object" || json === null) return false;
  const obj = json as Record<string, unknown>;
  return (
    typeof obj.v === "string" &&
    typeof obj.fr === "number" &&
    typeof obj.ip === "number" &&
    typeof obj.op === "number" &&
    typeof obj.w === "number" &&
    typeof obj.h === "number" &&
    Array.isArray(obj.layers)
  );
}
```

## Storage Structure

### Firebase Storage Paths

```
media/
└── {companyId}/
    ├── image/
    │   └── {timestamp}-{filename}.{ext}
    ├── gif/
    │   └── {timestamp}-{filename}.gif
    ├── video/
    │   └── {timestamp}-{filename}.{ext}
    └── lottie/
        └── {timestamp}-{filename}.json
```

**Path Pattern**: `media/{companyId}/{mediaType}/{timestamp}-{filename}`

**Example URLs**:
- `https://storage.googleapis.com/{bucket}/media/abc123/image/1701234567890-hero.png`
- `https://storage.googleapis.com/{bucket}/media/abc123/video/1701234567890-intro.mp4`

## Backward Compatibility

### Existing Steps Without mediaType

Steps created before this feature will have `mediaUrl` but no `mediaType`. The system handles this by:

1. **At Read Time**: Infer type from URL extension
2. **At Display Time**: Use inferred type for rendering
3. **At Edit Time**: Set `mediaType` when user uploads new media

```typescript
// web/src/features/steps/utils/media-type.ts

/**
 * Infer media type from URL extension for backward compatibility
 */
export function inferMediaTypeFromUrl(url: string): StepMediaType {
  const ext = url.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) return "image";
  if (ext === "gif") return "gif";
  if (["mp4", "webm"].includes(ext ?? "")) return "video";
  if (ext === "json") return "lottie";

  return "image"; // Safe default
}

/**
 * Get media type, using stored value or inferring from URL
 */
export function getMediaType(
  mediaType: StepMediaType | null | undefined,
  mediaUrl: string | null | undefined
): StepMediaType | null {
  if (mediaType) return mediaType;
  if (mediaUrl) return inferMediaTypeFromUrl(mediaUrl);
  return null;
}
```

## Migration Notes

- **No data migration required**: New `mediaType` field is optional
- **Backward compatible**: Existing steps render correctly via URL inference
- **Forward compatible**: New uploads set `mediaType` explicitly
