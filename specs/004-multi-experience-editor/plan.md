# Implementation Plan: Multi-Experience Type Editor

**Branch**: `004-multi-experience-editor` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-multi-experience-editor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable event creators to create and edit multiple experience types (Photo, GIF, Video, etc.) within the Event Designer interface. The feature refactors existing photo-only editing components to support a discriminated union architecture that maximizes code reuse for shared fields (label, enabled, preview media, delete) while providing type-safe editing for type-specific configuration (photo countdown/overlay, GIF frame settings, etc.). Primary deliverable is GIF experience support with an extensible architecture that makes adding Video, Wheel, and Survey types straightforward.

**Technical Approach** (from research):
- Wrapper component with switch-case routing based on `experience.type`
- Type-specific child components for each experience type
- Separate Zod update schemas per type (no discriminant in updates)
- Shared components extracted for common functionality
- TypeScript's automatic type narrowing within switch cases

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: Zod 4.x (validation), shadcn/ui (components), Tailwind CSS v4 (styling), Lucide React (icons)
**Storage**: Firebase Firestore (experiences subcollection under events/{eventId}/experiences)
**Testing**: Jest with React Testing Library (unit tests for components, co-located .test.tsx files)
**Target Platform**: Web application (mobile-first 320px-768px, desktop 1024px+)
**Project Type**: Web (Next.js App Router monorepo workspace)
**Performance Goals**: Experience editor loads in <1s, form updates feel instant (<100ms), TypeScript compilation <5s
**Constraints**: Must maintain TypeScript strict mode with zero type errors, all experiences use discriminated union from schemas.ts, no `any` type escapes
**Scale/Scope**: 5 experience types (Photo, GIF, Video, Wheel, Survey), ~15-20 components total, support 10+ experiences per event

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
  - Experience editor already mobile-optimized in current implementation
  - Delete buttons and toggle switches meet 44x44px requirement
  - Form inputs stack vertically on mobile

- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
  - Refactoring existing Photo editor, not building from scratch
  - Extracting shared components only where duplication exists
  - Type-specific components have single responsibility (edit one experience type)

- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
  - All components use discriminated union types from schemas.ts
  - Update schemas validate at Server Action boundary
  - Type narrowing via switch-case, no runtime type casting

- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
  - Will test wrapper component's type routing logic
  - Will test photo and GIF editors for update logic
  - Existing photo editor tests can be adapted

- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
  - Final phase includes validation loop task
  - TypeScript compilation must pass with zero errors

- [x] **Firebase Architecture Standards**: Admin SDK for writes/server-side, Client SDK for real-time reads, schemas in `web/src/lib/schemas/`, public images stored as full URLs
  - All updates go through Server Actions using Admin SDK
  - Schemas already in `web/src/features/experiences/lib/schemas.ts`
  - Preview images and overlay frames stored as full public URLs

- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced
  - Frontend: CSS, responsive design, accessibility, components
  - Backend: Firebase patterns (hybrid SDK usage)
  - Testing: Jest, React Testing Library

**Complexity Violations**: None - this is a refactoring of existing functionality to support multiple types, not introducing new architectural patterns.

## Project Structure

### Documentation (this feature)

