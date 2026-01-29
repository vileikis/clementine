# Research: displayName Field Pattern for Media Schemas

**Date**: 2026-01-29
**Context**: Adding `displayName` field to MediaAsset and MediaReference schemas
**Zod Version**: 4.1.12
**TypeScript**: Strict mode enabled

## Decision: Use `.default("Untitled")` Pattern

For the `displayName` field in both MediaAsset and MediaReference schemas, use:

```typescript
displayName: z.string().default("Untitled")
```

## Rationale

### 1. Firestore Compatibility
Following the established Clementine pattern documented in `standards/global/zod-validation.md`:

- **Firestore rejects `undefined` values** but accepts `null` and empty strings
- For **string fields with non-null defaults**, `.default("value")` is the correct pattern
- The `.nullable().default(null)` pattern is specifically for **optional fields that can be null**

### 2. displayName Semantic Requirements
The `displayName` field has specific semantic requirements:

- **Always present**: Display name should always be available for UI rendering
- **Never null**: A null display name would require null checks throughout the codebase
- **Sensible fallback**: "Untitled" is a better UX than null or undefined

### 3. Existing Schema Patterns in Clementine

Review of existing schemas shows consistent patterns:

**For optional/nullable fields** (can be absent):
```typescript
// From experience.schema.ts
deletedAt: z.number().nullable().default(null)
publishedAt: z.number().nullable().default(null)

// From media-reference.schema.ts
filePath: z.string().nullable().default(null)
```

**For required fields with defaults** (always present):
```typescript
// From media-asset.schema.ts
status: mediaAssetStatusSchema.default('active')

// From experience.schema.ts
status: experienceStatusSchema.default('active')
steps: z.array(experienceStepSchema).default([])

// From project.schema.ts
type: projectTypeSchema.default('standard')
draftVersion: z.number().default(1)
```

**Pattern identification:**
- Fields that semantically "can be absent" → `.nullable().default(null)`
- Fields that should "always have a value" → `.default(value)`
- The `displayName` field falls into the second category

### 4. Zod 4 Behavior with `.default()`

Based on Zod documentation and research:

- `.default("Untitled")` makes the field **optional input, required output**
- When parsing `{}` → results in `{ displayName: "Untitled" }`
- When parsing `{ displayName: "My Photo" }` → preserves the value
- TypeScript type: `string` (not `string | undefined`)

This is exactly the behavior we want for backward compatibility.

### 5. Backward Compatibility

**For legacy documents without `displayName`:**
```typescript
// Legacy document in Firestore
{
  mediaAssetId: "asset-123",
  url: "https://...",
  // no displayName field
}

// After parsing with schema
const parsed = mediaReferenceSchema.parse(legacyDoc)
// Result: { mediaAssetId: "asset-123", url: "...", displayName: "Untitled", filePath: null }
```

**For new uploads:**
```typescript
// New upload
const newMedia = {
  mediaAssetId: "asset-456",
  url: "https://...",
  displayName: "Summer Beach Photo"
}

// After parsing
const parsed = mediaReferenceSchema.parse(newMedia)
// Result: preserves "Summer Beach Photo"
```

### 6. No Migration Required

Using `.default("Untitled")` means:
- **No database migration needed** - legacy documents work immediately
- **Read-time transformation** - default applied during parse
- **Forward compatible** - new documents can include displayName
- **No breaking changes** - existing code continues to work

## Alternatives Considered

### Alternative 1: `.nullable().default(null)`

```typescript
displayName: z.string().nullable().default(null)
```

**Pros:**
- Consistent with other "optional" fields in schemas
- Clearly distinguishes "not set" (null) from "set to empty" ("")

**Cons:**
- Requires null checks throughout UI: `displayName ?? "Untitled"`
- TypeScript type becomes `string | null` instead of `string`
- Less ergonomic for a field that should always display something
- Not semantically correct - display name should always have a value

**Why rejected:** Display name is not truly optional - it should always be present for UI rendering. Null checks everywhere would be boilerplate.

