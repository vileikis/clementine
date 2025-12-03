# Implementation Plan: Experience Editor Tabs (Design & Settings)

**Branch**: `001-exp-settings-routes` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-exp-settings-routes/spec.md`

## Summary

Add two explicit route segments to the experience editor (`/design` and `/settings`) with tab navigation. The Design tab (default) renders the existing experience editor. The Settings tab provides a form for editing experience metadata (name, description, preview media). Additionally, update ExperienceCard to display preview media thumbnails when available.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Zod 4.x, sonner
**Storage**: Firebase Firestore (experiences collection), Firebase Storage (media files)
**Testing**: Jest (unit tests, co-located)
**Target Platform**: Web (mobile-first 320px-768px, desktop 1024px+)
**Project Type**: Web (Next.js App Router monorepo)
**Performance Goals**: Tab navigation < 1s, form save < 2s, media upload < 5s
**Constraints**: Mobile-first design, 44x44px touch targets, 5MB image limit, 10MB GIF limit
**Scale/Scope**: Single feature module (`experiences`), ~10 files changed/added

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Settings form designed mobile-first (320px), touch targets ≥44px on tabs and buttons
- [x] **Clean Code & Simplicity**: Reusing existing patterns (ExperienceTabs, StepMediaUpload), no new abstractions
- [x] **Type-Safe Development**: TypeScript strict mode, Zod validation for all form inputs
- [x] **Minimal Testing Strategy**: Unit tests for server action and schema validation
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test tasks before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes, Client SDK for real-time, public URLs for media
- [x] **Feature Module Architecture**: All code in `features/experiences/`, feature-local schemas
- [x] **Technical Standards**: Following established patterns from events/steps modules

**Complexity Violations**: None - feature follows existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/001-exp-settings-routes/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Research findings (Phase 0)
├── data-model.md        # Entity definitions (Phase 1)
├── quickstart.md        # Implementation guide (Phase 1)
├── contracts/           # API contracts (Phase 1)
│   └── experience-settings.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Changes

```text
web/src/
├── app/(workspace)/[companySlug]/exps/[expId]/
│   ├── layout.tsx                    # NEW: Shared layout with header and tabs
│   ├── page.tsx                      # MODIFY: Redirect to /design
│   ├── ExperienceEditorClient.tsx    # EXISTING: Keep in place
│   ├── design/
│   │   └── page.tsx                  # NEW: Renders existing editor
│   └── settings/
│       └── page.tsx                  # NEW: Renders settings form
│
└── features/experiences/
    ├── types/
    │   └── experiences.types.ts      # MODIFY: Add preview fields
    ├── schemas/
    │   └── experiences.schemas.ts    # MODIFY: Add settings schema
    ├── actions/
    │   └── experiences.ts            # MODIFY: Add settings action
    ├── constants.ts                  # MODIFY: Add preview constraints
    ├── components/
    │   ├── ExperienceCard.tsx        # MODIFY: Add preview thumbnail
    │   ├── settings/                 # NEW: Settings components folder
    │   │   ├── ExperienceSettingsForm.tsx
    │   │   └── index.ts
    │   └── index.ts                  # MODIFY: Export settings
    └── index.ts                      # MODIFY: Export settings
```

**Structure Decision**: Web application (Next.js App Router) with feature module architecture. All changes contained within the `experiences` feature module following vertical slice pattern.

## Complexity Tracking

> No complexity violations identified. Feature uses established patterns:
> - Route structure: Same as events module
> - Tab navigation: ExperienceTabs component already exists
> - Media upload: Reuses patterns from steps module
> - Server actions: Follows existing action pattern

## Implementation Phases

### Phase 1: Route Structure (P1 - Design Tab)

**Goal**: Create nested route structure with redirect, preserving existing functionality.

1. Create `[expId]/layout.tsx` - shared header with ExperienceTabs
2. Create `[expId]/design/page.tsx` - move/reference existing editor
3. Update `[expId]/page.tsx` - redirect to /design
4. Update `ExperienceCard` link to point to /design

**Validation**: Navigate to experience, verify redirect and editor works.

### Phase 2: Settings Infrastructure (P2 - Settings Tab)

**Goal**: Add settings form for name, description, and preview media.

1. Extend Experience type with `previewMediaUrl`, `previewType`
2. Add `updateExperienceSettingsInputSchema` to schemas
3. Add `PREVIEW_MEDIA` constraints to constants
4. Create `updateExperienceSettingsAction` server action
5. Create `[expId]/settings/page.tsx`
6. Create `ExperienceSettingsForm` component

**Validation**: Update settings, verify save and real-time update.

### Phase 3: Preview Media (P3 - Card Thumbnails)

**Goal**: Display preview media in experience list cards.

1. Add media upload to settings form (reuse StepMediaUpload pattern)
2. Update `ExperienceCard` to show preview thumbnail
3. Add fallback for cards without preview media

**Validation**: Upload preview, verify display in card list.

### Phase 4: Polish & Validation

1. Mobile responsive testing (320px viewport)
2. Edge case testing (validation errors, upload failures)
3. Run validation loop: `pnpm lint && pnpm type-check && pnpm test`
4. Code cleanup and final review

## Dependencies

| Dependency | Purpose | Notes |
|-----------|---------|-------|
| ExperienceTabs | Tab navigation | Already exists, ready to use |
| StepMediaUpload | Media upload pattern | Pattern to replicate |
| ThemeEditor | Form pattern reference | useReducer + save button |
| sonner | Toast notifications | Already in use |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Route redirect breaks links | Test all entry points, update ExperienceCard href |
| Real-time sync conflicts | Use timestamp-based updatedAt checks |
| Large file upload performance | Client-side size validation before upload |

## Artifacts Generated

- [x] `research.md` - Technical research and decisions
- [x] `data-model.md` - Experience entity extensions
- [x] `contracts/experience-settings.md` - Server action contracts
- [x] `quickstart.md` - Implementation reference

## Next Steps

Run `/speckit.tasks` to generate actionable implementation tasks organized by user story.
