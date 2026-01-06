# Quickstart: Event Settings - Overlay Configuration

**Feature**: 013-event-settings-overlays
**For**: Developers implementing this feature
**Date**: 2026-01-05

## Overview

This quickstart guide will help you implement the overlay configuration feature. You'll create a new `media-library` domain and extend the existing `event/settings` domain to support overlay upload and configuration.

**Estimated implementation time**: 4-6 hours
**Complexity**: Medium (new domain + existing domain extension)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Read `specs/013-event-settings-overlays/spec.md` (full requirements)
- ✅ Read `specs/013-event-settings-overlays/plan.md` (technical plan)
- ✅ Read `specs/013-event-settings-overlays/data-model.md` (entity schemas)
- ✅ Read `specs/013-event-settings-overlays/research.md` (research findings)
- ✅ Familiarity with TanStack Start, React 19, Firebase client SDK
- ✅ Local dev environment set up (`pnpm dev` working)
- ✅ Firebase project configured (Firestore + Storage)

---

## Implementation Checklist

### Phase 1: Media Library Domain Setup (1-2 hours)

- [ ] **Step 1.1**: Create domain structure
  ```bash
  cd apps/clementine-app/src/domains
  mkdir -p media-library/{hooks,schemas,types}
  touch media-library/index.ts
  ```

- [ ] **Step 1.2**: Create `media-asset.schema.ts`
  - File: `domains/media-library/schemas/media-asset.schema.ts`
  - Copy schema from `data-model.md` (MediaAsset section)
  - Add barrel export: `domains/media-library/schemas/index.ts`

- [ ] **Step 1.3**: Create `media.types.ts`
  - File: `domains/media-library/types/media.types.ts`
  - Export types from schema: `export type { MediaAsset } from '../schemas'`
  - Add barrel export: `domains/media-library/types/index.ts`

- [ ] **Step 1.4**: Create barrel export for domain
  - File: `domains/media-library/index.ts`
  - Re-export: `export * from './hooks'`, `export * from './schemas'`, `export * from './types'`

---

### Phase 2: Upload Hook Implementation (1-2 hours)

- [ ] **Step 2.1**: Create `useUploadMediaAsset.ts`
  - File: `domains/media-library/hooks/useUploadMediaAsset.ts`
  - Import Firebase: `storage`, `firestore` from `@/integrations/firebase/client`
  - Import TanStack Query: `useMutation`, `useQueryClient`
  - Import nanoid: `import { nanoid } from 'nanoid'`

- [ ] **Step 2.2**: Implement file validation helper
  ```typescript
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  function validateFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only PNG, JPG, and WebP images are supported')
    }
    if (file.size > MAX_SIZE) {
      throw new Error('File must be under 5MB')
    }
  }
  ```

- [ ] **Step 2.3**: Implement image dimension extraction helper
  ```typescript
  async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      img.src = url
    })
  }
  ```

- [ ] **Step 2.4**: Implement Storage upload with progress
  - Use `uploadBytesResumable` from Firebase Storage
  - Track progress with `snapshot.bytesTransferred / snapshot.totalBytes * 100`
  - Get download URL after upload completes
  - See `research.md` for full pattern

- [ ] **Step 2.5**: Implement Firestore document creation
  - Use `addDoc` to create `workspaces/{workspaceId}/mediaAssets` document
  - Include all required fields from `mediaAssetSchema`
  - Return `{ mediaAssetId: docRef.id, url: downloadURL }`

- [ ] **Step 2.6**: Wrap in `useMutation` hook
  ```typescript
  export function useUploadMediaAsset(workspaceId: string) {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async ({ file, type }: { file: File; type: 'overlay' | 'logo' | 'other' }) => {
        // Implement upload logic here
        return { mediaAssetId, url }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['mediaAssets', workspaceId] })
      },
    })
  }
  ```

- [ ] **Step 2.7**: Add barrel export for hooks
  - File: `domains/media-library/hooks/index.ts`
  - Export: `export { useUploadMediaAsset } from './useUploadMediaAsset'`

---

### Phase 3: Event Config Schema Update (30 minutes)

- [ ] **Step 3.1**: Update `project-event-config.schema.ts`
  - File: `domains/event/shared/schemas/project-event-config.schema.ts`
  - Add `overlayReferenceSchema` (before `overlaysConfigSchema`)
  - Update `overlaysConfigSchema` to use `overlayReferenceSchema` instead of `z.string().url()`
  - Export new types: `OverlayReference`, `OverlaysConfig`

- [ ] **Step 3.2**: Update schema barrel export
  - File: `domains/event/shared/schemas/index.ts`
  - Re-export new types: `export type { OverlayReference } from './project-event-config.schema'`

---

### Phase 4: Event Settings Hooks (30 minutes)

- [ ] **Step 4.1**: Create `useUpdateOverlays.ts`
  - File: `domains/event/settings/hooks/useUpdateOverlays.ts`
  - Import Firebase: `doc`, `updateDoc`, `increment` from `firebase/firestore`
  - Import TanStack Query: `useMutation`, `useQueryClient`
  - Import schema: `overlaysConfigSchema` from `@/domains/event/shared/schemas`

