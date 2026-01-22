# Quickstart: Experience Cover Image

**Feature Branch**: `039-experience-media`
**Date**: 2026-01-22

## Overview

This guide explains how to implement the Experience Cover Image feature, which allows admins to upload a cover image and edit the experience name via a dialog in the experience designer.

## Prerequisites

- Familiarity with the experience designer domain (`apps/clementine-app/src/domains/experience/designer/`)
- Understanding of TanStack Query mutations
- Knowledge of shadcn/ui Dialog component

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TopNavBar                                                              │
│  [✨→] [ExperienceIdentityBadge]      [Save] [Changes] [Preview] [Publish] │
│         ┌──────────────────────┐                                        │
│         │ [🖼️] My Experience ✏️ │  ← Clickable badge                     │
│         └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    ↓ onClick
          ┌─────────────────────────────────┐
          │   ExperienceDetailsDialog       │
          │                                 │
          │   Cover Image                   │
          │   ┌─────────────────────────┐  │
          │   │    MediaPickerField     │  │  ← Upload to Storage (preview)
          │   └─────────────────────────┘  │
          │                                 │
          │   Name                          │
          │   [_______________________]     │
          │                                 │
          │            [Cancel]  [Save]     │  ← Save commits to Firestore
          └─────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Upload Hook

Create `apps/clementine-app/src/domains/experience/designer/hooks/useUploadExperienceCover.ts`:

```typescript
/**
 * Hook for uploading experience cover images to Firebase Storage.
 *
 * Note: This only uploads to Storage for preview purposes.
 * The actual experience.media update happens when the dialog's Save button is clicked.
 */
import { useCallback, useState } from 'react'
import { useUploadMediaAsset } from '@/domains/media-library'
import { toast } from 'sonner'
import type { ExperienceMedia } from '@clementine/shared'

interface UploadResult {
  mediaAssetId: string
  url: string
}

export function useUploadExperienceCover(
  workspaceId: string | undefined,
  userId: string | undefined,
) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | undefined>()

  const uploadAsset = useUploadMediaAsset(workspaceId, userId)

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!workspaceId || !userId) {
      toast.error('Cannot upload: missing context')
      return null
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await uploadAsset.mutateAsync({
        file,
        type: 'other',
        onProgress: setUploadProgress,
      })

      return { mediaAssetId: result.mediaAssetId, url: result.url }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(undefined)
    }
  }, [workspaceId, userId, uploadAsset])

  return {
    upload,
    isUploading,
    uploadProgress,
  }
}
```

### Step 2: Create Experience Details Dialog

Create `apps/clementine-app/src/domains/experience/designer/components/ExperienceDetailsDialog.tsx`:

```typescript
/**
 * Dialog for editing experience details (name + cover image).
 *
 * - Media uploads go to Storage immediately (for preview)
 * - Firestore update only happens on Save button click
 * - Cancel discards pending changes (uploaded media may remain orphaned)
 */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useUploadExperienceCover } from '../hooks/useUploadExperienceCover'
import { useUpdateExperience } from '@/domains/experience/shared'
import { MediaPickerField } from '@/shared/editor-controls'
import { Button } from '@/ui-kit/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import type { Experience, ExperienceMedia } from '@clementine/shared'

interface ExperienceDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experience: Experience
  workspaceId: string
  userId: string
}

export function ExperienceDetailsDialog({
  open,
  onOpenChange,
  experience,
  workspaceId,
  userId,
}: ExperienceDetailsDialogProps) {
  // Local form state (reset when dialog opens)
  const [name, setName] = useState(experience.name)
  const [media, setMedia] = useState<ExperienceMedia | null>(experience.media)
  const [nameError, setNameError] = useState<string | null>(null)

  // Upload hook (for preview only)
  const { upload, isUploading, uploadProgress } = useUploadExperienceCover(
    workspaceId,
    userId,
  )

  // Update mutation (for Save)
  const updateExperience = useUpdateExperience()

  // Reset form state when dialog opens
  useEffect(() => {
    if (open) {
      setName(experience.name)
      setMedia(experience.media)
      setNameError(null)
    }
  }, [open, experience.name, experience.media])

  // Handle media upload (preview only)
  const handleUpload = async (file: File) => {
    const result = await upload(file)
    if (result) {
      setMedia({ mediaAssetId: result.mediaAssetId, url: result.url })
    }
  }

  // Handle media remove
  const handleRemoveMedia = () => {
    setMedia(null)
  }

  // Validate form
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setNameError('Name is required')
      return false
    }
    if (name.length > 100) {
      setNameError('Name must be 100 characters or less')
      return false
    }
    setNameError(null)
    return true
  }

  // Handle Save
  const handleSave = async () => {
    if (!validateForm()) return

    try {
      await updateExperience.mutateAsync({
        workspaceId,
        experienceId: experience.id,
        name: name.trim(),
        media,
      })

      toast.success('Experience updated')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to save changes')
    }
  }

  // Check if there are unsaved changes
  const hasChanges =
    name !== experience.name ||
    media?.mediaAssetId !== experience.media?.mediaAssetId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Experience Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <MediaPickerField
              value={media?.url ?? null}
              onChange={(value) => {
                if (value === null) handleRemoveMedia()
              }}
              onUpload={handleUpload}
              accept="image/png,image/jpeg,image/webp"
              removable
              uploading={isUploading}
              uploadProgress={uploadProgress}
            />
            <p className="text-xs text-muted-foreground">
              Displayed in experience lists and welcome screens
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="experience-name">Name</Label>
            <Input
              id="experience-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              placeholder="Experience name"
              maxLength={100}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isUploading || updateExperience.isPending}
          >
            {updateExperience.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 3: Create Experience Identity Badge

Create `apps/clementine-app/src/domains/experience/designer/components/ExperienceIdentityBadge.tsx`:

```typescript
/**
 * Clickable badge showing experience thumbnail + name.
 * Displayed in TopNavBar, opens ExperienceDetailsDialog on click.
 */
