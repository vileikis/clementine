# Quickstart: Photo Experience Tweaks

**Feature**: Photo Experience Tweaks ([spec.md](./spec.md))
**Date**: 2025-11-17
**Purpose**: Developer setup, testing, and implementation guide

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Firebase project configured (`.env.local` with credentials)
- Git repository cloned locally
- Branch `001-photo-experience-tweaks` checked out

---

## Development Setup

### 1. Install Dependencies

```bash
# From repository root
pnpm install
```

### 2. Start Development Server

```bash
# From repository root
pnpm dev
```

This starts the Next.js development server at `http://localhost:3000`

### 3. Access Event Builder

Navigate to an existing event or create a new one:

```
http://localhost:3000/events/[eventId]/experiences
```

You should see the ExperienceEditor component where you'll implement the changes.

---

## Implementation Checklist

### Phase 1: Schema Updates

- [ ] Update `web/src/lib/schemas/firestore.ts`:
  - [ ] Add `aspectRatioSchema` enum
  - [ ] Add `countdownEnabled`, `countdownSeconds`, `aiAspectRatio` fields to `experienceSchema`
  - [ ] Expand `previewTypeSchema` to include "gif" and "video"
  - [ ] Remove `allowCamera`, `allowLibrary`, `overlayLogoPath` from `updateExperienceSchema`
  - [ ] Add `uploadPreviewMediaSchema` and `previewMediaResultSchema`

- [ ] Update `web/src/lib/types/firestore.ts`:
  - [ ] Add new fields to `Experience` interface
  - [ ] Mark deprecated fields as optional
  - [ ] Update `previewType` to include "gif" and "video"

### Phase 2: Server Actions

- [ ] Update `web/src/lib/actions/experiences.ts`:
  - [ ] Modify `updateExperience` to support new fields
  - [ ] Add `uploadPreviewMedia` Server Action
  - [ ] Add `deletePreviewMedia` Server Action
  - [ ] Add `uploadFrameOverlay` Server Action
  - [ ] Add `deleteFrameOverlay` Server Action
  - [ ] Ensure old preview/overlay files are deleted when replaced

### Phase 3: UI Components

- [ ] Create `web/src/components/organizer/builder/PreviewMediaUpload.tsx`:
  - [ ] File upload with image/GIF/video support
  - [ ] Conditional rendering based on `previewType`
  - [ ] Upload/replace/remove buttons
  - [ ] Helper text: "This media will appear on the guest start screen..."
  - [ ] 10MB file size validation

- [ ] Create `web/src/components/organizer/builder/CountdownSettings.tsx`:
  - [ ] Toggle switch for `countdownEnabled`
  - [ ] Number input (0-10) for `countdownSeconds`
  - [ ] Hide timer input when toggle off
  - [ ] Default value: 3 seconds

- [ ] Create `web/src/components/organizer/builder/OverlaySettings.tsx`:
  - [ ] Toggle switch for overlay enable/disable
  - [ ] Frame overlay upload (PNG recommended)
  - [ ] Preview of overlay over sample photo
  - [ ] Upload/replace/remove buttons
  - [ ] Remove logo overlay support entirely

- [ ] Create `web/src/components/organizer/builder/AITransformSettings.tsx`:
  - [ ] Horizontal row layout for reference images with Flexbox
  - [ ] Aspect ratio picker (Select component) with 5 options
  - [ ] Prompt Guide link next to Model Picker (dynamic URL)
  - [ ] Link opens in new tab

- [ ] Modify `web/src/components/organizer/builder/ExperienceEditor.tsx`:
  - [ ] Remove capture options section (`allowCamera`, `allowLibrary`)
  - [ ] Integrate 4 new sub-components
  - [ ] Update local state to include new fields
  - [ ] Update `handleSave` to include new fields in `onSave` call
  - [ ] Remove logo overlay state/UI

### Phase 4: Constants & Utilities

- [ ] Create `web/src/lib/constants/ai-models.ts`:
  - [ ] Define `AI_MODEL_PROMPT_GUIDES` with NanoBanana URL
  - [ ] Export for use in `AITransformSettings`

