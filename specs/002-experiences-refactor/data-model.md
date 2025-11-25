# Data Model: Experiences Feature Refactor

**Date**: 2025-11-25
**Feature**: 002-experiences-refactor

## Entity Overview

### Experience

A reusable AI experience configuration owned by a company and associated with one or more events.

**Collection Path**: `/experiences/{experienceId}`

## Field Migration (Old → New)

This refactor modifies the existing schema in `web/src/features/experiences/schemas/experiences.schemas.ts`.

| Old Field | New Field | Change Type |
|-----------|-----------|-------------|
| `eventId` | `companyId` | Replace (different purpose) |
| - | `eventIds[]` | Add (new field) |
| `label` | `name` | Rename |
| `hidden` | - | Remove |
| `aiConfig` | `aiPhotoConfig` | Restructure (photo/gif types) |
| `aiConfig` | `aiVideoConfig` | Restructure (video type) |
| `previewPath` | `previewMediaUrl` | Rename |
| `config` | `captureConfig` | Rename |
| `config.overlayFramePath` | `captureConfig.overlayUrl` | Rename |
| `aiConfig.referenceImagePaths` | `aiPhotoConfig.referenceImageUrls` | Rename

## Schema Definition

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Auto-generated document ID |
| `companyId` | string | Yes | Owning company ID (multi-tenant) |
| `eventIds` | string[] | Yes | Array of event IDs using this experience |
| `name` | string | Yes | Internal name (1-50 chars) |
| `type` | enum | Yes | `"photo"` \| `"video"` \| `"gif"` |
| `enabled` | boolean | Yes | Whether experience is active |
| `createdAt` | number | Yes | UTC timestamp (ms) |
| `updatedAt` | number | Yes | UTC timestamp (ms) |

### Preview Media Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `previewType` | enum | No | `"image"` \| `"gif"` \| `"video"` |
| `previewMediaUrl` | string | No | Full public URL to preview asset |

### Capture Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `captureConfig.countdown` | number | Yes | Seconds (0-10, 0 = disabled) |
| `captureConfig.cameraFacing` | enum | Yes | `"front"` \| `"back"` \| `"both"` |
| `captureConfig.overlayUrl` | string | No | PNG frame overlay URL |
| `captureConfig.minDuration` | number | No | Video/GIF min seconds |
| `captureConfig.maxDuration` | number | No | Video/GIF max seconds |
| `captureConfig.frameCount` | number | No | GIF frame count |

### AI Photo Configuration (Photo/GIF types)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `aiPhotoConfig.enabled` | boolean | Yes | Whether AI is enabled |
| `aiPhotoConfig.model` | string \| null | No | Model ID (e.g., "flux", "stable-diffusion-xl") |
| `aiPhotoConfig.prompt` | string \| null | No | Generation prompt (max 600 chars) |
| `aiPhotoConfig.referenceImageUrls` | string[] \| null | No | Reference image URLs (max 5) |
| `aiPhotoConfig.aspectRatio` | enum | No | `"1:1"` \| `"3:4"` \| `"4:5"` \| `"9:16"` \| `"16:9"` |

### AI Video Configuration (Video type only)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `aiVideoConfig.enabled` | boolean | Yes | Whether AI is enabled |
| `aiVideoConfig.model` | string \| null | No | Model ID (e.g., "kling-video", "runway") |
| `aiVideoConfig.prompt` | string \| null | No | Motion/scene prompt |
| `aiVideoConfig.referenceImageUrls` | string[] \| null | No | Starting frame references |
| `aiVideoConfig.aspectRatio` | enum | No | Output dimensions |
| `aiVideoConfig.duration` | number \| null | No | Output length in seconds |
| `aiVideoConfig.fps` | number \| null | No | Frames per second |

### Input Fields (Deferred)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inputFields` | FieldConfig[] \| null | No | Form fields for capture screen (deferred implementation) |

## Validation Rules

### Creation Validation

