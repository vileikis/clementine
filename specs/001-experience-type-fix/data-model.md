# Data Model: Experience Type System

**Branch**: `001-experience-type-fix`
**Date**: 2025-11-20
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines the consolidated Experience data model using the discriminated union schema from `web/src/features/experiences/lib/schemas.ts`. After migration, `PhotoExperience` is the only implemented type (video, gif, wheel, survey are future types).

## PhotoExperience Entity

### Schema Location

**Canonical source**: `web/src/features/experiences/lib/schemas.ts`

- Zod schema: `photoExperienceSchema`
- TypeScript type: `PhotoExperience` (inferred from schema)

### Entity Structure

```typescript
type PhotoExperience = {
  // Identity
  id: string;                    // Firestore document ID
  eventId: string;               // Parent event reference
  type: "photo";                 // Discriminator (literal type)

  // Configuration
  label: string;                 // Display name (1-50 chars)
  enabled: boolean;              // Visibility in guest flow
  hidden: boolean;               // Hidden from UI (default: false)

  // Type-Specific Configuration
  config: {
    countdown: number;           // 0 = disabled, 1-10 = countdown seconds
    overlayFramePath: string | null; // Public URL or null
  };

  // AI Configuration
  aiConfig: {
    enabled: boolean;
    model: string | null;        // e.g., "nanobanana", null = no model
    prompt: string | null;       // Max 600 chars, null = no prompt
    referenceImagePaths: string[] | null; // Max 5 URLs, null = no references
    aspectRatio: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
  };

  // Optional Preview Media
  previewPath?: string;          // Public URL
  previewType?: "image" | "gif" | "video";

  // Audit Fields
  createdAt: number;             // Unix timestamp (milliseconds)
  updatedAt: number;             // Unix timestamp (milliseconds)
};
```

## Field Documentation

### Identity Fields

#### `id: string`
- **Description**: Unique identifier for the experience
- **Source**: Firestore auto-generated document ID
- **Validation**: Non-empty string (enforced by Zod)
- **Immutable**: Yes (never changes after creation)

#### `eventId: string`
- **Description**: Reference to parent Event document
- **Source**: Provided at creation, matches `/events/{eventId}`
- **Validation**: Non-empty string (enforced by Zod)
- **Immutable**: Yes (experiences belong to one event)

#### `type: "photo"`
- **Description**: Discriminator for type-safe union
- **Source**: Literal value `"photo"`
- **Validation**: Must be exactly `"photo"` (enforced by Zod literal type)
- **Immutable**: Yes (type cannot change after creation)
- **Future**: Other types (`"video"`, `"gif"`, `"wheel"`, `"survey"`) will have separate schemas

### Configuration Fields

#### `label: string`
- **Description**: Human-readable name displayed in UI
- **Constraints**: 1-50 characters
- **Validation**: `z.string().min(1).max(50)`
- **Example**: "AI Headshots", "Professional Photo", "Fun Filters"
- **Mutable**: Yes (can be updated via Server Actions)

#### `enabled: boolean`
- **Description**: Controls visibility in guest photo flow
- **Default**: `true` (enabled by default)
- **Validation**: `z.boolean()`
- **Behavior**: When `false`, experience is hidden from guests
- **Mutable**: Yes

#### `hidden: boolean`
- **Description**: Hides experience from UI lists (soft delete)
- **Default**: `false` (visible in lists)
- **Validation**: `z.boolean().default(false)`
- **Behavior**: When `true`, experience is filtered from admin dashboard lists
- **Mutable**: Yes

### Type-Specific Configuration: `config`

Nested object containing photo-specific settings.

#### `config.countdown: number`
- **Description**: Countdown timer before photo capture
- **Range**: 0-10 (inclusive)
- **Validation**: `z.number().int().min(0).max(10)`
- **Behavior**:
  - `0` = countdown disabled (instant capture)
  - `1-10` = countdown seconds displayed to user
- **Default**: `3` (on creation)
- **Mutable**: Yes

#### `config.overlayFramePath: string | null`
- **Description**: Public URL to frame overlay image
- **Validation**: `z.string().url().nullable()`
- **Behavior**:
  - `null` = no overlay applied
  - URL string = overlay composited on captured photo
- **Storage**: Full public URL from Firebase Storage (not relative path)
- **Default**: `null` (no overlay)
- **Mutable**: Yes

### AI Configuration: `aiConfig`

Nested object containing AI transformation settings.

#### `aiConfig.enabled: boolean`
- **Description**: Enables AI transformation pipeline
- **Default**: `false` (AI disabled)
- **Validation**: `z.boolean()`
- **Behavior**: When `false`, photo is saved without AI processing
- **Mutable**: Yes

