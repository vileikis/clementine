# Quickstart: Media Naming Implementation

**Feature**: 047-media-naming
**Estimated Time**: 2-3 hours
**Difficulty**: Low

## Overview

This guide walks through implementing the media naming feature in dependency order. Follow these steps sequentially to preserve original filenames while maintaining unique storage identifiers.

## Prerequisites

- Node.js 18+ and pnpm 10.18.1 installed
- Repository cloned and dependencies installed (`pnpm install`)
- On branch `047-media-naming`
- Familiarity with Zod schemas and TanStack Query

## Implementation Steps

### Step 1: Update Shared Schemas (30 minutes)

**Location**: `packages/shared/src/schemas/media/`

These schema changes form the foundation. All other changes depend on these.

#### 1.1 Update MediaAsset Schema

**File**: `packages/shared/src/schemas/media/media-asset.schema.ts`

Add the `displayName` field:

```typescript
export const mediaAssetSchema = z.looseObject({
  id: z.string(),
  fileName: z.string(),
  displayName: z.string().default('Untitled'),  // ADD THIS LINE
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
})
```

**Validation**: Run `pnpm --filter @clementine/shared type-check`

#### 1.2 Update MediaReference Schema

**File**: `packages/shared/src/schemas/media/media-reference.schema.ts`

Add the `displayName` field:

```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: z.string().default('Untitled'),  // ADD THIS LINE
})
```

**Validation**: Run `pnpm --filter @clementine/shared type-check`

#### 1.3 Build Shared Package

```bash
cd packages/shared
pnpm build
```

This ensures the updated types are available to the app.

**Checkpoint**: Schemas updated with displayName field, package built successfully.

---

### Step 2: Update File Name Generation (15 minutes)

**Location**: `apps/clementine-app/src/domains/media-library/utils/`

Update the filename generator to remove the hardcoded "overlay-" prefix.

#### 2.1 Update generateFileName Function

**File**: `apps/clementine-app/src/domains/media-library/utils/upload.utils.ts`

**Before**:
```typescript
export function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `overlay-${nanoid()}.${ext}`
}
```

**After**:
```typescript
export function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `${nanoid()}.${ext}`
}
```

**What changed**: Removed `"overlay-"` prefix. Storage filename is now just `{nanoid}.{ext}`.

**Validation**:
```bash
cd apps/clementine-app
pnpm type-check
```

**Checkpoint**: Filename generation simplified, no more "overlay-" prefix.

---

### Step 3: Update Upload Service (45 minutes)

**Location**: `apps/clementine-app/src/domains/media-library/services/`

Update the upload service to capture and return the display name.

#### 3.1 Update uploadMediaAsset Service

**File**: `apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts`

**Changes**:

1. **Update return type interface** (line ~49):
```typescript
export interface UploadMediaAssetResult {
  mediaAssetId: string
  url: string
  filePath: string
  displayName: string  // ADD THIS LINE
}
```

2. **Capture display name from file** (after line ~95):
```typescript
export async function uploadMediaAsset({
  file,
  type,
  workspaceId,
  userId,
  onProgress,
}: UploadMediaAssetParams): Promise<UploadMediaAssetResult> {
  // 1. Validate file
  validateFile(file)

  // 2. Extract image dimensions
  const { width, height } = await getImageDimensions(file)

  // 3. Generate unique file name and storage path
  const fileName = generateFileName(file)
  const filePath = `workspaces/${workspaceId}/media/${fileName}`

  // 3a. NEW: Capture original filename for display
  const displayName = file.name

  // ... rest of upload logic
}
```

3. **Include displayName in Firestore document** (line ~131):
```typescript
const docRef = await addDoc(mediaAssetsRef, {
  fileName,
  displayName,        // ADD THIS LINE
  filePath,
  url: downloadURL,
  fileSize: file.size,
  mimeType: file.type as ImageMimeType,
  width,
  height,
  uploadedAt: serverTimestamp(),
  uploadedBy: userId,
  type,
  status: 'active',
} satisfies Omit<MediaAsset, 'id'>)
```