1. `companyId` must be a valid company the user has access to
2. `name` must be 1-50 characters, trimmed
3. `type` must be one of: "photo", "video", "gif"
4. `eventIds` can be empty array or contain valid event IDs
5. Photo/GIF types should have `aiPhotoConfig`, video types should have `aiVideoConfig`

### Update Validation

1. Cannot change `companyId` (immutable after creation)
2. Cannot change `type` (immutable after creation)
3. Can add/remove event IDs from `eventIds` array
4. Partial updates allowed for config objects

### Delete Validation

1. User must have access to the experience's `companyId`
2. Associated storage assets (preview, reference images) should be cleaned up

## State Transitions

```
[Draft] -> enabled: false, eventIds: []
   |
   v (attach to event)
[Attached] -> enabled: false, eventIds: [eventId]
   |
   v (enable)
[Active] -> enabled: true, eventIds: [eventId, ...]
   |
   v (disable)
[Inactive] -> enabled: false
   |
   v (delete)
[Deleted] -> document removed
```

## Relationships

### Experience → Company (Many-to-One)

- Experience has `companyId` reference
- Company owns multiple experiences
- Query: `where('companyId', '==', companyId)`

### Experience → Events (Many-to-Many)

- Experience has `eventIds[]` array
- Event can have multiple experiences
- Experience can belong to multiple events
- Query: `where('eventIds', 'array-contains', eventId)`

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "experiences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "experiences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Example Documents

### Photo Experience

```json
{
  "id": "exp_abc123",
  "companyId": "company_xyz",
  "eventIds": ["event_001", "event_002"],
  "name": "80s Movie Star",
  "type": "photo",
  "enabled": true,
  "previewType": "image",
  "previewMediaUrl": "https://storage.googleapis.com/.../preview.jpg",
  "captureConfig": {
    "countdown": 3,
    "cameraFacing": "front",
    "overlayUrl": null
  },
  "aiPhotoConfig": {
    "enabled": true,
    "model": "flux",
    "prompt": "Transform into an 80s movie star with dramatic lighting",
    "referenceImageUrls": ["https://storage.googleapis.com/.../ref1.jpg"],
    "aspectRatio": "9:16"
  },
  "inputFields": null,
  "createdAt": 1732521600000,
  "updatedAt": 1732521600000
}
```

### Video Experience

```json
{
  "id": "exp_def456",
  "companyId": "company_xyz",
  "eventIds": ["event_003"],
  "name": "Cyberpunk Animation",
  "type": "video",
  "enabled": true,
  "previewType": "video",
  "previewMediaUrl": "https://storage.googleapis.com/.../preview.mp4",
  "captureConfig": {
    "countdown": 5,
    "cameraFacing": "front",
    "minDuration": 3,
    "maxDuration": 10
  },
  "aiVideoConfig": {
    "enabled": true,
    "model": "kling-video",
    "prompt": "Animate with cyberpunk neon effects and glitch transitions",
    "referenceImageUrls": null,
    "aspectRatio": "9:16",
    "duration": 5,
    "fps": 24
  },
  "inputFields": null,
  "createdAt": 1732521600000,
  "updatedAt": 1732521600000
}
```

### GIF Experience

```json
{
  "id": "exp_ghi789",
  "companyId": "company_xyz",
  "eventIds": ["event_001"],
  "name": "Sparkle Effect",
  "type": "gif",
  "enabled": false,
  "previewType": "gif",
  "previewMediaUrl": "https://storage.googleapis.com/.../preview.gif",
  "captureConfig": {
    "countdown": 3,
    "cameraFacing": "both",
    "frameCount": 8
  },
  "aiPhotoConfig": {
    "enabled": true,
    "model": "stable-diffusion-xl",
    "prompt": "Add sparkle and glitter effects to each frame",
    "referenceImageUrls": null,
    "aspectRatio": "1:1"
  },
  "inputFields": null,
  "createdAt": 1732521600000,
  "updatedAt": 1732521600000
}
```