### Alternative 2: `.optional().default("Untitled")`

```typescript
displayName: z.string().optional().default("Untitled")
```

**Pros:**
- Explicitly marks field as optional input
- Still provides default value

**Cons:**
- Redundant in Zod 4 - `.default()` already makes input optional
- Less common pattern in Clementine codebase
- TypeScript type becomes `string | undefined` (wrong)

**Why rejected:** In Zod 4, `.default()` already makes the field optional input. Adding `.optional()` is redundant and changes the output type incorrectly.

### Alternative 3: Required field (no default)

```typescript
displayName: z.string()
```

**Pros:**
- Simplest schema definition
- Forces explicit naming

**Cons:**
- **Breaks backward compatibility** - fails parsing for all legacy documents
- Requires migration script to populate all existing documents
- Creates unnecessary complexity for a non-critical field

**Why rejected:** Breaks existing data and provides no real benefit. Migration overhead not justified.

### Alternative 4: `.transform()` with null fallback

```typescript
displayName: z.string().nullable().default(null).transform(val => val ?? "Untitled")
```

**Pros:**
- Handles both null and undefined
- Output type is `string`

**Cons:**
- Overly complex for simple default case
- Harder to read and maintain
- `.default()` already handles undefined case

**Why rejected:** Unnecessary complexity. `.default("Untitled")` achieves the same result more simply.

## Implementation Pattern

### MediaAsset Schema

```typescript
// packages/shared/src/schemas/media/media-asset.schema.ts

export const mediaAssetSchema = z.looseObject({
  id: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  url: z.url(),
  fileSize: z.number().int().positive(),
  mimeType: imageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  uploadedAt: z.number().int().positive(),
  uploadedBy: z.string(),
  type: mediaAssetTypeSchema,
  status: mediaAssetStatusSchema.default('active'),
  displayName: z.string().default('Untitled'), // ✅ New field
})
```

### MediaReference Schema

```typescript
// packages/shared/src/schemas/media/media-reference.schema.ts

export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: z.string().default('Untitled'), // ✅ New field
})
```

### TypeScript Types

```typescript
// Inferred types (no changes needed)
type MediaAsset = z.infer<typeof mediaAssetSchema>
// displayName: string

type MediaReference = z.infer<typeof mediaReferenceSchema>
// displayName: string
```

## Special Considerations

### 1. UI Display
```typescript
// No null checks needed - displayName is always string
function MediaCard({ media }: { media: MediaReference }) {
  return (
    <div>
      <h3>{media.displayName}</h3> {/* ✅ Always safe */}
    </div>
  )
}
```

### 2. Upload Flow
```typescript
// New uploads should provide displayName explicitly
async function uploadMedia(file: File, customName?: string) {
  const mediaAsset = {
    // ... other fields
    displayName: customName || file.name || 'Untitled',
  }

  await setDoc(docRef, mediaAsset)
}
```

### 3. Edit Flow
```typescript
// Allow users to update displayName
async function updateDisplayName(mediaAssetId: string, newName: string) {
  await updateDoc(doc(firestore, `mediaAssets/${mediaAssetId}`), {
    displayName: newName,
  })
}
```

### 4. Testing Backward Compatibility

Add test cases to verify default behavior:

```typescript
// packages/shared/src/schemas/media/media-asset.schema.test.ts

it('applies default displayName for legacy documents', () => {
  const legacyDoc = {
    id: 'asset-123',
    fileName: 'overlay-V1StGXR8.png',
    // ... other required fields
    // no displayName field
  }

  const result = mediaAssetSchema.parse(legacyDoc)
  expect(result.displayName).toBe('Untitled')
})

it('preserves explicit displayName', () => {
  const newDoc = {
    id: 'asset-456',
    fileName: 'beach.jpg',
    displayName: 'Summer Beach',
    // ... other required fields
  }

  const result = mediaAssetSchema.parse(newDoc)
  expect(result.displayName).toBe('Summer Beach')
})
```