- [ ] **Step 4.2**: Implement mutation
  ```typescript
  export function useUpdateOverlays(projectId: string, eventId: string) {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (overlays: Partial<OverlaysConfig>) => {
        const validated = overlaysConfigSchema.parse({ ...existingOverlays, ...overlays })

        await updateDoc(eventRef, {
          'draftConfig.overlays': validated,
          draftVersion: increment(1),
          updatedAt: Date.now(),
        })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['event', projectId, eventId] })
      },
    })
  }
  ```

- [ ] **Step 4.3**: Add barrel export
  - File: `domains/event/settings/hooks/index.ts`
  - Export: `export { useUpdateOverlays } from './useUpdateOverlays'`

---

### Phase 5: UI Components (2-3 hours)

- [ ] **Step 5.1**: Create `OverlayFrame.tsx` component
  - File: `domains/event/settings/components/OverlayFrame.tsx`
  - Props: `aspectRatio`, `label`, `overlayRef`, `onUpload`, `onRemove`, `isUploading`, `uploadProgress`
  - States: empty, uploading, uploaded
  - Implement drag-and-drop with file input fallback
  - Use shadcn/ui components (Button, Card, etc.)
  - Use design tokens (no hard-coded colors)
  - See `spec.md` for full component spec

- [ ] **Step 5.2**: Implement drag-and-drop handlers
  ```typescript
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }
  ```

- [ ] **Step 5.3**: Implement upload states
  - **Empty**: Dashed border, upload icon, "Drop image or click to upload" text
  - **Uploading**: Progress bar (0-100%), file name, "Uploading..." text
  - **Uploaded**: Image preview, remove button (visible on hover)

- [ ] **Step 5.4**: Add accessibility
  - File input with `aria-label`
  - Keyboard navigation (Tab, Enter)
  - Live region for upload progress (`aria-live="polite"`)

- [ ] **Step 5.5**: Create `OverlaySection.tsx` container
  - File: `domains/event/settings/containers/OverlaySection.tsx`
  - Import hooks: `useUploadMediaAsset`, `useUpdateOverlays`
  - Import components: `OverlayFrame`
  - Render two `OverlayFrame` components (1:1 and 9:16)
  - Handle upload → config update flow
  - Show error toasts on failure (use Sonner)

- [ ] **Step 5.6**: Implement upload handler
  ```typescript
  const handleUpload = async (file: File, aspectRatio: '1:1' | '9:16') => {
    try {
      // 1. Upload to Storage + create MediaAsset
      const { mediaAssetId, url } = await uploadAsset.mutateAsync({ file, type: 'overlay' })

      // 2. Update event config
      await updateOverlays.mutateAsync({
        [aspectRatio]: { mediaAssetId, url }
      })

      // 3. Success toast
      toast.success('Overlay uploaded successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }
  ```

- [ ] **Step 5.7**: Add barrel exports
  - File: `domains/event/settings/components/index.ts`
  - Export: `export { OverlayFrame } from './OverlayFrame'`
  - File: `domains/event/settings/containers/index.ts`
  - Export: `export { OverlaySection } from './OverlaySection'`

---

### Phase 6: Integration with Settings Page (30 minutes)

- [ ] **Step 6.1**: Import `OverlaySection` into `SettingsSharingPage.tsx`
  - File: `domains/event/settings/containers/SettingsSharingPage.tsx`
  - Import: `import { OverlaySection } from './OverlaySection'`
  - Add `<OverlaySection />` below sharing options section

- [ ] **Step 6.2**: Pass required props
  - `projectId`, `eventId`, `workspaceId` (from route params or context)
  - Current overlay references (from event query)

---

### Phase 7: Firebase Security Rules (30 minutes)

- [ ] **Step 7.1**: Update Firestore rules
  - File: `firestore.rules` (monorepo root)
  - Add rules for `workspaces/{workspaceId}/mediaAssets/{assetId}`
  - See `data-model.md` Security Rules section for full rules

- [ ] **Step 7.2**: Update Storage rules
  - File: `storage.rules` (monorepo root)
  - Add rules for `workspaces/{workspaceId}/media/{fileName}`
  - Enforce 5MB max, allowed MIME types
  - See `data-model.md` Security Rules section for full rules

- [ ] **Step 7.3**: Deploy security rules
  ```bash
  pnpm fb:deploy:rules
  ```

---

### Phase 8: Testing (1-2 hours)

- [ ] **Step 8.1**: Write unit tests for schemas
  - File: `domains/media-library/schemas/__tests__/media-asset.schema.test.ts`
  - Test valid schema, invalid schema, edge cases

- [ ] **Step 8.2**: Write unit tests for file validation
  - Test allowed file types (PNG, JPG, WebP)
  - Test rejected file types (SVG, GIF, PDF)
  - Test file size limits (< 5MB, > 5MB)

- [ ] **Step 8.3**: Write component tests for `OverlayFrame`
  - Test empty state rendering
  - Test uploading state rendering (progress bar)
  - Test uploaded state rendering (image preview)
  - Test drag-and-drop interaction
  - Test file input click interaction
  - Test remove button interaction