import { ImageIcon, Pencil } from 'lucide-react'
import type { Experience } from '@clementine/shared'

interface ExperienceIdentityBadgeProps {
  experience: Experience
  onClick: () => void
}

export function ExperienceIdentityBadge({
  experience,
  onClick,
}: ExperienceIdentityBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors"
    >
      {/* Thumbnail */}
      <div className="h-6 w-6 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
        {experience.media?.url ? (
          <img
            src={experience.media.url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <span className="font-medium text-sm truncate max-w-[200px]">
        {experience.name}
      </span>

      {/* Pencil icon (visible on hover) */}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
```

### Step 4: Integrate into Designer Layout

Modify `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerLayout.tsx`:

```typescript
// Add imports
import { useState } from 'react'
import { ExperienceDetailsDialog } from '../components/ExperienceDetailsDialog'
import { ExperienceIdentityBadge } from '../components/ExperienceIdentityBadge'
import { useAuth } from '@/domains/auth'

// In the component, add state and auth:
const [showDetailsDialog, setShowDetailsDialog] = useState(false)
const { user } = useAuth()

// Update the breadcrumbs prop in TopNavBar:
breadcrumbs={[
  {
    // Replace label with custom element
    label: (
      <ExperienceIdentityBadge
        experience={experience}
        onClick={() => setShowDetailsDialog(true)}
      />
    ),
    icon: Sparkles,
    iconHref: experiencesPath,
  },
]}

// Add dialog before closing </div>:
<ExperienceDetailsDialog
  open={showDetailsDialog}
  onOpenChange={setShowDetailsDialog}
  experience={experience}
  workspaceId={workspaceId}
  userId={user?.uid ?? ''}
/>
```

## Testing

### Manual Test Checklist

1. **Identity Badge Display**
   - [ ] Thumbnail shows in navbar (or placeholder icon if no image)
   - [ ] Experience name shows next to thumbnail
   - [ ] Pencil icon appears on hover
   - [ ] Clicking badge opens dialog

2. **Dialog - Upload Flow**
   - [ ] Dialog shows current name and cover image
   - [ ] Upload an image → progress indicator shows
   - [ ] Preview appears in dialog after upload
   - [ ] Click Cancel → dialog closes, no changes saved
   - [ ] Reopen dialog → original values restored

3. **Dialog - Save Flow**
   - [ ] Change name and/or upload image
   - [ ] Click Save → loading state on button
   - [ ] Dialog closes on success
   - [ ] Toast shows "Experience updated"
   - [ ] Thumbnail in navbar updates
   - [ ] Name in navbar updates

4. **Display Verification**
   - [ ] Experience list shows updated thumbnail
   - [ ] Event editor shows updated thumbnail
   - [ ] Welcome screen preview shows updated thumbnail

5. **Error Handling**
   - [ ] Upload file > 5MB → error toast
   - [ ] Upload non-image → error toast
   - [ ] Empty name → inline error, Save disabled
   - [ ] Save fails → error toast, dialog stays open

## Key Files

| File | Purpose |
|------|---------|
| `designer/hooks/useUploadExperienceCover.ts` | Upload to Storage (preview only) |
| `designer/components/ExperienceDetailsDialog.tsx` | Dialog with form + Save/Cancel |
| `designer/components/ExperienceIdentityBadge.tsx` | Thumbnail + name badge for navbar |
| `designer/containers/ExperienceDesignerLayout.tsx` | Integration point |
| `shared/editor-controls/components/MediaPickerField.tsx` | Reusable upload UI |
| `experience/shared/hooks/useUpdateExperience.ts` | Firestore update |

## Troubleshooting

### Thumbnail doesn't update in navbar after save
- Check that `useUpdateExperience` invalidates the experience query
- Verify the experience prop is being re-fetched after mutation

### Dialog doesn't reset on reopen
- Ensure `useEffect` with `[open, experience.name, experience.media]` deps resets state

### Upload succeeds but preview doesn't show
- Check that `handleUpload` correctly sets `media` state with returned URL
- Verify MediaPickerField receives the updated `value` prop
