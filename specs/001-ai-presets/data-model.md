# Data Model: AI Presets Refactor

**Branch**: `001-ai-presets` | **Date**: 2025-12-02

## Overview

This document describes the data model for the renamed `aiPresets` collection. The structure is **identical** to the existing `experiences` collection—only the collection name and type names change.

## Firestore Collection

### Collection: `/aiPresets/{aiPresetId}`

**Previous name**: `/experiences/{experienceId}`

Root-level collection (not nested). Each document represents a reusable AI transformation configuration.

## Entity: AiPreset

### Discriminated Union Type

```typescript
type AiPreset = PhotoAiPreset | VideoAiPreset | GifAiPreset
```

Discriminated by the `type` field: `"photo"`, `"video"`, or `"gif"`.

### Base Fields (All Types)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Document ID |
| `companyId` | `string` | Yes | Owning company reference |
| `eventIds` | `string[]` | Yes | Events using this preset (many-to-many) |
| `name` | `string` | Yes | Display name |
| `type` | `"photo" \| "video" \| "gif"` | Yes | Discriminator |
| `enabled` | `boolean` | Yes | Whether preset is active for guests |
| `previewMediaUrl` | `string \| null` | No | Preview image/video URL |
| `previewType` | `"image" \| "gif" \| "video" \| null` | No | Type of preview media |
| `createdAt` | `number` | Yes | Unix timestamp (ms) |
| `updatedAt` | `number` | Yes | Unix timestamp (ms) |

### PhotoAiPreset

```typescript
interface PhotoAiPreset {
  // Base fields...
  type: "photo"
  captureConfig: {
    countdown: number      // 0-10 seconds
    cameraFacing: "front" | "back" | "both"
    overlayUrl?: string | null
  }
  aiPhotoConfig: {
    enabled: boolean
    model?: string | null          // e.g., "gemini-2.5-flash-image"
    prompt?: string | null
    referenceImageUrls?: string[] | null
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"
  }
}
```

### GifAiPreset

```typescript
interface GifAiPreset {
  // Base fields...
  type: "gif"
  gifCaptureConfig: {
    countdown: number      // 0-10 seconds
    cameraFacing: "front" | "back" | "both"
    overlayUrl?: string | null
    frameCount: number     // Number of frames for GIF
  }
  aiPhotoConfig: {
    // Same as PhotoAiPreset - GIFs use image models
    enabled: boolean
    model?: string | null
    prompt?: string | null
    referenceImageUrls?: string[] | null
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"
  }
}
```

### VideoAiPreset

```typescript
interface VideoAiPreset {
  // Base fields...
  type: "video"
  videoCaptureConfig: {
    countdown: number      // 0-10 seconds
    cameraFacing: "front" | "back" | "both"
    overlayUrl?: string | null
    minDuration: number    // Minimum video length (seconds)
    maxDuration: number    // Maximum video length (seconds)
  }
  aiVideoConfig: {
    enabled: boolean
    model?: string | null
    prompt?: string | null
    referenceImageUrls?: string[] | null
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"
    duration?: number      // Output duration
    fps?: number           // Output frame rate
  }
}
```

## Relationships

### AiPreset → Company

- **Type**: Many-to-One
- **Field**: `companyId`
- **Collection**: `/companies/{companyId}`
- **Description**: Each preset belongs to one company

### AiPreset → Events

- **Type**: Many-to-Many
- **Field**: `eventIds` (array)
- **Collection**: `/events/{eventId}`
- **Description**: One preset can be used by multiple events, one event can have multiple presets
- **Query Pattern**: `where("eventIds", "array-contains", eventId)`

### Step → AiPreset (Reference)

Steps reference AiPresets by ID in their config:

- **ExperiencePicker Step**: `config.experienceIds` → array of aiPreset IDs
- **Capture Step**: `config.fallbackExperienceId` → single aiPreset ID (optional)

> **Note**: The field names in Step schemas remain unchanged (`experienceIds`, `fallbackExperienceId`) for backward compatibility with existing Firestore documents. Only the underlying data source changes from `/experiences` to `/aiPresets`.

## Indexes

No new indexes required. Existing indexes on `/experiences` will need to be recreated for `/aiPresets`:

| Fields | Order | Purpose |
|--------|-------|---------|
| `companyId`, `createdAt` | ASC, DESC | List presets by company |
| `eventIds` | (array-contains) | List presets for an event |

## Validation Rules

All validation rules remain unchanged from the original Experience model:

1. `countdown` must be 0-10
2. `cameraFacing` must be one of: "front", "back", "both"
3. `aspectRatio` must be one of: "1:1", "3:4", "4:5", "9:16", "16:9"
4. `name` required, non-empty
5. `companyId` required, valid company reference
6. `eventIds` required, array (can be empty)

## Migration Notes

### Data Transformation

**None required.** Documents are copied as-is from `/experiences` to `/aiPresets`. Document IDs are preserved to maintain existing Step references.

### Document ID Preservation

Critical: All document IDs must be preserved during migration because:
- ExperiencePicker steps store preset IDs in `config.experienceIds`
- Capture steps store preset IDs in `config.fallbackExperienceId`
- Session data may reference preset IDs

### Migration Verification

After migration, verify:
```javascript
// Count should match
const experiencesCount = (await db.collection('experiences').count().get()).data().count
const aiPresetsCount = (await db.collection('aiPresets').count().get()).data().count
console.log(experiencesCount === aiPresetsCount) // true
```

## Type Renaming Summary

| Old Name | New Name |
|----------|----------|
| `Experience` | `AiPreset` |
| `PhotoExperience` | `PhotoAiPreset` |
| `VideoExperience` | `VideoAiPreset` |
| `GifExperience` | `GifAiPreset` |
| `ExperienceType` | `AiPresetType` |
| `PhotoCaptureConfig` | `PhotoCaptureConfig` (unchanged) |
| `GifCaptureConfig` | `GifCaptureConfig` (unchanged) |
| `VideoCaptureConfig` | `VideoCaptureConfig` (unchanged) |
| `AiPhotoConfig` | `AiPhotoConfig` (unchanged) |
| `AiVideoConfig` | `AiVideoConfig` (unchanged) |

> **Note**: Config types (`*CaptureConfig`, `Ai*Config`) retain their names as they describe the configuration structure, not the entity itself.