```text
specs/004-multi-experience-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (discriminated union patterns, Server Action design)
├── data-model.md        # Phase 1 output (Experience entity structure)
├── quickstart.md        # Phase 1 output (developer quick start guide)
├── contracts/           # Phase 1 output (update action contracts)
│   └── repository-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/features/experiences/
├── actions/
│   ├── shared.ts                    # Delete action (already works for all types)
│   ├── photo-create.ts              # Create photo experience
│   ├── photo-update.ts              # Update photo experience
│   ├── photo-media.ts               # Preview media upload
│   ├── gif-create.ts                # [NEW] Create GIF experience
│   └── gif-update.ts                # [NEW] Update GIF experience
├── components/
│   ├── shared/
│   │   ├── ExperienceEditor.tsx            # [REFACTOR] Wrapper with switch routing
│   │   ├── ExperienceEditorWrapper.tsx     # [REFACTOR] Server action binding
│   │   ├── ExperiencesList.tsx             # [FIX] Accept Experience[] not PhotoExperience[]
│   │   ├── PreviewMediaUpload.tsx          # Shared across all types
│   │   ├── BaseExperienceFields.tsx        # [NEW] Shared label/enabled/preview editor
│   │   └── DeleteExperienceButton.tsx      # [NEW] Extracted delete logic
│   ├── photo/
│   │   ├── PhotoExperienceEditor.tsx       # [NEW] Photo type implementation
│   │   ├── AITransformSettings.tsx         # Exists (photo-specific currently)
│   │   ├── CountdownSettings.tsx           # Exists (will be shared with GIF/Video)
│   │   └── OverlaySettings.tsx             # Exists (photo-only)
│   └── gif/
│       ├── GifExperienceEditor.tsx         # [NEW] GIF type implementation
│       ├── GifCaptureSettings.tsx          # [NEW] Frame count, interval, loop
│       └── AITransformSettings.tsx         # [SHARE] Reuse from photo/ or extract to shared/
├── lib/
│   ├── schemas.ts                   # Discriminated union definitions (no changes needed)
│   └── repository.ts                # [UPDATE] Return Experience[] not PhotoExperience[]
└── index.ts                         # Public API exports

web/src/features/events/components/designer/
└── DesignSidebar.tsx               # [FIX] Fix TypeScript errors for icon rendering
```

**Structure Decision**: Web application structure using Next.js App Router with feature-based organization. Experience editing lives in `web/src/features/experiences/` with components organized by type (photo/, gif/, shared/). This structure supports the discriminated union architecture where shared components handle common functionality and type-specific components handle unique configuration.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. This refactoring maintains existing simplicity principles while improving type safety and code reuse.

---

## Phase 0: Research & Design Decisions

### Research Questions

1. **Component Architecture**: How to create React components that accept discriminated union types while maintaining type safety?
2. **Type Narrowing**: Best patterns for handling type narrowing in React (switch vs. if-else, exhaustiveness checking)?
3. **Partial Updates**: How to handle partial updates for discriminated unions (Partial<Union> loses discriminant)?
4. **Server Actions**: Type-specific actions vs. polymorphic action with runtime discrimination?
5. **Code Sharing**: How to share common UI (label, enabled, preview, delete) without duplication?

### Decisions Summary

**Decision 1: Hybrid Component Architecture**
- Wrapper component (`ExperienceEditor`) uses switch-case on `experience.type`
- Type-specific child components (`PhotoExperienceEditor`, `GifExperienceEditor`) receive narrowed types
- Shared components extracted for common functionality

**Decision 2: Type-Specific Update Schemas**
- Create separate update schemas per type (no discriminant field in updates)
- Example: `updatePhotoExperienceSchema`, `updateGifExperienceSchema`
- Server actions validate against type-specific schema

**Decision 3: Exhaustiveness Checking**
- Use `default: never` in switch statements
- TypeScript enforces all cases handled at compile time
- Runtime error if unexpected type (defensive programming)

**Full research findings**: See [research.md](./research.md)

---

## Phase 1: Data Model & Contracts

### Data Model

**Entity**: Experience (Discriminated Union)

Already defined in `web/src/features/experiences/lib/schemas.ts`:

```typescript
// Base fields shared across all types
baseExperienceSchema = {
  id: string,
  eventId: string,
  type: "photo" | "video" | "gif" | "wheel" | "survey",
  label: string (1-50 chars),
  enabled: boolean,
  hidden: boolean,
  previewPath?: string (URL),
  previewType?: "image" | "gif" | "video",
  createdAt: number (timestamp),
  updatedAt: number (timestamp)
}

// Photo-specific
PhotoExperience = baseExperienceSchema + {
  type: "photo",
  config: {
    countdown: number (0-10), // 0 = disabled
    overlayFramePath: string | null
  },
  aiConfig: {
    enabled: boolean,
    model: string | null,
    prompt: string | null (max 600 chars),
    referenceImagePaths: string[] | null (max 5),
    aspectRatio: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"
  }
}

// GIF-specific
GifExperience = baseExperienceSchema + {
  type: "gif",
  config: {
    frameCount: number (3-10),
    intervalMs: number (100-1000),
    loopCount: number (0 = infinite),
    countdown?: number (0-10)
  },
  aiConfig: {
    enabled: boolean,
    model: string | null,
    prompt: string | null (max 600 chars),
    referenceImagePaths: string[] | null (max 5),
    aspectRatio: "1:1" | "3:4" | "4:5" | "9:16" | "16:9"
  }
}
```