- [ ] **Step 8.4**: Manual testing checklist
  - [ ] Upload PNG file (< 5MB)
  - [ ] Upload JPG file (< 5MB)
  - [ ] Upload WebP file (< 5MB)
  - [ ] Try uploading SVG (should reject)
  - [ ] Try uploading file > 5MB (should reject)
  - [ ] Test drag-and-drop on desktop
  - [ ] Test file picker on mobile (camera option)
  - [ ] Verify overlay appears in event config
  - [ ] Remove overlay (should set to null)
  - [ ] Re-upload overlay (should replace)

---

### Phase 9: Validation & Cleanup (30 minutes)

- [ ] **Step 9.1**: Run validation loop
  ```bash
  cd apps/clementine-app
  pnpm check          # Format + lint auto-fix
  pnpm type-check     # TypeScript strict mode
  pnpm test           # Run all tests
  ```

- [ ] **Step 9.2**: Standards compliance review
  - [ ] Review against `frontend/design-system.md` (theme tokens only)
  - [ ] Review against `frontend/component-libraries.md` (shadcn/ui usage)
  - [ ] Review against `frontend/accessibility.md` (keyboard nav, ARIA)
  - [ ] Review against `global/client-first-architecture.md` (client SDK usage)
  - [ ] Review against `global/project-structure.md` (vertical slice, barrel exports)

- [ ] **Step 9.3**: Remove debug code
  - Remove `console.log` statements
  - Remove unused imports
  - Remove commented code

- [ ] **Step 9.4**: Manual test in dev server
  ```bash
  pnpm dev
  ```
  - Navigate to event settings page
  - Upload overlay
  - Verify preview
  - Remove overlay
  - Check browser console for errors

---

## File Structure Summary

After implementation, you should have:

```
apps/clementine-app/src/

# NEW: Media Library Domain
domains/media-library/
├── hooks/
│   ├── useUploadMediaAsset.ts       # ✅ Upload hook
│   └── index.ts                     # ✅ Barrel export
├── schemas/
│   ├── media-asset.schema.ts        # ✅ MediaAsset schema
│   └── index.ts                     # ✅ Barrel export
├── types/
│   ├── media.types.ts               # ✅ Types
│   └── index.ts                     # ✅ Barrel export
└── index.ts                         # ✅ Domain public API

# UPDATED: Event Settings
domains/event/settings/
├── components/
│   ├── OverlayFrame.tsx             # ✅ NEW component
│   └── OverlaySection.tsx           # ✅ NEW container (or in containers/)
├── hooks/
│   └── useUpdateOverlays.ts         # ✅ NEW hook
└── ...

# UPDATED: Event Shared Schemas
domains/event/shared/schemas/
└── project-event-config.schema.ts   # ✅ UPDATED (overlayReferenceSchema)

# Firebase Rules (monorepo root)
firestore.rules                      # ✅ UPDATED (mediaAssets rules)
storage.rules                        # ✅ UPDATED (media/* rules)
```

---

## Common Issues & Solutions

### Issue 1: "Permission denied" when uploading

**Cause**: User is not workspace admin
**Solution**: Check Firestore security rules and user role

### Issue 2: "File too large" error

**Cause**: File > 5MB
**Solution**: Client-side validation should prevent this, but if it happens, reject with toast error

### Issue 3: Upload progress stuck at 0%

**Cause**: `uploadBytesResumable` progress callback not firing
**Solution**: Verify Storage rules allow upload, check network inspector

### Issue 4: Image dimensions not extracted

**Cause**: `createObjectURL` failing or image not loading
**Solution**: Check browser console for errors, verify file is valid image

### Issue 5: Config update fails after successful upload

**Cause**: MediaAsset created but event config not updated
**Solution**: MediaAsset remains valid, retry config update (future: implement retry logic)

---

## Next Steps

After completing implementation:

1. ✅ Commit changes to `013-event-settings-overlays` branch
2. ✅ Create pull request against `main`
3. ✅ Request code review from team
4. ✅ Address review feedback
5. ✅ Merge to `main` after approval
6. ✅ Deploy to staging environment
7. ✅ QA testing on staging
8. ✅ Deploy to production

---

## Resources

- **Spec**: `specs/013-event-settings-overlays/spec.md`
- **Plan**: `specs/013-event-settings-overlays/plan.md`
- **Data Model**: `specs/013-event-settings-overlays/data-model.md`
- **Research**: `specs/013-event-settings-overlays/research.md`
- **Contracts**: `specs/013-event-settings-overlays/contracts/firebase-operations.md`
- **TanStack Query**: https://tanstack.com/query
- **Firebase Storage**: https://firebase.google.com/docs/storage/web/upload-files
- **shadcn/ui**: https://ui.shadcn.com
- **Drag-and-Drop API**: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API

---

## Questions?

If you encounter issues or have questions:

1. Check the spec, plan, data-model, and research docs
2. Review existing code patterns in the codebase
3. Ask the team in Slack/Discord
4. Update this quickstart doc if you find missing information

**Happy coding!** 🚀