- [ ] Extend `web/src/components/organizer/builder/ImageUploadField.tsx` (if needed):
  - [ ] Support `accept` prop for MIME types (image/*, video/*)
  - [ ] Display video preview in addition to image preview

### Phase 5: Testing

- [ ] Add tests in `web/src/lib/schemas/firestore.test.ts`:
  - [ ] Validate `countdownSeconds` range (0-10)
  - [ ] Validate `aiAspectRatio` enum values
  - [ ] Validate `previewType` accepts "gif" and "video"
  - [ ] Ensure deprecated fields are rejected in `updateExperienceSchema`

- [ ] Add tests in `web/src/components/organizer/builder/ExperienceEditor.test.tsx`:
  - [ ] CountdownSettings toggle shows/hides timer input
  - [ ] Aspect ratio picker displays all 5 options
  - [ ] Preview media renders correctly for image/GIF/video
  - [ ] Prompt Guide link URL changes based on selected model

### Phase 6: Validation Loop

- [ ] Run `pnpm lint` and fix all errors/warnings
- [ ] Run `pnpm type-check` and resolve all TypeScript errors
- [ ] Run `pnpm test` and ensure all tests pass
- [ ] Manual testing in dev server (upload preview media, set countdown, select aspect ratio)

---

## Manual Testing Guide

### Test 1: Preview Media Upload (Image)

1. Navigate to `/events/[eventId]/experiences/[experienceId]`
2. In Preview Media section, click "Upload"
3. Select an image file (JPEG/PNG, <10MB)
4. Verify image displays as static thumbnail
5. Click "Replace" and upload a different image
6. Verify old image is replaced
7. Click "Remove" and verify image is deleted

### Test 2: Preview Media Upload (GIF)

1. Upload a GIF file (<10MB)
2. Verify GIF autoplays in a loop in the preview
3. Save and reload page
4. Verify GIF still autoplays

### Test 3: Preview Media Upload (Video)

1. Upload a video file (MP4/WebM, <10MB)
2. Verify video autoplays muted in a loop in the preview
3. Save and reload page
4. Verify video still autoplays

### Test 4: Countdown Settings

1. Toggle "Countdown Enabled" on
2. Verify countdown timer input appears with default value 3
3. Change timer to 5 seconds
4. Save experience
5. Toggle countdown off
6. Verify timer input is hidden
7. Save and reload page
8. Verify countdown is still disabled

### Test 5: Aspect Ratio Picker

1. Click aspect ratio picker
2. Verify all 5 options are present (1:1, 3:4, 4:5, 9:16, 16:9)
3. Select "9:16" (Vertical - Stories)
4. Save experience
5. Reload page
6. Verify "9:16" is still selected

### Test 6: Prompt Guide Link

1. Ensure AI model is set to "NanoBanana"
2. Verify "Prompt Guide" link is visible next to Model Picker
3. Click link
4. Verify it opens https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide in new tab

### Test 7: Frame Overlay

1. Toggle "Overlay Enabled" on
2. Upload a PNG frame overlay (<10MB)
3. Verify frame displays over a sample photo preview
4. Upload a different frame
5. Verify old frame is replaced
6. Click "Remove"
7. Verify overlay is deleted

### Test 8: Deprecated Fields Removed

1. Inspect ExperienceEditor UI
2. Verify no "Capture Options" section (allowCamera, allowLibrary)
3. Verify no "Logo Overlay" upload field
4. Create a new experience
5. Save and inspect Firestore document
6. Verify deprecated fields are NOT present in new document

### Test 9: Mobile Responsiveness

1. Open browser DevTools
2. Switch to mobile viewport (375px width - iPhone)
3. Verify:
   - Preview media upload is usable
   - Countdown toggle and timer input are touch-friendly (≥44px)
   - Aspect ratio picker is easily tappable
   - Reference images wrap to multiple rows if needed
   - Prompt Guide link is easily tappable

### Test 10: Validation Errors

1. Try to upload a 15MB preview video
2. Verify error: "File too large. Maximum size: 10MB"
3. Try to set countdown timer to 15 seconds
4. Verify validation prevents values >10
5. Try to upload a .txt file as preview media
6. Verify error: "Invalid file type..."

---

## Common Issues & Solutions

### Issue: Preview media not displaying after upload

**Cause**: Firestore not updated with public URL after Storage upload

**Solution**: Ensure `updateExperience` is called after `uploadPreviewMedia`:

```typescript
const { publicUrl, fileType } = await uploadPreviewMedia(eventId, experienceId, file);
await updateExperience(eventId, experienceId, {
  previewPath: publicUrl,
  previewType: fileType,
});
```

### Issue: Video preview not autoplaying

**Cause**: Browser autoplay policy blocks unmuted videos

**Solution**: Ensure `<video>` element has `muted` attribute:

```tsx
<video src={previewPath} autoPlay muted loop />
```

### Issue: Countdown timer input shows negative values

**Cause**: Input type="number" allows negative values

**Solution**: Add `min={0}` and `max={10}` attributes:

```tsx
<Input type="number" min={0} max={10} value={countdownSeconds} />
```

### Issue: TypeScript error - deprecated fields not found

**Cause**: Deprecated fields removed from Experience type but still used in code

**Solution**: Mark deprecated fields as optional in `Experience` interface:

```typescript
export interface Experience {
  // ...
  allowCamera?: boolean; // DEPRECATED
  allowLibrary?: boolean; // DEPRECATED
}
```

### Issue: Old overlay not deleted when uploading new one

**Cause**: `uploadFrameOverlay` Server Action not deleting old file

**Solution**: Implement cleanup in Server Action:

```typescript
if (experience.overlayFramePath) {
  await deleteFileFromStorage(experience.overlayFramePath);
}
```

---

## Environment Variables

Ensure `.env.local` has Firebase configuration:

```env
# Firebase Project Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Performance Optimization Tips

### 1. Preview Media Compression

**Recommendation**: Ask organizers to compress videos before upload

- Video: Use H.264 codec, 720p max resolution
- GIF: Use GIF optimization tools (e.g., ezgif.com)
- Image: Use WebP format when possible

**Implementation**: Add helper text in `PreviewMediaUpload` component:

```tsx
<p className="text-sm text-muted-foreground">
  For best performance, compress videos to 720p or lower. Recommended formats: MP4 (H.264), WebP, PNG.
</p>
```

### 2. Lazy Loading

**Recommendation**: Lazy load video preview media

```tsx
<video src={previewPath} autoPlay muted loop loading="lazy" />
```

### 3. Image Thumbnails

**Future Enhancement**: Generate thumbnails for large preview images

- Store both full-size and thumbnail URLs
- Display thumbnail in ExperienceEditor
- Use full-size on guest start screen

---

## Firebase Storage Structure

After implementing this feature, Firebase Storage will have this structure:

```
/events
  /{eventId}
    /experiences
      /{experienceId}
        /preview
          /{timestamp}-{filename}.{ext}  # Preview media (image/GIF/video)
        /overlay
          /{timestamp}-{filename}.png    # Frame overlay
        /references
          /{timestamp}-{filename}.{ext}  # AI reference images (existing)
```

**Notes**:
- Old files are deleted when replaced (automatic cleanup)
- Public URLs stored in Firestore for instant rendering
- No signed URLs needed (all media is public)

---

## Deployment Checklist

Before merging to main:

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Manual testing completed (all 10 test scenarios)
- [ ] Mobile responsiveness verified (320px-768px)
- [ ] Preview media upload/display works for image/GIF/video
- [ ] Countdown settings save and load correctly
- [ ] Aspect ratio picker displays all 5 options
- [ ] Prompt Guide link opens correct URL
- [ ] Frame overlay upload/preview/delete works
- [ ] Deprecated fields removed from UI
- [ ] Firebase Storage cleanup tested (old files deleted)
- [ ] Code reviewed (Constitution compliance)
- [ ] Documentation updated (CLAUDE.md if needed)

---

## Next Steps (Post-Deployment)

1. **Monitor Firebase Storage usage**: Check for orphaned files or storage quota issues
2. **Gather organizer feedback**: Are preview media types useful? Any missing aspect ratios?
3. **Guest capture flow**: Implement countdown timer in guest photo capture component
4. **AI generation integration**: Connect aspect ratio setting to backend AI generation workflow
5. **Data migration** (optional): Clean up deprecated fields from existing experiences

---

## Support & Resources

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/experience-actions.ts](./contracts/experience-actions.ts)
- **Research Decisions**: [research.md](./research.md)
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- **Firebase Docs**: https://firebase.google.com/docs/storage
- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

---

## Glossary

- **Preview Media**: Image/GIF/video shown to guests on start screen before they begin the experience
- **Countdown Timer**: Timer shown to guests before photo is captured (e.g., "3... 2... 1... Smile!")
- **Frame Overlay**: Image overlay applied on top of captured photos (e.g., branded border)
- **Aspect Ratio**: Width-to-height ratio of AI-generated output (e.g., 1:1 = square, 9:16 = vertical)
- **Reference Images**: Example images uploaded by organizer to guide AI generation style
- **Prompt Guide**: External documentation link for writing effective AI prompts
- **Server Action**: Next.js server-side function that runs on the backend (Admin SDK)
- **Admin SDK**: Firebase server-side SDK with elevated permissions (write access)
- **Client SDK**: Firebase client-side SDK for real-time reads (limited permissions)