**State Transitions**: N/A (experiences are configuration entities, not stateful)

**Validation Rules**:
- Label: 1-50 characters, trimmed
- Countdown: 0-10 seconds (0 means disabled)
- Frame count (GIF): 3-10 frames
- Interval (GIF): 100-1000ms
- AI prompt: max 600 characters
- Reference images: max 5 URLs

Full data model: See [data-model.md](./data-model.md)

### API Contracts

**Repository Functions**:

```typescript
// Read operations (return discriminated union)
getExperienceById(eventId: string, experienceId: string): Promise<Experience | null>
getExperiencesByEventId(eventId: string): Promise<Experience[]>

// Write operations (already exist, work for all types)
deleteExperience(eventId: string, experienceId: string): Promise<void>
```

**Server Actions**:

```typescript
// Photo experience
createPhotoExperience(eventId: string, data: CreatePhotoExperienceData): Promise<ActionResponse<PhotoExperience>>
updatePhotoExperience(eventId: string, experienceId: string, data: UpdatePhotoExperienceData): Promise<ActionResponse<PhotoExperience>>

// GIF experience (new)
createGifExperience(eventId: string, data: CreateGifExperienceData): Promise<ActionResponse<GifExperience>>
updateGifExperience(eventId: string, experienceId: string, data: UpdateGifExperienceData): Promise<ActionResponse<GifExperience>>

// Shared (already exists)
deleteExperience(eventId: string, experienceId: string): Promise<ActionResponse<void>>
uploadPreviewMedia(eventId: string, experienceId: string, file: File): Promise<ActionResponse<PreviewMediaResult>>
```

Full contracts: See [contracts/repository-contracts.md](./contracts/repository-contracts.md)

---

## Implementation Phases

### Phase 1: Fix TypeScript Errors (Foundation)

**Goal**: Resolve existing TypeScript errors in DesignSidebar and ExperiencesList

**Tasks**:
1. Update `ExperiencesList` to accept `Experience[]` instead of `PhotoExperience[]`
2. Fix icon rendering logic to handle all experience types correctly
3. Update DesignSidebar to use `Experience` type from schemas.ts
4. Run `pnpm type-check` to verify errors resolved

**Deliverable**: Zero TypeScript errors, components display all experience types correctly

### Phase 2: Extract Shared Components (Preparation)

**Goal**: Extract common editing UI into reusable components

**Tasks**:
1. Create `BaseExperienceFields` component (label, enabled toggle, preview media)
2. Create `DeleteExperienceButton` component with confirmation dialog
3. Move `AITransformSettings` to shared/ (used by Photo, Video, GIF)
4. Verify components work with existing Photo editor

**Deliverable**: Shared components ready for reuse in type-specific editors

### Phase 3: Refactor Photo Editor (Migration)

**Goal**: Migrate existing Photo editor to type-specific component pattern

**Tasks**:
1. Create `PhotoExperienceEditor` component (copy existing ExperienceEditor logic)
2. Update to use shared components (BaseExperienceFields, DeleteExperienceButton, AITransformSettings)
3. Keep photo-specific UI (CountdownSettings, OverlaySettings)
4. Update wrapper component to route photo type to PhotoExperienceEditor
5. Test photo editing still works

**Deliverable**: Photo editing works through new architecture, zero regressions

### Phase 4: Add GIF Experience Support (New Functionality)

**Goal**: Implement GIF experience creation and editing

