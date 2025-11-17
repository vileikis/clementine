# Data Model: Photo Experience Tweaks

**Date**: 2025-11-17
**Feature**: Photo Experience Tweaks ([spec.md](./spec.md))
**Purpose**: Document data schema changes and validation rules

## Overview

This feature modifies the existing `Experience` entity in Firestore to support:
1. Preview media (image/GIF/video) with type tracking
2. Countdown timer configuration
3. Simplified overlay configuration (frame only, remove logo)
4. AI transformation enhancements (aspect ratio)

All schema changes are additive or deprecative (no hard deletions) to maintain backward compatibility with existing data.

---

## Entity: Experience

**Collection Path**: `/events/{eventId}/experiences/{experienceId}`

**Purpose**: Stores configuration for a photo/video/gif/wheel experience within an event

### Schema Changes

#### New Fields (Added)

| Field                 | Type                             | Required | Default | Validation                        | Description                                      |
| --------------------- | -------------------------------- | -------- | ------- | --------------------------------- | ------------------------------------------------ |
| `countdownEnabled`    | `boolean`                        | No       | `false` | N/A                               | Whether countdown timer is enabled before capture |
| `countdownSeconds`    | `number` (integer)               | No       | `3`     | `min(0).max(10)`                  | Countdown duration in seconds (0-10)             |
| `aiAspectRatio`       | `string` (enum)                  | No       | `"1:1"` | `enum(["1:1", "3:4", "4:5", "9:16", "16:9"])` | Aspect ratio for AI-generated output            |

#### Existing Fields (Modified Validation)

| Field              | Type                          | Change                                                 | Description                                   |
| ------------------ | ----------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `previewPath`      | `string`                      | Now supports image/GIF/video (was image only)         | Public URL to preview media in Firebase Storage |
| `previewType`      | `"image" \| "gif" \| "video"` | Enum expanded to include `"gif"` and `"video"`         | Type of preview media                         |
| `overlayFramePath` | `string`                      | Still supported (no change)                            | Public URL to frame overlay image             |

#### Deprecated Fields (Removed from Validation)

| Field              | Type      | Status                                    | Migration Strategy                               |
| ------------------ | --------- | ----------------------------------------- | ------------------------------------------------ |
| `allowCamera`      | `boolean` | Deprecated - removed from schema validation | Keep as optional in TypeScript interface         |
| `allowLibrary`     | `boolean` | Deprecated - removed from schema validation | Keep as optional in TypeScript interface         |
| `overlayLogoPath`  | `string`  | Deprecated - removed from schema validation | Keep as optional in TypeScript interface         |
| `maxDurationMs`    | `number`  | Deprecated - removed from schema validation | Keep as optional in TypeScript interface (video-specific) |
| `frameCount`       | `number`  | Deprecated - removed from schema validation | Keep as optional in TypeScript interface (gif-specific) |
| `captureIntervalMs`| `number`  | Deprecated - removed from schema validation | Keep as optional in TypeScript interface (gif-specific) |

**Rationale for Deprecation**:
- Capture options (`allowCamera`, `allowLibrary`) → Feature spec explicitly removes capture options
- Logo overlay (`overlayLogoPath`) → Feature spec simplifies to single frame overlay only
- Video/GIF-specific fields → Out of scope for photo experience tweaks (may be restored in future video/gif features)

---

## Zod Schema Updates

### Experience Schema (Full Entity Validation)

**File**: `web/src/lib/schemas/firestore.ts`

```typescript
export const aspectRatioSchema = z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]);

export const experienceSchema = z.object({
  id: z.string(),
  eventId: z.string(),

  // Basic configuration
  label: z.string().min(1).max(50),
  type: experienceTypeSchema, // "photo" | "video" | "gif" | "wheel"
  enabled: z.boolean(),

  // Preview configuration (MODIFIED - expanded type support)
  previewPath: z.string().optional(),
  previewType: previewTypeSchema.optional(), // "image" | "gif" | "video"

  // Countdown configuration (NEW)
  countdownEnabled: z.boolean().default(false),
  countdownSeconds: z.number().int().min(0).max(10).default(3),

  // Overlay configuration (MODIFIED - logo removed)
  overlayFramePath: z.string().optional(),
  // overlayLogoPath: REMOVED from validation

  // AI transformation configuration (MODIFIED - aspect ratio added)
  aiEnabled: z.boolean(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
  aiAspectRatio: aspectRatioSchema.default("1:1"), // NEW

  createdAt: z.number(),
  updatedAt: z.number(),

  // Deprecated fields removed from validation:
  // - allowCamera
  // - allowLibrary
  // - overlayLogoPath
  // - maxDurationMs
  // - frameCount
  // - captureIntervalMs
});
```