#### `aiConfig.model: string | null`
- **Description**: AI model identifier for transformation
- **Validation**: `z.string().nullable()`
- **Examples**: `"nanobanana"`, `"stable-diffusion"`, `null`
- **Behavior**: `null` = no model selected (AI disabled)
- **Default**: `null`
- **Mutable**: Yes
- **Future**: Enum validation once models are finalized

#### `aiConfig.prompt: string | null`
- **Description**: Text prompt for AI image generation
- **Constraints**: Max 600 characters
- **Validation**: `z.string().max(600).nullable()`
- **Example**: "Professional headshot with office background, natural lighting"
- **Behavior**: `null` = no prompt (AI may use default)
- **Default**: `null`
- **Mutable**: Yes

#### `aiConfig.referenceImagePaths: string[] | null`
- **Description**: Array of reference image URLs for AI style transfer
- **Constraints**: Max 5 images
- **Validation**: `z.array(z.string().url()).max(5).nullable()`
- **Storage**: Full public URLs from Firebase Storage
- **Behavior**: `null` = no reference images
- **Default**: `null`
- **Mutable**: Yes

#### `aiConfig.aspectRatio: AspectRatio`
- **Description**: Output aspect ratio for AI-generated image
- **Validation**: `z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"])`
- **Options**:
  - `"1:1"` - Square (Instagram post)
  - `"3:4"` - Portrait (classic photo)
  - `"4:5"` - Portrait (Instagram portrait)
  - `"9:16"` - Vertical (Instagram story, TikTok)
  - `"16:9"` - Landscape (widescreen)
- **Default**: `"1:1"`
- **Mutable**: Yes

### Preview Media (Optional)

#### `previewPath?: string`
- **Description**: Public URL to preview media (shown in experience selector)
- **Validation**: `z.string().url().optional()`
- **Storage**: Full public URL from Firebase Storage
- **Behavior**: When present, displayed as visual preview in UI
- **Default**: `undefined` (no preview)
- **Mutable**: Yes

#### `previewType?: PreviewType`
- **Description**: Media type of preview
- **Validation**: `z.enum(["image", "gif", "video"]).optional()`
- **Behavior**: Determines how preview is rendered (img, video player, etc.)
- **Requirement**: Must be present if `previewPath` is set
- **Default**: `undefined`
- **Mutable**: Yes

### Audit Fields

#### `createdAt: number`
- **Description**: Creation timestamp (Unix milliseconds)
- **Validation**: `z.number().int().positive()`
- **Source**: `Date.now()` at creation time
- **Immutable**: Yes (never updated)

#### `updatedAt: number`
- **Description**: Last modification timestamp (Unix milliseconds)
- **Validation**: `z.number().int().positive()`
- **Source**: `Date.now()` at creation and each update
- **Mutable**: Yes (updated on every write)

## Relationships

### Parent: Event

- **Relationship**: Many-to-One (many experiences belong to one event)
- **Firestore Path**: `/events/{eventId}/experiences/{experienceId}`
- **Reference Field**: `eventId` (string)
- **Cascade Delete**: When event is deleted, all experiences should be deleted
- **Counter**: Parent event tracks `experiencesCount` (incremented/decremented on create/delete)

### Children: None

PhotoExperience has no child collections in the current schema.

### Related Collections (Siblings)

- **Sessions**: `/events/{eventId}/sessions/{sessionId}` - Guest interactions that reference experiences
- **ExperienceItems**: `/events/{eventId}/experienceItems/{itemId}` - Items for wheel-type experiences (future)

## Validation Rules

### Zod Schema

All validation is enforced by `photoExperienceSchema` in `lib/schemas.ts`:

```typescript
export const photoExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("photo"),
  config: photoConfigSchema,
  aiConfig: aiConfigSchema,
});
```

### Validation Points

1. **Repository Layer**: All read operations validate with `photoExperienceSchema.parse()`
2. **Action Layer**: Create/update inputs validated with `createPhotoExperienceSchema` and `updatePhotoExperienceSchema`
3. **Client Components**: Form inputs validated with same schemas (client-side UX, not security)

### Error Handling

**Zod Validation Errors**:
- Type: `ZodError` with detailed path and message
- Behavior: Thrown from repository reads, caught by Server Actions
- Response: Converted to user-friendly `ActionResponse<T>` error

**Example Error**:
```typescript
{
  success: false,
  error: "Invalid experience data: config.countdown must be between 0 and 10"
}
```

## State Transitions

### Creation Flow