**Tasks**:
1. Create `createGifExperience` and `updateGifExperience` Server Actions
2. Create `createGifExperienceSchema` and `updateGifExperienceSchema` in schemas.ts
3. Create `GifExperienceEditor` component
4. Create `GifCaptureSettings` component (frame count, interval, loop)
5. Reuse shared components (BaseExperienceFields, AITransformSettings, DeleteExperienceButton)
6. Add GIF case to ExperienceEditor wrapper switch
7. Update experience creation flow to support GIF type selection

**Deliverable**: Users can create and edit GIF experiences with type-specific configuration

### Phase 5: Update Repository & Wrapper (Integration)

**Goal**: Update repository and wrapper to work with discriminated union

**Tasks**:
1. Update repository `getExperiencesByEventId` to return `Experience[]`
2. Update `ExperienceEditorWrapper` to accept `Experience` type
3. Add type narrowing logic to determine which editor to render
4. Update URL routing to work for all experience types
5. Test navigation between photo and GIF experiences

**Deliverable**: Seamless editing for both Photo and GIF experiences

### Phase 6: Validation & Polish (Quality)

**Goal**: Ensure code quality and user experience

**Tasks**:
1. Run validation loop (pnpm lint, pnpm type-check, pnpm test)
2. Write tests for ExperienceEditor wrapper routing logic
3. Write tests for GifExperienceEditor update logic
4. Test mobile responsiveness for GIF editor
5. Verify accessibility (keyboard navigation, screen reader labels)
6. Code review for duplication, verify shared components used correctly

**Deliverable**: Production-ready feature with zero errors, passing tests

---

## Success Metrics

From spec.md Success Criteria:

- **SC-001**: Creators can create both Photo and GIF experiences and configure type-specific settings in under 3 minutes
- **SC-003**: TypeScript compilation completes with zero type errors related to experience editing
- **SC-004**: The DesignSidebar and ExperiencesList components display both Photo and GIF experiences with correct icons and no TypeScript errors
- **SC-007**: Zero code duplication exists for shared editing functionality (label, enabled, preview, delete editors appear once in codebase)
- **SC-008**: Creators can delete any experience type (Photo or GIF) through a single shared flow with identical behavior

**Verification**:
- Manual testing: Create photo, create GIF, edit both types, delete both types
- `pnpm type-check` passes with zero errors
- Search codebase for duplicate label/enabled/preview/delete UI (should find 1 instance each)
- Measure lines of code added vs. duplicated (extensibility goal: <50 LOC to add Video type)

---

## Risk Mitigation

**Risk 1: Breaking existing Photo functionality**
- Mitigation: Migrate Photo editor first, test before adding GIF
- Rollback: Keep existing ExperienceEditor.tsx as ExperienceEditor.backup.tsx until migration complete

**Risk 2: TypeScript errors due to discriminated union complexity**
- Mitigation: Follow research findings (switch-case pattern, exhaustiveness checking)
- Testing: Run type-check frequently during refactoring

**Risk 3: Shared component extraction causes coupling**
- Mitigation: Keep shared components simple, pass props explicitly (no shared state)
- Review: Check that shared components don't have conditional logic based on experience type

---

## Dependencies

**Internal**:
- Existing schemas.ts (discriminated union already defined)
- Existing photo editor components (CountdownSettings, OverlaySettings, AITransformSettings)
- Existing Server Actions (photo-update.ts, shared.ts)

**External**: None (using existing dependencies: Zod, shadcn/ui, Tailwind CSS)

---

## Open Questions

None - all design questions resolved in Phase 0 research.

---

## Appendix

### Related Standards

- `standards/frontend/components.md`: React component structure, Server vs Client components
- `standards/frontend/responsive.md`: Mobile-first breakpoints, touch targets
- `standards/backend/firebase.md`: Hybrid SDK pattern, Server Actions for mutations
- `standards/global/validation.md`: Zod schemas, server-side validation

### Related Features

- `001-experience-type-fix`: Consolidated Experience type system to discriminated union
- Photo experience editing: Existing functionality being refactored
