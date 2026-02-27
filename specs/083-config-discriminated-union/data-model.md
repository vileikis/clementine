# Data Model: Experience Config Discriminated Union

**Feature**: 083-config-discriminated-union
**Date**: 2026-02-27

## Entity Changes

### ExperienceConfig (discriminated union — replaces flat config)

The config is now a tagged union on the `type` field. Each variant contains shared fields plus type-specific config.

#### Shared Fields (all variants)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string literal | Yes | — | Discriminant field (one of: survey, photo, gif, video, ai.image, ai.video) |
| `steps` | ExperienceStep[] | Yes | `[]` | Array of steps in the experience |

#### Variant: survey

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `'survey'` | Yes | — |
| `steps` | ExperienceStep[] | Yes | `[]` |

No type-specific config.

#### Variant: photo

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `'photo'` | Yes | — |
| `steps` | ExperienceStep[] | Yes | `[]` |
| `photo` | PhotoConfig | Yes | — |

#### Variant: ai.image

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `'ai.image'` | Yes | — |
| `steps` | ExperienceStep[] | Yes | `[]` |
| `aiImage` | AIImageConfig | Yes | — |

#### Variant: ai.video

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `'ai.video'` | Yes | — |
| `steps` | ExperienceStep[] | Yes | `[]` |
| `aiVideo` | AIVideoConfig | Yes | — |

#### Variant: gif

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `'gif'` | Yes | — |
| `steps` | ExperienceStep[] | Yes | `[]` |
| `gif` | GifConfig | Yes | — |

#### Variant: video

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `type` | `'video'` | Yes | — |
| `steps` | ExperienceStep[] | Yes | `[]` |
| `video` | VideoConfig | Yes | — |

### Experience Document (updated)

Firestore Path: `/workspaces/{workspaceId}/experiences/{experienceId}`

#### Field Changes

| Field | Change | Before | After |
|-------|--------|--------|-------|
| `type` | **REMOVED** | `ExperienceType` (required) | — |
| `draftType` | **ADDED** | — | `ExperienceType` (required, denormalized from `draft.type`) |
| `draft` | **CHANGED** | Flat config with nullable fields | Discriminated union config |
| `published` | **CHANGED** | Flat config with nullable fields \| null | Discriminated union config \| null |

#### Complete Schema

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | string | Yes | — | Firestore document ID |
| `name` | string (1-100) | Yes | — | Display name |
| `status` | 'active' \| 'deleted' | Yes | 'active' | Lifecycle state |
| `draftType` | ExperienceType | Yes | — | **NEW**: Denormalized from `draft.type` for queries |
| `media` | ExperienceMedia \| null | Yes | null | Thumbnail/cover |
| `createdAt` | number | Yes | — | Unix ms |
| `updatedAt` | number | Yes | — | Unix ms |
| `deletedAt` | number \| null | Yes | null | Soft delete timestamp |
| `draft` | ExperienceConfig | Yes | — | Discriminated union config |
| `published` | ExperienceConfig \| null | Yes | null | Discriminated union config |
| `draftVersion` | number | Yes | 1 | Increments on each draft edit |
| `publishedVersion` | number \| null | Yes | null | Syncs with draftVersion on publish |
| `publishedAt` | number \| null | Yes | null | Last publish Unix ms |
| `publishedBy` | string \| null | Yes | null | UID of publisher |

### Firestore Index Changes

#### Remove

```json
{
  "collectionGroup": "experiences",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

#### Add

```json
{
  "collectionGroup": "experiences",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "draftType", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Migration

### One-Time Migration Script

**Location**: `functions/scripts/migrations/083-config-discriminated-union.ts`

**Per-document transformation**:

1. Read `experience.type` (original top-level field)
2. Inject `type` into `experience.draft`: `draft.type = experience.type`
3. If `experience.published !== null`: inject `published.type = experience.type`
4. Set `experience.draftType = experience.type`
5. Remove `experience.type` (use `FieldValue.delete()`)
6. Remove null type-specific config fields from `draft` and `published`:
   - For each of `[photo, gif, video, aiImage, aiVideo]`: if the field is `null`, delete it
7. Write updated document

**Idempotency**: Check if `draft.type` already exists before transforming. If present, skip document.

**Batch size**: Process in batches of 500 (Firestore batch write limit).
