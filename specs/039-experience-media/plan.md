# Implementation Plan: Experience Cover Image

**Branch**: `039-experience-media` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/039-experience-media/spec.md`

## Summary

Add the ability for admins to upload a cover image and edit the experience name via a details dialog in the experience designer. The experience schema already has a `media` field (mediaAssetId + url) displayed across multiple components, but there is currently no UI to set it.

**UX Approach**:
- Add a small thumbnail + experience name in the TopNavBar breadcrumb area
- Pencil icon appears on hover to indicate editability
- Clicking opens an "Experience Details" dialog with name field + media picker
- Explicit Save button commits changes; Cancel discards (media may be uploaded but not linked)

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19, TanStack Start 1.132.0, TanStack Query 5.66.5, Zustand 5.x, Zod 4.1.12, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (experiences collection), Firebase Storage (media files)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, responsive)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Upload + display within 10 seconds for files under 2MB
**Constraints**: 5MB max file size, PNG/JPEG/WebP formats only, single image per experience
**Scale/Scope**: Feature addition to existing experience designer domain

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Dialog is touch-friendly; MediaPickerField supports mobile |
| II. Clean Code & Simplicity | ✅ PASS | Reusing existing components (MediaPickerField, useUploadMediaAsset, useUpdateExperience) |
| III. Type-Safe Development | ✅ PASS | Schema already exists (experienceMediaSchema); full TypeScript coverage |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical path: upload → save → display |
| V. Validation Gates | ✅ PASS | Will run format/lint/type-check before commit |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase client SDK |
| VII. Backend & Firebase | ✅ PASS | Uses existing Firestore/Storage patterns |
| VIII. Project Structure | ✅ PASS | Follows vertical slice in experience/designer domain |

**Gate Result**: PASS - No violations. Feature aligns with all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/039-experience-media/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new API endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/
│   ├── designer/
│   │   ├── components/
│   │   │   ├── ExperienceDetailsDialog.tsx     # NEW - Dialog with name + media fields
│   │   │   └── ExperienceIdentityBadge.tsx     # NEW - Thumbnail + name for TopNavBar
│   │   ├── containers/
│   │   │   └── ExperienceDesignerLayout.tsx    # MODIFY - Add identity badge to breadcrumb area
│   │   └── hooks/
│   │       └── useUploadExperienceCover.ts     # NEW - Upload to Storage (preview only)
│   └── shared/
│       └── hooks/
│           └── useUpdateExperience.ts          # EXISTING - Already supports name + media fields
├── shared/
│   └── editor-controls/
│       └── components/
│           └── MediaPickerField.tsx            # EXISTING - Reuse for cover image
└── domains/media-library/
    └── hooks/
        └── useUploadMediaAsset.ts              # EXISTING - Reuse for upload

packages/shared/src/schemas/experience/
└── experience.schema.ts                        # EXISTING - experienceMediaSchema
```

**Structure Decision**: Frontend-only feature in existing experience/designer domain. No backend changes required - uses existing Firestore schema and Firebase Storage infrastructure.

## UX Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TopNavBar                                                              │
│  [✨→] [🖼️] My Experience ✏️        [Saving...] [Changes] [Preview] [Publish] │
│         ↑         ↑      ↑                                              │
│      24x24    name    pencil on hover                                   │
│      thumb                                                              │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ↓ click thumbnail or name
┌─────────────────────────────────────┐
│       Experience Details            │
│                                     │
│  Cover Image                        │
│  ┌───────────────────────────┐     │
│  │                           │     │
│  │      [MediaPicker]        │     │  ← Upload goes to Storage immediately
│  │                           │     │    (for preview in dialog)
│  └───────────────────────────┘     │
│                                     │
│  Name                               │
│  [___________________________]      │
│                                     │
│                [Cancel]  [Save]     │  ← Save commits to Firestore
└─────────────────────────────────────┘    Cancel discards pending changes
```

**Save Behavior**:
- Media upload → immediate to Firebase Storage (enables preview)
- Experience document update → only on Save button click
- Cancel → uploaded media exists in Storage but not linked to experience

## Complexity Tracking

> No violations - feature uses existing patterns and components.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
