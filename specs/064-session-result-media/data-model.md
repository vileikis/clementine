# Data Model: Session Result Media Schema Alignment

**Feature**: 064-session-result-media
**Date**: 2026-02-06

## Entity Changes

### MediaReference (Existing — No Changes)

The standard media reference schema remains unchanged. It is already the target format.

```typescript
// packages/shared/src/schemas/media/media-reference.schema.ts
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: mediaDisplayNameSchema, // .catch('Untitled')
})
```

**Fields**:
- `mediaAssetId` (string, required) — Unique asset identifier in storage
- `url` (string/url, required) — Public URL to access the asset
- `filePath` (string | null, optional) — Storage bucket path; null for legacy docs
- `displayName` (string, required with fallback) — Human-readable name; defaults to "Untitled" via `.catch()`

---

### SessionResultMedia (REMOVED — Replaced by MediaReference)

The custom schema is deleted from `session.schema.ts`. Its type and schema exports are removed.

**Before** (being removed):
```typescript
export const sessionResultMediaSchema = z.object({
  stepId: z.string(),
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})
export type SessionResultMedia = z.infer<typeof sessionResultMediaSchema>
```

**After** (in session.schema.ts):
```typescript
import { mediaReferenceSchema } from '../media/media-reference.schema'

// In sessionSchema:
resultMedia: mediaReferenceSchema.nullable().default(null),
```

---

### Session (Modified — resultMedia field type change)

The `resultMedia` field on `sessionSchema` changes from `sessionResultMediaSchema.nullable()` to `mediaReferenceSchema.nullable()`.

**Before**:
```typescript
resultMedia: sessionResultMediaSchema.nullable().default(null),
```

**After**:
```typescript
resultMedia: mediaReferenceSchema.nullable().default(null),
```

**Impact on Session type**:
```typescript
// Before
type Session = {
  // ...
  resultMedia: {
    stepId: string
    assetId: string
    url: string
    createdAt: number
  } | null
}

// After
type Session = {
  // ...
  resultMedia: {
    mediaAssetId: string
    url: string
    filePath: string | null
    displayName: string
  } | null
}
```

---

## Field Mapping

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `assetId` | `mediaAssetId` | Same value, renamed for consistency with MediaReference |
| `url` | `url` | Same field, same value — stricter validation (`z.url()`) |
| `stepId` | *(dropped)* | Always "create"; not needed by any consumer |
| `createdAt` | *(dropped)* | Redundant with `session.updatedAt`/`session.completedAt` |
| *(new)* | `filePath` | Storage path from `getOutputStoragePath()` — nullable for backward compat |
| *(new)* | `displayName` | Default "Result" for new writes; "Untitled" for legacy via `.catch()` |

---

## Backward Compatibility

### Problem

Existing Firestore documents have `resultMedia` in the old format:
```json
{
  "stepId": "create",
  "assetId": "sess123-output",
  "url": "https://storage.googleapis.com/.../output.jpg",
  "createdAt": 1706000000000
}
```

The new `mediaReferenceSchema` expects `mediaAssetId` (not `assetId`) and `displayName`.

### Solution

Since `mediaReferenceSchema` uses `z.looseObject()`, extra fields (`stepId`, `assetId`, `createdAt`) are silently allowed. However, `mediaAssetId` will be missing on legacy docs, causing a parse failure.

**Approach**: Create a backward-compatible wrapper in `session.schema.ts` that normalizes legacy data:

```typescript
/**
 * Result media reference schema with backward compatibility.
 *
 * New documents use standard MediaReference format.
 * Legacy documents (with assetId instead of mediaAssetId) are
 * normalized on read via z.preprocess().
 */
const resultMediaReferenceSchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && 'assetId' in val && !('mediaAssetId' in val)) {
      const legacy = val as Record<string, unknown>
      return {
        ...legacy,
        mediaAssetId: legacy.assetId,
        displayName: 'Result',
      }
    }
    return val
  },
  mediaReferenceSchema,
)
```

This ensures:
- **New documents**: Pass through unchanged (already have `mediaAssetId`, `displayName`)
- **Legacy documents**: `assetId` → `mediaAssetId`, `displayName` defaults to "Result"
- **filePath**: Defaults to `null` via schema default
- **Extra fields** (`stepId`, `createdAt`): Silently preserved by `looseObject()`

---

## State Transitions

No state transitions change. The `resultMedia` lifecycle remains:
1. Session created → `resultMedia: null`
2. Transform job completes → `resultMedia: MediaReference` (set via `updateSessionResultMedia()`)
3. Session read → `resultMedia` displayed to guest / used for sharing

---

## Validation Rules

All validation is inherited from `mediaReferenceSchema`:
- `mediaAssetId`: Non-empty string (required)
- `url`: Valid URL format via `z.url()` (required)
- `filePath`: String or null (optional, defaults to null)
- `displayName`: 1-100 chars, alphanumeric + spaces/hyphens/underscores/periods, defaults to "Untitled" via `.catch()`
