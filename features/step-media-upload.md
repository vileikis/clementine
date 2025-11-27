# Step Media Upload

## Overview

Replace the manual URL text input for `mediaUrl` in step editors with a proper media upload component that supports images, videos, GIFs, and Lottie JSON animations.

## Problem Statement

Currently, the `BaseStepEditor` component (`web/src/features/steps/components/editors/BaseStepEditor.tsx:87-110`) uses a simple text input for the `mediaUrl` field. Users must:

1. Upload media files externally
2. Copy the URL
3. Paste it into the text input

This creates friction and a poor user experience. The platform already has upload components (`ImageUploadField`, `PreviewMediaUpload`) that provide a better pattern.

## Goals

- **G1**: Enable direct file upload for step media without leaving the editor
- **G2**: Support multiple media types: images (JPG, PNG, WebP), videos (MP4, WebM), GIFs, and Lottie JSON animations
- **G3**: Provide accurate preview based on media type (static images, animated GIFs, autoplaying videos, Lottie player)
- **G4**: Maintain backward compatibility with existing `mediaUrl` string field in data model
- **G5**: Store media in a shared location to enable future media library functionality

## Non-Goals

- Changing the underlying Firestore data model (`mediaUrl` remains a string URL)
- Building the full media library UI (future scope)
- Supporting audio files or other media types not listed

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Lottie library | `lottie-react` | Smaller bundle size, sufficient features |
| Video size limit | 25MB | Balance between quality and performance |
| Delete behavior | Unlink only | Media stored in shared location for future library; "Remove" unlinks from step but keeps file |

## Technical Design

### Data Model Changes

Add an optional `mediaType` field to steps to enable proper rendering:

```typescript
// web/src/features/steps/types/step.types.ts
export type StepMediaType = "image" | "gif" | "video" | "lottie";

export interface StepBase {
  // ... existing fields
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;  // NEW: enables proper preview rendering
}
```

Update schema (`web/src/features/steps/schemas/step.schemas.ts`):

```typescript
const stepBaseSchema = z.object({
  // ... existing fields
  mediaUrl: z.string().url().nullish(),
  mediaType: z.enum(["image", "gif", "video", "lottie"]).nullish(),  // NEW
});
```

### Storage Architecture (Shared Media Library Pattern)

**Key principle**: Media files are stored in a shared company-level location, not tied to individual steps. This enables:
- Reuse across multiple events, journeys, and steps
- Future media library UI for browsing/selecting existing uploads
- "Remove from step" = unlink (clear `mediaUrl`), not delete file
- True deletion only via future media library UI

**Storage path pattern**:
```
media/{companyId}/{mediaType}/{timestamp}-{filename}
```

Examples:
- `media/abc123/image/1701234567890-hero.png`
- `media/abc123/video/1701234567890-intro.mp4`
- `media/abc123/lottie/1701234567890-loading.json`

**Why company-level?**
- All events belong to a company
- Natural boundary for media sharing
- Enables future cross-event asset reuse
- Aligns with existing permission model

### New Component: StepMediaUpload

Create `web/src/features/steps/components/shared/StepMediaUpload.tsx`:

```typescript
interface StepMediaUploadProps {
  companyId: string;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;
  onUpload: (url: string, type: StepMediaType) => void;
  onRemove: () => void;
  disabled?: boolean;
}
```

Key features:
- File type detection from MIME type and extension
- Lottie JSON validation (check for valid Lottie structure)
- Preview rendering based on detected type
- Uses `lottie-react` for Lottie animations
- "Remove" button clears form fields only (does not delete file from storage)

### Supported File Types

| Type   | MIME Types                          | Extensions               | Max Size |
|--------|-------------------------------------|--------------------------|----------|
| Image  | image/jpeg, image/png, image/webp   | .jpg, .jpeg, .png, .webp | 10MB     |
| GIF    | image/gif                           | .gif                     | 10MB     |
| Video  | video/mp4, video/webm               | .mp4, .webm              | 25MB     |
| Lottie | application/json                    | .json                    | 5MB      |

### Server Actions

Create `web/src/features/steps/actions/step-media.ts`:

```typescript
/**
 * Upload media to shared company storage
 * Returns public URL and detected media type
 */
export async function uploadStepMedia(
  companyId: string,
  file: File
): Promise<ActionResponse<{ publicUrl: string; mediaType: StepMediaType }>>
```

**Note**: No delete action exposed for steps. Media deletion will be handled by future media library feature.

