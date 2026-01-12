# Data Model: Experience Data Layer & Library

**Feature**: 021-experience-data-library
**Date**: 2026-01-12
**Purpose**: Define entities, relationships, and validation rules

---

## Entity: Experience

### Description
The primary entity representing an AI photo experience that admins create and manage within a workspace. Experiences contain a sequence of steps (defined in E2) and can exist in draft or published states.

### Firestore Path
```
/workspaces/{workspaceId}/experiences/{experienceId}
```

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | Auto-generated | Firestore document ID |
| `name` | string | Yes | - | Display name (1-100 characters) |
| `status` | enum | Yes | `'active'` | Lifecycle status: `'active'` \| `'deleted'` |
| `profile` | enum | Yes | - | Experience type: `'freeform'` \| `'survey'` \| `'story'` |
| `media` | object \| null | No | `null` | Thumbnail/cover image |
| `media.mediaAssetId` | string | - | - | Reference to media asset |
| `media.url` | string | - | - | Full public URL for display |
| `draft` | object | Yes | `{ steps: [] }` | Draft configuration |
| `draft.steps` | array | Yes | `[]` | Array of step configurations (E2) |
| `published` | object \| null | No | `null` | Published configuration (null until first publish) |
| `published.steps` | array | - | - | Array of published step configurations |
| `createdAt` | number | Yes | Server timestamp | Creation timestamp (Unix ms) |
| `updatedAt` | number | Yes | Server timestamp | Last modification timestamp (Unix ms) |
| `publishedAt` | number \| null | No | `null` | Last publish timestamp (Unix ms) |
| `publishedBy` | string \| null | No | `null` | UID of admin who last published |
| `deletedAt` | number \| null | No | `null` | Soft delete timestamp (Unix ms) |

### Validation Rules

```typescript
// Profile enum
export const experienceProfileSchema = z.enum(['freeform', 'survey', 'story'])

// Status enum
export const experienceStatusSchema = z.enum(['active', 'deleted'])

// Media object
export const experienceMediaSchema = z.object({
  mediaAssetId: z.string().min(1),
  url: z.string().url(),
}).nullable()

// Configuration object
export const experienceConfigSchema = z.object({
  steps: z.array(z.any()).default([]), // Step schema defined in E2
})

// Full experience schema
export const experienceSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  status: experienceStatusSchema.default('active'),
  profile: experienceProfileSchema,
  media: experienceMediaSchema.default(null),
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
  publishedAt: z.number().nullable().default(null),
  publishedBy: z.string().nullable().default(null),
  deletedAt: z.number().nullable().default(null),
})
```

### State Transitions

```
                    ┌──────────────┐
                    │   (create)   │
                    └──────┬───────┘
                           │
                           ▼
        ┌─────────────────────────────────┐
        │           active                │
        │  draft: { steps: [] }           │
        │  published: null                │
        └─────────────┬───────────────────┘
                      │
          ┌───────────┴───────────┐
          │ (soft delete)         │
          ▼                       │
┌─────────────────────┐           │
│      deleted        │           │ (update name, draft, publish)
│  status: 'deleted'  │           │
│  deletedAt: <ts>    │           │
└─────────────────────┘           │
                                  │
                           ┌──────┴──────┐
                           │  (publish)  │
                           ▼             │
        ┌─────────────────────────────────┐
        │           active                │
        │  draft: { steps: [...] }        │
        │  published: { steps: [...] }    │
        │  publishedAt: <ts>              │
        │  publishedBy: <uid>             │
        └─────────────────────────────────┘
```

### Notes
- Profile is immutable after creation
- Soft delete sets `status: 'deleted'` and `deletedAt`
- Published config is atomic copy of draft at publish time
- Steps array is empty initially; step editing comes in E2

---

## Entity: Profile (Value Object)

### Description
A category that determines what types of steps an experience can contain and where it can be used. Profiles are immutable after experience creation.

### Profile Definitions

| Profile | Description | Allowed Step Categories | Slot Compatibility |
|---------|-------------|------------------------|-------------------|
| `freeform` | Full flexibility | info, input, capture, transform | main |
| `survey` | Data collection | info, input, capture | main, pregate, preshare |
| `story` | Display only | info | pregate, preshare |

### Validation (E1 Scope)
Profile validation is deferred to E2 when step editing is implemented. In E1, all profiles use empty validators that always return valid.

```typescript
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  freeform: () => ({ valid: true, errors: [], warnings: [] }),
  survey: () => ({ valid: true, errors: [], warnings: [] }),
  story: () => ({ valid: true, errors: [], warnings: [] }),
}
```

---

## Entity: Media (Embedded Object)

### Description
Optional thumbnail or cover image for an experience. Stored at root level (flattened) for efficient list queries.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaAssetId` | string | Yes | Reference to media asset in media library |
| `url` | string | Yes | Full public URL for immediate rendering |

### Notes
- Full URL stored to avoid signed URL generation latency
- `null` when no thumbnail is set
- Thumbnail upload is "nice to have" for E1; may be deferred

---

## Input Schemas

### CreateExperienceInput

```typescript
export const createExperienceInputSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  profile: experienceProfileSchema,
})

export type CreateExperienceInput = z.infer<typeof createExperienceInputSchema>
```

### UpdateExperienceInput

```typescript
export const updateExperienceInputSchema = z.object({
  workspaceId: z.string().min(1),
  experienceId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  media: experienceMediaSchema.optional(),
})

export type UpdateExperienceInput = z.infer<typeof updateExperienceInputSchema>
```

### DeleteExperienceInput

```typescript
export const deleteExperienceInputSchema = z.object({
  workspaceId: z.string().min(1),
  experienceId: z.string().min(1),
})

export type DeleteExperienceInput = z.infer<typeof deleteExperienceInputSchema>
```

---

## Relationships

```
┌─────────────────┐
│    Workspace    │
│                 │
│  id             │
│  name           │
│  slug           │
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────┐
│   Experience    │
│                 │
│  id             │
│  name           │
│  profile        │
│  status         │
│  media ─────────┼──────────► MediaAsset (optional)
│  draft          │
│  published      │
│  timestamps     │
└─────────────────┘
```

### Workspace → Experience
- One workspace has many experiences
- Experiences are stored as subcollection: `/workspaces/{workspaceId}/experiences`
- Deleting workspace cascades to experiences (future consideration)

### Experience → Media Asset
- One experience has zero or one media thumbnail
- Media is embedded object, not subcollection
- References `mediaAssetId` from media library domain

---

## Firestore Indexes

Add to `firebase/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "experiences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "experiences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "profile", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Index Rationale
1. **status + createdAt**: List all active experiences sorted by creation
2. **status + profile + createdAt**: Filter by profile while maintaining sort order

---

## Security Rules

```javascript
match /workspaces/{workspaceId}/experiences/{experienceId} {
  // READ: Authenticated users can read experiences
  // (Guests need published field for runtime - E5+)
  allow read: if request.auth != null;

  // CREATE: Only admins can create experiences
  allow create: if isAdmin();

  // UPDATE: Only admins can update experiences
  allow update: if isAdmin();

  // DELETE: Forbid hard deletes (soft delete via status field)
  allow delete: if false;
}
```

### Notes
- `isAdmin()` is existing helper function in firestore.rules
- Guests will read full document in E5+; client filters to `published` field
- No document-level status check in rules; handled in queries for flexibility
