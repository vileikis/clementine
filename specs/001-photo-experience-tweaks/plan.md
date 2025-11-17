# Implementation Plan: Photo Experience Tweaks

**Branch**: `001-photo-experience-tweaks` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-photo-experience-tweaks/spec.md`
**Status**: ✅ Planning Complete - Ready for `/speckit.tasks`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

---

## Planning Summary

**Phases Completed**:

- ✅ **Phase 0: Research** - Technical unknowns resolved ([research.md](./research.md))
- ✅ **Phase 1: Design** - Data model, contracts, and quickstart guide generated
- ✅ **Constitution Checks** - Pre-design and post-design validation passed

**Generated Artifacts**:

- [research.md](./research.md) - 7 research areas with decisions and rationale
- [data-model.md](./data-model.md) - Experience schema updates, validation rules, migration strategy
- [contracts/experience-actions.ts](./contracts/experience-actions.ts) - Server Action signatures and patterns
- [quickstart.md](./quickstart.md) - Developer setup, testing guide, deployment checklist

**Key Decisions**:

1. Preview media handled via Firebase Storage with conditional rendering (image/GIF/video)
2. Countdown settings stored in Firestore (countdownEnabled, countdownSeconds)
3. Aspect ratio picker uses shadcn/ui Select with 5 predefined ratios
4. Prompt guide URLs hard-coded in constants file by model
5. Reference images displayed in horizontal Flexbox row with responsive wrapping
6. Deprecated fields removed from validation, kept optional in TypeScript interface
7. ExperienceEditor broken into 4 focused sub-components (PreviewMediaUpload, CountdownSettings, OverlaySettings, AITransformSettings)

**Next Step**: Run `/speckit.tasks` to generate actionable task breakdown

## Summary

Simplify and enhance the Photo Experience configuration UI by removing capture options, adding rich preview media support (image/GIF/video), implementing countdown controls, simplifying overlays to single frame only, and improving AI transformation settings with horizontal reference image layout, aspect ratio picker, and model-specific prompt guides. This feature streamlines the organizer experience and prepares the platform for scalable AI generation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16 (App Router)
**Primary Dependencies**: Zod 4.x (validation), Firebase (Firestore + Storage), Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: Firebase Firestore (Experience documents), Firebase Storage (preview media, overlays)
**Testing**: Jest (unit tests), React Testing Library (component tests)
**Target Platform**: Web (mobile-first: 320px-768px, tablet: 768px+, desktop: 1024px+)
**Project Type**: Web monorepo (pnpm workspace) - `web/` app + `functions/` placeholder
**Performance Goals**: Page load < 2 seconds on 4G, media upload preview < 1 second, form validation instant (< 100ms)
**Constraints**: Mobile-first responsive (320px minimum), touch targets ≥44x44px, Firebase free tier media storage limits
**Scale/Scope**: ~10 components (editor sections), ~5 schema updates, ~3 Server Actions, 0 new routes (modifies existing Event Builder)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: All new UI components (preview media upload, countdown controls, aspect ratio picker) designed mobile-first (320px-768px). Touch targets ≥44x44px for toggles, buttons, aspect ratio picker. Typography ≥14px maintained.
- [x] **Clean Code & Simplicity**: No new abstraction layers. Modifying existing ExperienceEditor component and schemas. YAGNI applied - removing unused capture options, adding only specified features.
- [x] **Type-Safe Development**: TypeScript strict mode enforced. Zod schemas updated in `web/src/lib/schemas/firestore.ts` for countdown settings, aspect ratio enum, preview type validation. No `any` escapes.
- [x] **Minimal Testing Strategy**: Jest unit tests for schema validation, component tests for ExperienceEditor modifications. Focus on critical paths: preview media upload/display, countdown toggle/timer, aspect ratio selection. Tests co-located in `web/src/components/organizer/builder/*.test.tsx`.
- [x] **Validation Loop Discipline**: Implementation plan includes validation tasks (lint, type-check, test) in final phase before marking feature complete.
- [x] **Firebase Architecture Standards**: Admin SDK (Server Actions) for preview media upload, overlay upload, Experience updates. Client SDK for real-time Experience reads in editor. Schemas in `web/src/lib/schemas/firestore.ts`. Preview media/overlays stored as full public URLs in Firebase Storage.
- [x] **Technical Standards**: Applicable standards reviewed:
  - `frontend/components.md`: Component structure for ExperienceEditor sections
  - `frontend/responsive.md`: Mobile-first layout for new UI elements
  - `backend/firebase.md`: Hybrid Client/Admin SDK pattern
  - `global/validation.md`: Zod validation for form inputs and uploads

**Complexity Violations**: None. This feature simplifies the existing Experience configuration by removing capture options and logo overlay support. All changes are modifications to existing components and schemas - no new architectural patterns introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-photo-experience-tweaks/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - component patterns, UI/UX decisions
├── data-model.md        # Phase 1 output - Experience schema updates
├── quickstart.md        # Phase 1 output - dev setup, testing guide
├── contracts/           # Phase 1 output - Server Action signatures
│   └── experience-actions.ts  # updateExperience, uploadPreviewMedia, uploadOverlay
├── checklists/
│   └── requirements.md  # Spec quality validation (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── lib/
│   │   ├── schemas/
│   │   │   └── firestore.ts                    # [MODIFY] Update experienceSchema with new fields
│   │   ├── firebase/
│   │   │   ├── admin.ts                         # [EXISTING] Admin SDK for Server Actions
│   │   │   └── client.ts                        # [EXISTING] Client SDK for real-time reads
│   │   ├── actions/
│   │   │   └── experiences.ts                   # [MODIFY] Server Actions for Experience CRUD, media upload
│   │   └── types/
│   │       └── firestore.ts                     # [MODIFY] Update Experience TypeScript interface
│   ├── components/
│   │   ├── organizer/
│   │   │   └── builder/
│   │   │       ├── ExperienceEditor.tsx         # [MODIFY] Main editor - add sections, remove capture options
│   │   │       ├── PreviewMediaUpload.tsx       # [NEW] Preview media upload component
│   │   │       ├── CountdownSettings.tsx        # [NEW] Countdown toggle + timer input
│   │   │       ├── OverlaySettings.tsx          # [NEW] Frame overlay upload (remove logo support)
│   │   │       ├── AITransformSettings.tsx      # [NEW] Horizontal ref images, aspect ratio picker, prompt guide
│   │   │       ├── ImageUploadField.tsx         # [EXISTING] Reusable upload component
│   │   │       └── ExperienceEditor.test.tsx    # [NEW] Component tests
│   │   └── ui/                                  # [EXISTING] shadcn/ui components
│   └── app/
│       └── (event-builder)/
│           └── events/
│               └── [eventId]/
│                   └── (builder)/               # [EXISTING] Event Builder routes
│                       └── experiences/         # [EXISTING] Experiences page using ExperienceEditor
└── tests/
    └── lib/
        └── schemas/
            └── firestore.test.ts                # [MODIFY] Add tests for new schema fields
```

**Structure Decision**: Web application (Next.js monorepo). All changes are within the `web/` workspace. No backend/functions changes needed. Modifying existing Event Builder (`/events/[eventId]/experiences`) by updating ExperienceEditor component and related schemas. Breaking editor into smaller, focused sub-components for maintainability (PreviewMediaUpload, CountdownSettings, OverlaySettings, AITransformSettings).

## Complexity Tracking

_No complexity violations - this section is not applicable for this feature._

---

## Post-Design Constitution Re-Check

_GATE: Re-evaluated after Phase 1 design (research, data model, contracts completed)_

Verify compliance with Clementine Constitution after design phase:

- [x] **Mobile-First Responsive Design**: All new components (PreviewMediaUpload, CountdownSettings, OverlaySettings, AITransformSettings) designed with mobile-first approach. Flexbox layout with `flex-wrap` for reference images ensures responsive wrapping. Touch targets confirmed ≥44px for all interactive elements.

- [x] **Clean Code & Simplicity**: Component breakdown follows Single Responsibility Principle:

  - PreviewMediaUpload: Handles preview media upload/display/remove only
  - CountdownSettings: Handles countdown toggle + timer only
  - OverlaySettings: Handles frame overlay only
  - AITransformSettings: Handles AI settings only
  - No new abstraction layers introduced - all components use existing patterns (shadcn/ui, Server Actions, Firebase Storage)

- [x] **Type-Safe Development**: All schemas updated with strict Zod validation:

  - `countdownSeconds`: `z.number().int().min(0).max(10)` - enforces integer range
  - `aiAspectRatio`: `z.enum([...])` - enforces allowed values only
  - `previewType`: `z.enum([...])` - enforces image/gif/video only
  - `uploadPreviewMediaSchema`: Validates file type and size at runtime
  - No `any` escapes in Server Actions or components

- [x] **Minimal Testing Strategy**: Testing focused on critical paths:

  - Schema validation tests (countdown range, aspect ratio enum, preview type)
  - Component tests (toggle behavior, conditional rendering, aspect ratio picker)
  - Manual testing guide in quickstart.md covers 10 key scenarios
  - No E2E tests (per Constitution - Jest/RTL only)

- [x] **Validation Loop Discipline**: Quickstart.md Phase 6 includes explicit validation tasks:

  - Run `pnpm lint` and fix all errors
  - Run `pnpm type-check` and resolve all TypeScript errors
  - Run `pnpm test` and ensure all tests pass
  - Manual testing checklist provided

- [x] **Firebase Architecture Standards**: Design confirms hybrid Client/Admin SDK pattern:

  - Server Actions use Admin SDK for all writes (updateExperience, uploadPreviewMedia, etc.)
  - Client SDK used for real-time Experience reads in ExperienceEditor (optimistic UI)
  - All schemas centralized in `web/src/lib/schemas/firestore.ts`
  - Preview media and overlays stored as full public URLs (instant rendering, no signed URLs)
  - Cleanup logic ensures old media is deleted from Storage when replaced

- [x] **Technical Standards**: Design adheres to all applicable standards:
  - `frontend/components.md`: Component composition pattern (props-based, focused)
  - `frontend/responsive.md`: Flexbox with `flex-wrap` for mobile-first responsive layout
  - `backend/firebase.md`: Admin SDK for writes, Client SDK for real-time reads
  - `global/validation.md`: Zod validation on both client (UX) and server (security)
  - `global/error-handling.md`: Server Actions throw typed errors (UnauthorizedError, ValidationError, etc.)

**Post-Design Findings**:

- **No violations found** - all Constitution principles maintained after design phase
- **No complexity added** - feature simplifies UI by removing capture options and logo overlay
- **Backward compatible** - deprecated fields handled gracefully (optional in TS, removed from validation)
- **Scalable** - component breakdown makes future enhancements easier (e.g., adding new AI models)

**Ready for Implementation**: Constitution Check PASSED ✅