1. User submits create form → Server Action receives input
2. Input validated with `createPhotoExperienceSchema.parse()`
3. Server Action creates document with defaults:
   - `type: "photo"`
   - `enabled: true`
   - `hidden: false`
   - `config: { countdown: 3, overlayFramePath: null }`
   - `aiConfig: { enabled: false, model: null, prompt: null, referenceImagePaths: null, aspectRatio: "1:1" }`
4. Document saved to `/events/{eventId}/experiences/{id}`
5. Repository reads and validates with `photoExperienceSchema.parse()`
6. Parent event `experiencesCount` incremented

### Update Flow

1. User submits update form → Server Action receives partial input
2. Input validated with `updatePhotoExperienceSchema.parse()`
3. Server Action merges partial update with existing document
4. Document updated in Firestore with new `updatedAt` timestamp
5. Repository reads and validates with `photoExperienceSchema.parse()`

### Delete Flow

1. User clicks delete → Server Action receives `experienceId`
2. Document deleted from `/events/{eventId}/experiences/{id}`
3. Parent event `experiencesCount` decremented
4. Related media (overlayFramePath, referenceImagePaths, previewPath) cleaned up

## Firestore Document Example

```json
{
  "id": "exp_abc123",
  "eventId": "evt_xyz789",
  "type": "photo",
  "label": "Professional Headshots",
  "enabled": true,
  "hidden": false,

  "config": {
    "countdown": 3,
    "overlayFramePath": "https://storage.googleapis.com/bucket/frames/corporate-frame.png"
  },

  "aiConfig": {
    "enabled": true,
    "model": "nanobanana",
    "prompt": "Professional corporate headshot, office background, soft lighting, business attire",
    "referenceImagePaths": [
      "https://storage.googleapis.com/bucket/references/style1.jpg",
      "https://storage.googleapis.com/bucket/references/style2.jpg"
    ],
    "aspectRatio": "1:1"
  },

  "previewPath": "https://storage.googleapis.com/bucket/previews/headshot-preview.jpg",
  "previewType": "image",

  "createdAt": 1700000000000,
  "updatedAt": 1700000100000
}
```

## Migration Notes

### Legacy Structure (Before Consolidation)

The legacy `Experience` type from `types/experience.types.ts` had a flat structure:

```typescript
// ❌ Legacy (deleted)
type Experience = {
  id: string;
  eventId: string;
  label: string;
  type: "photo" | "video" | "gif" | "wheel";
  enabled: boolean;

  // Flat fields (no nesting)
  countdownEnabled: boolean;
  countdownSeconds: number;
  aiEnabled: boolean;
  aiModel: string;
  aiPrompt: string;
  // ... more flat fields
};
```

### Key Differences

| Legacy | New Schema | Change |
|--------|------------|--------|
| `countdownEnabled` + `countdownSeconds` | `config.countdown` (0 = disabled) | Combined into single number |
| `aiEnabled`, `aiModel`, `aiPrompt`, etc. | `aiConfig` object | Grouped into nested object |
| `allowCamera`, `allowLibrary` | (removed) | No longer used |
| Type assertion `as Experience` | Zod validation `.parse()` | Runtime safety added |

### Migration Strategy

**Clean slate approach** (no backward compatibility):
1. Wipe all Firestore Experience documents
2. Delete `types/experience.types.ts`
3. Update all imports to use `schemas.ts`
4. Add validation to repository reads
5. Test CRUD operations with new schema

**No migration utilities** needed (development stage, no production data).

## Future Extensions

### Other Experience Types (Not in Scope)

The schema architecture supports future experience types via discriminated union:

- **VideoExperience**: `type: "video"` with `videoConfigSchema`
- **GifExperience**: `type: "gif"` with `gifConfigSchema`
- **WheelExperience**: `type: "wheel"` with `wheelConfigSchema` (no aiConfig)
- **SurveyExperience**: `type: "survey"` with `surveyConfigSchema` (no aiConfig)

All future types follow the same pattern:
1. Define type-specific config schema
2. Extend `baseExperienceSchema` with `type` literal and `config`
3. Add to `experienceSchema` discriminated union
4. Update repository to handle new type

## References

- **Zod Schemas**: `web/src/features/experiences/lib/schemas.ts`
- **Repository**: `web/src/features/experiences/lib/repository.ts`
- **Server Actions**: `web/src/features/experiences/actions/photo-*.ts`
- **Firestore Path**: `/events/{eventId}/experiences/{experienceId}`
- **Constitution**: Mobile-First (Principle I), Type-Safe Development (Principle III), Firebase Architecture (Principle VI)
