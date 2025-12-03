# Data Model: Experience Editor Tabs (Design & Settings)

**Feature Branch**: `001-exp-settings-routes`
**Date**: 2025-12-03
**Status**: Complete

---

## Overview

This feature extends the existing `Experience` entity with preview media fields to support visual identification in the experience list and configurable settings.

---

## Entity: Experience (Extended)

### Current Schema

```typescript
interface Experience {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  stepsOrder: string[];
  status: ExperienceStatus; // "active" | "deleted"
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Extended Schema (This Feature)

```typescript
interface Experience {
  // Existing fields (unchanged)
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  stepsOrder: string[];
  status: ExperienceStatus;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;

  // NEW: Preview media fields
  previewMediaUrl?: string | null;  // Full public URL from Firebase Storage
  previewType?: "image" | "gif" | null;  // Type discriminator for rendering
}
```

### Field Specifications

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `previewMediaUrl` | `string \| null` | No | Valid URL, max 2048 chars | Full public URL to preview media in Firebase Storage |
| `previewType` | `"image" \| "gif" \| null` | No | Enum | Media type for rendering logic (image vs animated GIF) |

### Validation Rules

```typescript
// Zod schema extensions
const previewMediaSchema = z.object({
  previewMediaUrl: z
    .string()
    .url("Invalid URL format")
    .max(2048, "URL too long")
    .nullable()
    .optional(),
  previewType: z
    .enum(["image", "gif"])
    .nullable()
    .optional(),
});

// Combined with existing update schema
const updateExperienceSettingsInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(200, "Experience name too long")
    .optional(),
  description: z
    .string()
    .max(1000, "Description too long")
    .nullable()
    .optional(),
  previewMediaUrl: z
    .string()
    .url("Invalid URL format")
    .max(2048, "URL too long")
    .nullable()
    .optional(),
  previewType: z
    .enum(["image", "gif"])
    .nullable()
    .optional(),
});
```

### State Transitions

| Action | Before | After | Side Effects |
|--------|--------|-------|--------------|
| Upload preview media | `previewMediaUrl: null` | `previewMediaUrl: "<url>"` | File stored in Firebase Storage |
| Remove preview media | `previewMediaUrl: "<url>"` | `previewMediaUrl: null` | (File optionally deleted from Storage) |
| Update name | `name: "old"` | `name: "new"` | `updatedAt` timestamp updated |
| Update description | `description: null` | `description: "text"` | `updatedAt` timestamp updated |

---

## Storage: Firebase Storage

### Path Pattern

```
media/{companyId}/experiences/{timestamp}-{sanitizedFilename}
```

**Example**:
```
media/abc123/experiences/1701619200000-preview-image.png
```

### File Constraints

| Type | Max Size | MIME Types |
|------|----------|------------|
| Image | 5MB | `image/jpeg`, `image/png`, `image/webp` |
| GIF | 10MB | `image/gif` |

### URL Format

Files are stored with public access, returning URLs in format:
```
https://storage.googleapis.com/{bucket}/media/{companyId}/experiences/{filename}
```

---

## Firestore Collection: `/experiences/{experienceId}`

### Document Structure

```json
{
  "id": "exp_abc123",
  "companyId": "company_xyz",
  "name": "Holiday Photo Experience",
  "description": "Transform photos with festive AI filters",
  "stepsOrder": ["step_1", "step_2", "step_3"],
  "status": "active",
  "deletedAt": null,
  "createdAt": 1701619200000,
  "updatedAt": 1701705600000,
  "previewMediaUrl": "https://storage.googleapis.com/bucket/media/company_xyz/experiences/1701619200000-preview.png",
  "previewType": "image"
}
```

### Indexes Required

No additional indexes required. Existing queries by `companyId` and `status` continue to work.

---

## Relationships

```
Company (1) ─────────────────── (*) Experience
                                      │
                                      ├── previewMediaUrl → Firebase Storage
                                      │
                                      └── (*) Step (existing relationship)
```

---

## Migration Notes

### Backward Compatibility

- New fields are optional (`previewMediaUrl`, `previewType`)
- Existing experiences without preview media continue to function
- UI displays fallback state when preview media is null

### No Data Migration Required

- Fields default to `undefined`/`null` for existing documents
- TypeScript types updated to include optional fields
- UI handles both old (no preview) and new (with preview) states

---

## Type Definitions Location

**File**: `web/src/features/experiences/types/experiences.types.ts`

```typescript
export type ExperienceStatus = "active" | "deleted";

export type ExperiencePreviewType = "image" | "gif";

export interface Experience {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  stepsOrder: string[];
  status: ExperienceStatus;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
  // Preview media (optional)
  previewMediaUrl?: string | null;
  previewType?: ExperiencePreviewType | null;
}
```

---

## Schema Definitions Location

**File**: `web/src/features/experiences/schemas/experiences.schemas.ts`

Extensions to add:
1. `experiencePreviewTypeSchema` - enum for preview types
2. `updateExperienceSettingsInputSchema` - settings form validation
3. Update `experienceSchema` with optional preview fields