### Lottie JSON Validation

Before uploading `.json` files, validate Lottie structure:

```typescript
function isValidLottie(json: unknown): boolean {
  if (typeof json !== "object" || json === null) return false;
  const obj = json as Record<string, unknown>;
  // Lottie files must have these properties
  return (
    typeof obj.v === "string" &&      // version
    typeof obj.fr === "number" &&     // frame rate
    typeof obj.ip === "number" &&     // in point
    typeof obj.op === "number" &&     // out point
    Array.isArray(obj.layers)         // layers array
  );
}
```

### BaseStepEditor Integration

Modify `BaseStepEditor` to use the new component:

**Before:**
```tsx
<FormField
  name="mediaUrl"
  render={({ field }) => (
    <Input type="url" {...field} />
  )}
/>
```

**After:**
```tsx
<StepMediaUpload
  companyId={companyId}
  mediaUrl={form.watch("mediaUrl")}
  mediaType={form.watch("mediaType")}
  onUpload={(url, type) => {
    form.setValue("mediaUrl", url);
    form.setValue("mediaType", type);
  }}
  onRemove={() => {
    form.setValue("mediaUrl", "");
    form.setValue("mediaType", null);
  }}
/>
```

**Props change**: `BaseStepEditorProps` needs `companyId` passed down from parent editors.

### Preview Rendering Updates

Update `StepPreview` components to render based on `mediaType`:

- `image`: Use `<Image>` component
- `gif`: Use `<Image>` with `unoptimized` prop
- `video`: Use `<video autoPlay muted loop playsInline>`
- `lottie`: Use `<Lottie>` from `lottie-react`

### Dependencies

Add Lottie player library:
```bash
cd web && pnpm add lottie-react
```

## Implementation Tasks

### Phase 1: Core Infrastructure
1. Add `lottie-react` dependency
2. Update step types and schemas with `mediaType` field
3. Create upload action with shared storage path pattern
4. Add Lottie validation utility

### Phase 2: Upload Component
5. Create `StepMediaUpload` component
6. Implement file type detection logic
7. Implement preview rendering for all media types (image, gif, video, lottie)
8. Style upload/remove buttons and preview container

### Phase 3: Integration
9. Update `BaseStepEditorProps` interface to include `companyId`
10. Update `BaseStepEditor` to use `StepMediaUpload` component
11. Update all step editor components to pass `companyId` prop
12. Update form schemas in editors to include `mediaType` field

### Phase 4: Preview System
13. Update step preview components to handle `mediaType`
14. Add Lottie player to preview system
15. Update guest-facing step renderers

### Phase 5: Testing & Polish
16. Test upload for all file types
17. Test preview rendering for all media types
18. Handle edge cases (large files, invalid Lottie JSON, network errors)
19. Verify backward compatibility with existing `mediaUrl` values

## Reference Components

| Component | Path | Purpose |
|-----------|------|---------|
| ImageUploadField | `web/src/components/shared/ImageUploadField.tsx` | Generic image upload pattern |
| PreviewMediaUpload | `web/src/features/experiences/components/shared/PreviewMediaUpload.tsx` | Multi-type media upload with deletion |
| uploadImage | `web/src/lib/storage/actions.ts` | Storage upload action pattern |
| uploadPreviewMedia | `web/src/features/experiences/actions/photo-media.ts` | Multi-type upload with type detection |

## Acceptance Criteria

- [ ] Users can upload images (JPG, PNG, WebP) directly in step editors
- [ ] Users can upload GIFs with animated preview
- [ ] Users can upload videos (MP4, WebM) with autoplay preview
- [ ] Users can upload Lottie JSON files with animated preview
- [ ] Users can remove media from step (unlinks, does not delete file)
- [ ] Preview panel shows correct rendering based on media type
- [ ] Guest-facing steps render media correctly
- [ ] File size limits are enforced (10MB images/GIFs, 25MB videos, 5MB Lottie)
- [ ] Invalid file types show clear error messages
- [ ] Invalid Lottie JSON shows validation error
- [ ] Existing steps with `mediaUrl` continue to work (backward compatible)
- [ ] Media stored at company level for future sharing

## Future Scope (Out of scope for this PRD)

### Media Library Feature
- List all uploaded media for a company
- Browse/search media assets
- Select existing media for steps (instead of re-uploading)
- True delete functionality with orphan detection
- Usage tracking (which steps use which media)
