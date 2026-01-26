# Research: Experience Cover Image

**Feature Branch**: `039-experience-media`
**Date**: 2026-01-22

## Research Questions

### 1. Where should the cover image UI be placed in the experience designer?

**Decision**: Combine thumbnail + experience name in TopNavBar breadcrumb area, opening a dialog on click.

**Rationale**:
- Cover image is "experience identity" - it belongs with the name, not buried in settings
- Small thumbnail in navbar provides visual preview without taking editor space
- Dialog gives ample room for editing both name and cover image
- Pencil icon on hover signals editability without cluttering the UI
- Explicit Save button gives users control over when changes commit

**Alternatives Considered**:
1. **Collapsible section in header** - Rejected; awkward placement, unclear what "header" means
2. **Left sidebar section** - Rejected; takes space from step list, mixes experience-level with step-level
3. **Right panel when no step selected** - Rejected; inaccessible when a step is selected
4. **Settings button → sheet** - Rejected; over-engineers a simple feature, hides the cover image
5. **Just thumbnail in navbar with popover** - Rejected; popover too cramped for name + media

### 2. What existing components can be reused?

**Decision**: Reuse MediaPickerField, useUploadMediaAsset, useUpdateExperience, and Dialog from shadcn/ui.

**Components**:
- **MediaPickerField** (`shared/editor-controls/components/MediaPickerField.tsx`) - Complete drag-drop upload UI
- **useUploadMediaAsset** (`domains/media-library/hooks/useUploadMediaAsset.ts`) - Firebase Storage upload with progress
- **useUpdateExperience** (`domains/experience/shared/hooks/useUpdateExperience.ts`) - Updates name + media fields
- **Dialog** (`ui-kit/ui/dialog.tsx`) - Modal dialog from shadcn/ui

### 3. What is the save behavior?

**Decision**: Upload to Storage immediately (for preview), but only update Firestore on Save button click.

**Rationale**:
- Immediate upload enables preview in the dialog before committing
- Explicit Save gives users control and makes Cancel meaningful
- If user cancels, the uploaded media exists in Storage but isn't linked to the experience
- This matches user expectations for a "details" dialog with Save/Cancel buttons

**Flow**:
```
1. User opens dialog
2. User uploads image → goes to Firebase Storage immediately
3. User sees preview in MediaPickerField
4. User edits name
5a. User clicks Save → experience.media + experience.name updated in Firestore
5b. User clicks Cancel → dialog closes, no Firestore changes (orphan media in Storage is acceptable)
```

### 4. How should the TopNavBar integration work?

**Decision**: Create an `ExperienceIdentityBadge` component that renders thumbnail + name with hover state.

**Implementation**:
```typescript
// ExperienceIdentityBadge renders:
// [🖼️ 24x24] Experience Name [✏️ on hover]
//
// - Thumbnail shows experience.media?.url or placeholder icon
// - Name shows experience.name
// - Pencil icon appears on hover/focus
// - Entire badge is clickable, opens ExperienceDetailsDialog
```

**Integration with TopNavBar**:
- Replace the current breadcrumb label with ExperienceIdentityBadge
- Keep the Sparkles icon linking back to experiences list
- Badge + dialog state managed in ExperienceDesignerLayout

### 5. What is the data model?

**Decision**: Use existing schemas - no changes needed.

**Existing Fields**:
```typescript
// Experience document
{
  name: string,                    // Already exists, editable
  media: {                         // Already exists, currently null
    mediaAssetId: string,
    url: string,
  } | null,
}
```

**useUpdateExperience** already supports partial updates to both `name` and `media` fields.

### 6. What validation and error handling is needed?

**Decision**: Leverage existing validation from useUploadMediaAsset, add form validation for name.

**Validation Rules**:
- **Name**: Required, 1-100 characters (from existing schema)
- **Media**: PNG/JPEG/WebP only, max 5MB (from existing upload utils)

**Error Handling**:
- Invalid file type → Error toast with supported formats
- File too large → Error toast with size limit
- Upload failure → Error toast, user can retry
- Name validation failure → Inline error on field
- Save failure → Error toast, dialog stays open

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Experience Schema | `packages/shared/src/schemas/experience/experience.schema.ts` |
| Designer Layout | `apps/.../experience/designer/containers/ExperienceDesignerLayout.tsx` |
| MediaPickerField | `apps/.../shared/editor-controls/components/MediaPickerField.tsx` |
| Upload Hook | `apps/.../media-library/hooks/useUploadMediaAsset.ts` |
| Update Hook | `apps/.../experience/shared/hooks/useUpdateExperience.ts` |
| Dialog Component | `apps/.../ui-kit/ui/dialog.tsx` |

## Components to Create

| Component | Purpose |
|-----------|---------|
| `ExperienceIdentityBadge` | Thumbnail + name in TopNavBar, clickable to open dialog |
| `ExperienceDetailsDialog` | Dialog with MediaPickerField + name input + Save/Cancel |
| `useUploadExperienceCover` | Hook wrapping useUploadMediaAsset for cover image uploads |

## Implementation Approach

1. **Create `useUploadExperienceCover` hook** - Wraps useUploadMediaAsset, returns upload function + state
2. **Create `ExperienceDetailsDialog` component** - Dialog with form (name + media), handles Save/Cancel
3. **Create `ExperienceIdentityBadge` component** - Small thumbnail + name for navbar, opens dialog
4. **Integrate into ExperienceDesignerLayout** - Replace breadcrumb label with badge, manage dialog state
5. **Test flow** - Upload → preview → save → verify in list/welcome screen