### Update Experience Schema (Partial Updates via Server Actions)

**File**: `web/src/lib/schemas/firestore.ts`

```typescript
export const updateExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),

  // Preview media
  previewPath: z.string().optional(),
  previewType: previewTypeSchema.optional(),

  // Countdown settings (NEW)
  countdownEnabled: z.boolean().optional(),
  countdownSeconds: z.number().int().min(0).max(10).optional(),

  // Overlay settings
  overlayFramePath: z.string().optional(),
  // overlayLogoPath: REMOVED

  // AI transformation
  aiEnabled: z.boolean().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
  aiAspectRatio: aspectRatioSchema.optional(), // NEW

  // Deprecated fields removed:
  // - allowCamera
  // - allowLibrary
  // - maxDurationMs, frameCount, captureIntervalMs
});
```

### Preview Media Upload Schema (New)

**File**: `web/src/lib/schemas/firestore.ts`

```typescript
// Validation for preview media uploads
export const uploadPreviewMediaSchema = z.object({
  file: z.instanceof(File),
  fileType: z.enum(["image", "gif", "video"]),
  maxSizeBytes: z.number().default(10 * 1024 * 1024), // 10MB default
});

// Validation result after upload
export const previewMediaResultSchema = z.object({
  publicUrl: z.string().url(),
  fileType: previewTypeSchema,
  sizeBytes: z.number(),
});
```

---

## TypeScript Interface Updates

### Experience Interface

**File**: `web/src/lib/types/firestore.ts`

```typescript
export interface Experience {
  id: string;
  eventId: string;

  // Basic configuration
  label: string;
  type: "photo" | "video" | "gif" | "wheel";
  enabled: boolean;

  // Preview configuration
  previewPath?: string;
  previewType?: "image" | "gif" | "video"; // MODIFIED - expanded

  // Countdown configuration (NEW)
  countdownEnabled: boolean;
  countdownSeconds: number;

  // Overlay configuration
  overlayFramePath?: string;
  overlayLogoPath?: string; // DEPRECATED - marked optional, not removed

  // AI transformation configuration
  aiEnabled: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiReferenceImagePaths?: string[];
  aiAspectRatio: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"; // NEW

  createdAt: number;
  updatedAt: number;

  // Deprecated fields (kept for backward compatibility with legacy data)
  allowCamera?: boolean; // DEPRECATED
  allowLibrary?: boolean; // DEPRECATED
  maxDurationMs?: number; // DEPRECATED
  frameCount?: number; // DEPRECATED
  captureIntervalMs?: number; // DEPRECATED
}
```

---

## Validation Rules

### Preview Media Validation

**Purpose**: Ensure uploaded preview media meets file type and size requirements

```typescript
// Client-side validation (UX feedback)
const validatePreviewMedia = (file: File): boolean => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, GIF, MP4, WebM");
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size: 10MB");
  }

  return true;
};

// Server-side validation (security)
const validatePreviewMediaServer = uploadPreviewMediaSchema.parse({
  file,
  fileType: detectFileType(file),
  maxSizeBytes: 10 * 1024 * 1024,
});
```

### Countdown Timer Validation

**Purpose**: Ensure countdown timer is within acceptable range

```typescript
// Validation in Zod schema
countdownSeconds: z.number().int().min(0).max(10)

// UI validation (immediate feedback)
const validateCountdownSeconds = (value: number): string | null => {
  if (value < 0) return "Countdown cannot be negative";
  if (value > 10) return "Countdown cannot exceed 10 seconds";
  if (!Number.isInteger(value)) return "Countdown must be a whole number";
  return null; // Valid
};
```

### Aspect Ratio Validation

**Purpose**: Ensure only supported aspect ratios are selected

```typescript
// Validation in Zod schema
aiAspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"])

// No custom aspect ratios allowed (YAGNI principle)
```

---

## State Transitions

### Experience Lifecycle (No Changes)

The Experience entity lifecycle remains unchanged:

```
[Created] → [Enabled] → [Disabled] → [Deleted]
                ↓          ↑
                └──────────┘
                (toggleable)
```

**States**:
- **Created**: Experience exists in Firestore with `enabled: false` by default
- **Enabled**: Experience visible to guests (`enabled: true`)
- **Disabled**: Experience hidden from guests (`enabled: false`)
- **Deleted**: Experience document deleted from Firestore (soft delete in future)

**New Field Defaults on Creation**:
```typescript
{
  countdownEnabled: false,
  countdownSeconds: 3,
  aiAspectRatio: "1:1",
  // ... other fields
}
```

---

## Data Migration Strategy

### Approach: Graceful Degradation (No Hard Migration)