4. **Return displayName in result** (line ~146):
```typescript
return {
  mediaAssetId: docRef.id,
  url: downloadURL,
  filePath,
  displayName,        // ADD THIS LINE
}
```

**Validation**: Run `pnpm type-check` in `apps/clementine-app/`

**Checkpoint**: Upload service now captures and returns displayName.

---

### Step 4: Update Hook Return Type (15 minutes)

**Location**: `apps/clementine-app/src/domains/media-library/hooks/`

TypeScript will now show type errors in consuming code because the return type has changed. These are expected and will be fixed.

#### 4.1 Verify useUploadMediaAsset Hook

**File**: `apps/clementine-app/src/domains/media-library/hooks/useUploadMediaAsset.ts`

**No changes required** - the hook's return type is inferred from the service. It will automatically include `displayName` once the service is updated.

**Validation**: Run `pnpm type-check` - should pass without changes to this file.

**Checkpoint**: Hook return type updated automatically via type inference.

---

### Step 5: Update Consuming Code (30 minutes)

**Location**: Various domains that use the upload hook

Update code that calls `uploadMediaAsset.mutateAsync()` to handle the new `displayName` field.

#### 5.1 Update useUploadAndUpdateBackground

**File**: `apps/clementine-app/src/domains/project-config/theme/hooks/useUploadAndUpdateBackground.ts`

**Before** (line ~64):
```typescript
const { mediaAssetId, url, filePath } = await uploadAsset.mutateAsync({
  file,
  type: 'other',
  onProgress,
})

return { mediaAssetId, url, filePath }
```

**After**:
```typescript
const { mediaAssetId, url, filePath, displayName } = await uploadAsset.mutateAsync({
  file,
  type: 'other',
  onProgress,
})

return { mediaAssetId, url, filePath, displayName }
```

Also update the return type interface (line ~36):
```typescript
interface UploadBackgroundResult {
  mediaAssetId: string
  url: string
  filePath: string
  displayName: string  // ADD THIS LINE
}
```

#### 5.2 Update useUploadAndUpdateOverlays

**File**: `apps/clementine-app/src/domains/project-config/settings/hooks/useUploadAndUpdateOverlays.ts`

**Before** (line ~90):
```typescript
const { mediaAssetId, url, filePath } = await uploadAsset.mutateAsync({
  file,
  type: 'overlay',
  onProgress,
})

await updateOverlays.mutateAsync({
  [aspectRatio]: { mediaAssetId, url, filePath },
})

return { mediaAssetId, url, filePath }
```

**After**:
```typescript
const { mediaAssetId, url, filePath, displayName } = await uploadAsset.mutateAsync({
  file,
  type: 'overlay',
  onProgress,
})

await updateOverlays.mutateAsync({
  [aspectRatio]: { mediaAssetId, url, filePath, displayName },
})

return { mediaAssetId, url, filePath, displayName }
```

Also update the return type interface (line ~51):
```typescript
interface UploadAndUpdateOverlaysResult {
  mediaAssetId: string
  url: string
  filePath: string
  displayName: string  // ADD THIS LINE
}
```

#### 5.3 Find Other Usage

Search for other files that call the upload mutation:

```bash
cd apps/clementine-app
grep -r "uploadAsset.mutateAsync" src/
```

Update each occurrence to destructure and pass `displayName`.

**Validation**: Run `pnpm type-check` - should pass with all consumers updated.

**Checkpoint**: All consuming code updated to handle displayName.

---

### Step 6: Fix Import Paths (15 minutes)

**Location**: Experience domain

Update imports to use shared package directly instead of app-specific re-export.

#### 6.1 Update useRuntime Hook