## Migration Strategy

**No migration required** - this is the beauty of using `.default()`:

1. **Deploy schema change** - Add `displayName: z.string().default('Untitled')` to schemas
2. **Deploy frontend** - UI can immediately use `media.displayName` without null checks
3. **Gradual enrichment** - New uploads and edits will populate real display names
4. **Legacy documents** - Automatically get "Untitled" when parsed

### Optional: Backfill Script (Future Enhancement)

If desired, a migration script can populate display names from file names:

```typescript
// functions/scripts/migrations/populate-display-names.ts

async function populateDisplayNames(dryRun = true) {
  const snapshot = await db.collectionGroup('mediaAssets').get()
  const batch = db.batch()

  for (const doc of snapshot.docs) {
    const data = doc.data()

    // Only update if displayName is not already set
    if (!data.displayName) {
      const displayName = extractNameFromFileName(data.fileName)
      batch.update(doc.ref, { displayName })
    }
  }

  if (!dryRun) {
    await batch.commit()
  }
}

function extractNameFromFileName(fileName: string): string {
  // Remove file extension and hash suffix
  // "overlay-V1StGXR8.png" -> "Overlay"
  return fileName
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/-[A-Za-z0-9]+$/, '') // Remove hash
    .replace(/[-_]/g, ' ') // Replace separators
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

**Note:** This migration is **optional** and can be run at any time. The system works perfectly without it.

## Comparison with Existing Patterns

### Pattern: `filePath` in MediaReference

```typescript
filePath: z.string().nullable().default(null)
```

**Why nullable:** Field was added after initial schema. Legacy documents don't have it. Code must handle both cases (URL parsing fallback).

### Pattern: `displayName` (this decision)

```typescript
displayName: z.string().default('Untitled')
```

**Why non-nullable:** Field should always display something. "Untitled" is better UX than null. No need for null checks in UI.

**The difference:**
- `filePath` is technical metadata that **can be absent** (fallback exists)
- `displayName` is user-facing text that **should always exist** (default is user-friendly)

## Consistency Check

This pattern is consistent with other "required with default" fields in Clementine:

| Schema | Field | Pattern | Rationale |
|--------|-------|---------|-----------|
| MediaAsset | `status` | `.default('active')` | Always has a status |
| Experience | `status` | `.default('active')` | Always has a status |
| Experience | `steps` | `.default([])` | Always has steps array (can be empty) |
| Project | `type` | `.default('standard')` | Always has a type |
| Project | `draftVersion` | `.default(1)` | Always has a version |
| **MediaAsset** | **`displayName`** | **`.default('Untitled')`** | **Always has display name** |
| **MediaReference** | **`displayName`** | **`.default('Untitled')`** | **Always has display name** |

## Sources

- [Zod v4 Default Values Behavior](https://github.com/colinhacks/zod/issues/4179)
- [Zod .default() vs .optional() vs .nullable() Best Practices](https://gist.github.com/ciiqr/ee19e9ff3bb603f8c42b00f5ad8c551e)
- [Zod Default Values Documentation](https://tecktol.com/default-in-zod-schemas/)
- [Zod nullish vs optional vs nullable](https://cho.sh/r/73FAAA)
- Clementine Standards: `/standards/global/zod-validation.md`
- Clementine Standards: `/standards/backend/firestore.md`
- Existing Schemas: `packages/shared/src/schemas/media/`

## Conclusion

**Use `.default("Untitled")` pattern** for the `displayName` field in both MediaAsset and MediaReference schemas.

This pattern:
- ✅ Provides backward compatibility without migration
- ✅ Follows established Clementine schema patterns
- ✅ Gives better UX than null (no null checks needed)
- ✅ Matches Firestore-safe patterns
- ✅ Uses Zod 4 features correctly
- ✅ Results in clean TypeScript types (`string` not `string | null`)
- ✅ Allows gradual enrichment of legacy data