**Principles**:
1. **Backward Compatible**: Existing experiences retain deprecated fields
2. **Forward Only**: New experiences created after deploy will not have deprecated fields
3. **UI Hides Deprecated**: ExperienceEditor UI does not display or allow editing deprecated fields
4. **Validation Prevents New**: Zod schemas prevent new experiences from including deprecated fields

### Migration Phases

#### Phase 1: Deploy Schema Changes (This Feature)
- Update Zod schemas to remove deprecated field validation
- Update TypeScript interfaces to mark deprecated fields as optional
- Update UI to hide deprecated fields

**Result**: Existing data unaffected, new data clean

#### Phase 2: Background Cleanup (Future Task - Optional)
- Script to identify experiences with deprecated fields
- Bulk update to remove deprecated fields from Firestore
- Only needed if storage optimization becomes priority

**Query**:
```typescript
// Find experiences with deprecated fields
const experiencesWithDeprecatedFields = await db
  .collectionGroup("experiences")
  .where("allowCamera", "!=", null)
  .get();
```

**Cleanup**:
```typescript
// Remove deprecated fields (Server Action)
await updateDoc(experienceRef, {
  allowCamera: deleteField(),
  allowLibrary: deleteField(),
  overlayLogoPath: deleteField(),
  // etc.
});
```

---

## Storage Considerations

### Firebase Storage Paths

**Preview Media**:
```
/events/{eventId}/experiences/{experienceId}/preview/{filename}
```

**Frame Overlays**:
```
/events/{eventId}/experiences/{experienceId}/overlay/{filename}
```

**Public URL Format**:
```
https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
```

### Storage Quotas (Firebase Free Tier)

- **Total Storage**: 5GB
- **Download/Day**: 1GB
- **Upload Limit**: 10MB per file (enforced in validation)

**Optimization Recommendations**:
1. Compress videos before upload (documented in quickstart.md)
2. Use efficient formats: WebM for video, WebP for images
3. Delete old preview media when replaced (handled in Server Action)

### Media Deletion Pattern

**Fault-Tolerant Cleanup Approach** (see `deletePreviewMedia` in `web/src/lib/actions/experiences.ts`):

The media deletion strategy prioritizes data integrity over strict cleanup by continuing to clear Firestore references even if Storage deletion fails:

```typescript
// 1. Authenticate request
// 2. Verify experience exists in Firestore
// 3. Attempt to delete file from Firebase Storage
try {
  const storagePath = extractStoragePath(previewPath);
  await bucket.file(storagePath).delete();
} catch (error) {
  console.error("Failed to delete preview media from storage:", error);
  // Continue to clear Firestore fields even if storage deletion fails
  // (file might already be deleted or inaccessible)
}

// 4. Always clear Firestore fields (prevents orphaned references)
await experienceRef.update({
  previewPath: null,
  previewType: null,
  updatedAt: Date.now(),
});
```

**Rationale**:
- **Prevents orphaned Firestore references**: Database always stays consistent even if Storage deletion fails
- **Handles edge cases gracefully**: File might already be deleted, permissions might have changed, or network errors might occur
- **User experience priority**: Users can retry operations without getting stuck in error states
- **Storage cleanup remains eventual**: Orphaned Storage files can be cleaned up via separate maintenance scripts if needed

**Trade-offs**:
- ✅ Database integrity guaranteed
- ✅ Resilient to Storage service issues
- ⚠️ May leave orphaned files in Storage (rare, acceptable for free tier limits)

---

## Summary of Changes

| Change Type          | Entity       | Fields Affected                                   | Impact                                  |
| -------------------- | ------------ | ------------------------------------------------- | --------------------------------------- |
| **New Fields**       | Experience   | `countdownEnabled`, `countdownSeconds`, `aiAspectRatio` | Additive - no breaking changes          |
| **Modified Fields**  | Experience   | `previewType` enum expanded (gif, video)          | Additive - backward compatible          |
| **Deprecated Fields**| Experience   | `allowCamera`, `allowLibrary`, `overlayLogoPath`, etc. | Removed from validation, kept in TS     |
| **Validation**       | Zod schemas  | Added countdown/aspect ratio validation, removed deprecated | Server-side enforcement                 |
| **Storage**          | Firebase     | Preview media supports video/GIF                  | No schema changes, just usage           |

---

## Testing Checklist

- [ ] Zod schema validation tests for new fields (countdown, aspect ratio)
- [ ] Preview media upload validation (file type, size limits)
- [ ] TypeScript compilation with deprecated fields marked optional
- [ ] Experience creation with new defaults (countdownEnabled: false, aiAspectRatio: "1:1")
- [ ] Experience update validation prevents setting deprecated fields
- [ ] Existing experiences with deprecated fields can still be read (no errors)
- [ ] Preview media delete removes file from Firebase Storage
- [ ] Overlay frame upload replaces old overlay and deletes old file