**File**: `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

**Before** (line ~16):
```typescript
import type { MediaReference } from '@/shared/theming'
```

**After**:
```typescript
import type { MediaReference } from '@clementine/shared'
```

#### 6.2 Update runtime.types

**File**: `apps/clementine-app/src/domains/experience/shared/types/runtime.types.ts`

**Before** (line ~9):
```typescript
import type { MediaReference } from '@/shared/theming'
```

**After**:
```typescript
import type { MediaReference } from '@clementine/shared'
```

#### 6.3 Remove App-Specific Re-export

**File**: `apps/clementine-app/src/shared/theming/schemas/media-reference.schema.ts`

**Delete this file entirely**. The re-export is no longer needed.

**Update**: `apps/clementine-app/src/shared/theming/schemas/index.ts`

Remove the re-export line:
```typescript
// DELETE THIS LINE:
export { mediaReferenceSchema, type MediaReference } from './media-reference.schema'
```

**Validation**:
```bash
cd apps/clementine-app
pnpm type-check
grep -r "from '@/shared/theming'" src/
```

Ensure no remaining imports use the deleted path.

**Checkpoint**: Import paths cleaned up, re-export removed.

---

### Step 7: Validation & Testing (30 minutes)

Run all validation checks to ensure the implementation is correct.

#### 7.1 Type Checking

```bash
# Shared package
cd packages/shared
pnpm type-check

# App
cd apps/clementine-app
pnpm type-check
```

**Expected**: Zero TypeScript errors.

#### 7.2 Linting & Formatting

```bash
cd apps/clementine-app
pnpm app:check
```

**Expected**: All linting and formatting checks pass.

#### 7.3 Manual Testing

Start the dev server and test media upload:

```bash
cd apps/clementine-app
pnpm dev
```

1. Navigate to media library in the app
2. Upload a file with a distinctive name (e.g., "My Test Photo.jpg")
3. Verify the media library displays the original filename
4. Check Firestore console - verify the document has `displayName` field
5. Check Firebase Storage console - verify the storage filename is `{nanoid}.jpg` (no "overlay-" prefix)

#### 7.4 Test Legacy Data

1. Open Firestore console
2. Find an existing media asset without `displayName`
3. Load it in the app UI
4. Verify it displays as "Untitled" (not an error)

**Checkpoint**: All validation passes, manual testing confirms correct behavior.

---

## Verification Checklist

Before marking complete, verify:

- [ ] MediaAsset schema includes `displayName: z.string().default('Untitled')`
- [ ] MediaReference schema includes `displayName: z.string().default('Untitled')`
- [ ] `generateFileName` no longer includes "overlay-" prefix
- [ ] `uploadMediaAsset` captures `file.name` as `displayName`
- [ ] `uploadMediaAsset` returns `displayName` in result
- [ ] All consuming hooks updated to handle `displayName`
- [ ] Import paths use `@clementine/shared` instead of `@/shared/theming`
- [ ] App-specific re-export deleted
- [ ] `pnpm type-check` passes in both packages and app
- [ ] `pnpm app:check` passes
- [ ] Manual testing confirms original filenames display correctly
- [ ] Legacy assets display as "Untitled" without errors

## Common Issues

### Issue: Type errors in consuming code

**Symptom**: TypeScript errors about missing `displayName` property

**Solution**: Ensure you've rebuilt the shared package (`pnpm build` in `packages/shared/`) and updated all consuming code to destructure `displayName`.

### Issue: "Untitled" shows for new uploads

**Symptom**: New uploads show "Untitled" instead of original filename

**Solution**: Verify that `displayName = file.name` is captured in the upload service BEFORE the Firestore document is created.

### Issue: Import errors after deleting re-export

**Symptom**: Module not found errors

**Solution**: Search for all imports from `@/shared/theming/schemas/media-reference` and update to `@clementine/shared`.

## Next Steps

After completing implementation:

1. Run `/speckit.tasks` to generate task list
2. Follow implementation workflow
3. Test thoroughly in development
4. Create PR with clear description referencing this spec
5. Ensure validation gates pass before merge

## Resources

- **Spec**: [spec.md](./spec.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Research**: [research.md](./research.md)
- **Zod Documentation**: https://zod.dev
- **Constitution**: `.specify/memory/constitution.md`
