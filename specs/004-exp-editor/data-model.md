# Data Model: Experience Editor & AI Playground

**Feature**: 004-exp-editor
**Date**: 2025-11-25

## Entities

### Experience (Existing - No Changes)

The experience entity already exists in `web/src/features/experiences/schemas/experiences.schemas.ts`. This feature edits existing experiences, so no schema changes are needed.

**Relevant Fields for Editor**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Experience identifier |
| `name` | string(1-50) | Display name |
| `type` | "photo" \| "video" \| "gif" | Experience type (editor scoped to "photo") |
| `enabled` | boolean | Whether experience is active |
| `previewMediaUrl` | string \| null | Preview image URL |
| `previewType` | "image" \| "gif" \| "video" | Preview media type |
| `aiPhotoConfig.model` | string \| null | Selected AI model |
| `aiPhotoConfig.prompt` | string(0-600) \| null | System prompt |
| `aiPhotoConfig.enabled` | boolean | AI transform enabled |
| `aiPhotoConfig.aspectRatio` | enum | Output aspect ratio |
| `aiPhotoConfig.referenceImageUrls` | string[] \| null | Reference images (max 5) |

### Event Theme (Existing - Read Only)

The event theme is read from the parent event for branding context display. No modifications needed.

**Relevant Fields for Branding Context**:

| Field | Type | Description |
|-------|------|-------------|
| `theme.primaryColor` | string (hex) | Primary brand color |
| `theme.logoUrl` | string \| null | Brand logo URL |
| `theme.fontFamily` | string \| null | Brand font family |

### Playground Session (Client-Side Only - Not Persisted)

Playground state is ephemeral and lives only in React component state.

| Field | Type | Description |
|-------|------|-------------|
| `testImageFile` | File \| null | Uploaded test image (client) |
| `testImagePreviewUrl` | string \| null | Data URL for preview |
| `isGenerating` | boolean | Generation in progress |
| `resultImageUrl` | string \| null | Transformed image (temp) |
| `error` | string \| null | Error message if any |

## Relationships

```
Event (1) ─────< (N) Experience
  │                    │
  └── theme ◄──────── aiPhotoConfig
      (branding)       (AI settings)
```

- Event has theme (branding context)
- Experience belongs to Event via `eventIds[]`
- AI generation injects event theme into prompt

## State Transitions

### Experience Enabled State

```
[disabled] ←→ [enabled]
           toggle
```

### Playground Generation State

```
[idle] ─── upload ───> [ready]
                          │
                      generate
                          │
                          ▼
                     [generating]
                          │
              ┌─── success ───┐
              ▼               ▼
          [result]        [error]
              │               │
              └── retry ──────┘
              └── new upload ─→ [ready]
```

## Validation Rules

### Experience Update Validation

Uses existing `updatePhotoExperienceSchema` from `experiences.schemas.ts`:

```typescript
{
  name?: string(1-50),
  enabled?: boolean,
  aiPhotoConfig?: {
    enabled?: boolean,
    model?: string | null,
    prompt?: string(0-600) | null,
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9",
    referenceImageUrls?: string[] (max 5) | null,
  }
}
```

### Playground Upload Validation

```typescript
{
  file: File,
  // Constraints:
  // - Type: image/jpeg, image/png, image/webp
  // - Size: max 10MB (10 * 1024 * 1024 bytes)
}
```

### AI Generation Params

```typescript
{
  prompt: string,            // From experience config
  inputImageUrl: string,     // Uploaded test image (temp URL)
  referenceImageUrl?: string,// Optional reference
  brandColor?: string,       // From event theme.primaryColor
}
```

## Data Flow

### Save Configuration

```
[User edits form]
       │
       ▼
[Validate with Zod]
       │
       ▼
[Server Action: updatePhotoExperience]
       │
       ▼
[Firestore: /experiences/{id}]
       │
       ▼
[Revalidate paths]
       │
       ▼
[Toast: Success/Error]
```

### Generate Preview

```
[User uploads image]
       │
       ▼
[Validate file type/size]
       │
       ▼
[Display preview (Data URL)]
       │
       ▼
[User clicks Generate]
       │
       ▼
[Server Action: generatePlaygroundPreview]
       │
       ├── Upload to temp storage (get URL)
       │
       ├── Fetch experience + event theme
       │
       ├── Call AI client
       │
       ▼
[Return transformed image]
       │
       ▼
[Display result (NOT persisted)]
```

## Index Requirements

No new indexes needed. Existing indexes on `/experiences` collection are sufficient:

- `companyId` (for listing)
- `eventIds` (array-contains for event filtering)
