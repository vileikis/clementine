# Media Library Picker - PRD

## Status: Draft

**Created**: 2025-01-27
**Last Updated**: 2025-01-27
**Domain**: `media-library`

---

## Overview

This document outlines the requirements for a reusable Media Library Picker component. The picker allows users to browse, search, and select existing media assets from their workspace library, as well as upload new assets. This is a general-purpose domain feature that can be used across multiple features (AI Presets, Experience Designer, Event Designer, etc.).

---

## Problem Statement

Currently, media selection in the application is limited to direct upload via `MediaPickerField`. Users cannot browse or select from their existing media library. This leads to:

1. **Duplicate uploads** - Users re-upload the same images multiple times
2. **Poor discoverability** - No way to find and reuse existing assets
3. **Inefficient workflow** - Cannot leverage previously uploaded media

---

## Goals

1. Enable users to browse their workspace media library
2. Support searching/filtering media by filename
3. Handle large libraries with pagination/infinite scroll
4. Allow uploading new media within the picker flow
5. Support single and multi-select modes
6. Provide a reusable component for any feature needing media selection

---

## Non-Goals (Out of Scope)

- Media editing/cropping within picker
- Folder/organization structure
- Media tagging/categorization
- Bulk operations (delete, move)
- External media sources (URLs, stock photos)

---

## User Stories

### User Story 1 - Browse Media Library (Priority: P1)

A user wants to select an existing image from their workspace library instead of uploading a new one.

**Acceptance Criteria**:
1. User clicks "Add from Library" or similar trigger
2. Dialog opens showing grid of workspace media assets
3. User can scroll through available media
4. User clicks to select one or more items
5. User confirms selection
6. Selected media is returned to the calling feature

### User Story 2 - Search Media (Priority: P2)

A user has many media assets and needs to find a specific one quickly.

**Acceptance Criteria**:
1. Search input is visible in picker dialog
2. User types filename/partial match
3. Grid filters to show matching results
4. Results update as user types (debounced)
5. Clear search returns to full list

### User Story 3 - Upload in Picker (Priority: P2)

A user wants to add a new image that doesn't exist in the library yet.

**Acceptance Criteria**:
1. Upload zone/button visible in picker
2. User can drag-drop or click to upload
3. Uploaded image appears in grid
4. Uploaded image is auto-selected
5. User can continue browsing or confirm

### User Story 4 - Handle Large Libraries (Priority: P2)

A workspace has hundreds or thousands of media assets.

**Acceptance Criteria**:
1. Initial load shows first batch (20-30 items)
2. Scrolling near bottom loads more items
3. Loading indicator shown while fetching
4. Smooth infinite scroll experience
5. No memory/performance issues with large datasets

---

## Functional Requirements

### Core Picker

- **MLR-001**: System MUST provide a dialog component for browsing media
- **MLR-002**: System MUST display media as thumbnail grid
- **MLR-003**: System MUST support single-select mode (returns one MediaAsset)
- **MLR-004**: System MUST support multi-select mode (returns MediaAsset[])
- **MLR-005**: System MUST show selection state visually (checkbox, border, etc.)
- **MLR-006**: System MUST provide confirm/cancel actions

### Search & Filter

- **MLR-007**: System MUST provide search input for filtering by filename
- **MLR-008**: System MUST debounce search queries (300ms)
- **MLR-009**: System MUST show empty state when no results match
- **MLR-010**: System MUST allow clearing search filter

### Pagination

- **MLR-011**: System MUST use cursor-based pagination for Firestore queries
- **MLR-012**: System MUST implement infinite scroll loading
- **MLR-013**: System MUST show loading indicator during fetch
- **MLR-014**: System MUST handle end-of-list gracefully

### Upload Integration

- **MLR-015**: System MUST provide upload zone within picker
- **MLR-016**: System MUST use existing upload infrastructure (useUploadMediaAsset)
- **MLR-017**: System MUST show upload progress
- **MLR-018**: System MUST add uploaded media to grid immediately
- **MLR-019**: System MUST auto-select newly uploaded media

### Error Handling

- **MLR-020**: System MUST display error states for failed loads
- **MLR-021**: System MUST provide retry mechanism for failures
- **MLR-022**: System MUST handle upload failures gracefully

---

## Technical Approach

### Location

`domains/media-library/` (flat structure, no subdomain)

Following DDD principles - the picker is a media-library domain capability.

### Components

| Component | Purpose |
|-----------|---------|
| `MediaLibraryDialog` | Main dialog container |
| `MediaLibraryGrid` | Grid with infinite scroll |
| `MediaLibraryItem` | Selectable thumbnail item |
| `MediaLibrarySearch` | Search input |
| `MediaLibraryUploadZone` | Upload area in picker |

### Hooks

| Hook | Purpose |
|------|---------|
| `useWorkspaceMediaAssets` | Paginated fetch with useInfiniteQuery + search |

### API

```typescript
// Usage pattern
<MediaLibraryDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  workspaceId={workspaceId}
  mode="multi" // or "single"
  onSelect={(assets: MediaAsset[]) => handleSelection(assets)}
/>
```

---

## Success Criteria

- **SC-001**: Users can browse and select from 100+ media assets without performance issues
- **SC-002**: Search results appear within 500ms of typing
- **SC-003**: Infinite scroll loads next page within 1 second
- **SC-004**: Upload within picker works identically to standalone MediaPickerField
- **SC-005**: Picker is used by at least 2 different features (AI Presets, Experience Designer)

---

## Dependencies

- Existing `useUploadMediaAsset` hook
- Existing MediaAsset schema and Firestore collection
- TanStack Query (useInfiniteQuery)
- shadcn/ui Dialog component

---

## Future Considerations

1. **Media type filtering** - Filter by image/video/audio
2. **Sort options** - Sort by date, name, size
3. **Preview mode** - Larger preview on hover/click
4. **Bulk selection** - Select all, select range
5. **Recently used** - Quick access to recently selected media

---

## Relationship to Other Features

| Feature | How It Uses Picker |
|---------|-------------------|
| AI Preset Editor | Add media to registry for @mentions |
| Experience Designer | Select media for step configurations |
| Event Designer | Background images, overlays |

---

## Implementation Notes

This feature should be implemented BEFORE or IN PARALLEL with features that need it. Features can ship with simplified upload-only flow (using MediaPickerField) and later integrate the full picker.

**Simplified fallback**: Until this picker is built, features can use a dialog with MediaPickerField for upload-only workflow.
