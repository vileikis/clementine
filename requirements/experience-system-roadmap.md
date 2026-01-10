# Experience System Roadmap

> **Related Documents:**
> - [Architecture: Experiences System](./arch-expereinces-system.md)
> - [PRD: Workspace Experiences](./epic-experience-system-prd.md)

---

## Overview

This roadmap implements the Experience System with **workspace-scoped experiences** and **event-scoped UX**.

**Key architectural decisions:**

- Experiences are stored at workspace level (`/workspaces/{workspaceId}/experiences`)
- UX is event-scoped (experiences managed from event context)
- Publishing creates immutable releases (`/projects/{projectId}/experienceReleases`)
- `/join/[projectId]` resolves one active event
- WYSIWYG for Welcome screen and step renderers (same component, two modes)

**Roadmap principles:**

- Each phase is **small, functional, and testable**
- No bundling multiple functional things into one phase
- No limit on number of phases
- Phases can run in parallel when independent

---

## Phase 0 — Structural Foundations (No UI)

**Goal:** Establish domain scaffolding without breaking the app.

**Deliverables:**

- [ ] Create `domains/experience/` scaffolding
  - `/shared/` (types, schemas)
  - `/steps/` (step registry skeleton)
  - `/validation/` (profile rules placeholder)
  - `/runtime/` (engine interface placeholder)
  - `/editor/` (placeholder)
- [ ] Create `domains/session/` scaffolding
  - Session types and schemas
  - API shape (`createSession`, `subscribeSession`)
- [ ] Add `activeEventId` field to project data model
- [ ] Define `ExperienceProfile` enum: `freeform`, `survey`, `informational`

**Testable outcome:**

- App boots with new domains
- No circular dependencies
- TypeScript compiles with new types

**Parallelizable:** Yes

---

## Phase 1 — Experience Profiles & Slot Compatibility

**Goal:** Define profile constraints and slot compatibility rules.

**Location:** `domains/experience/validation/`

**Deliverables:**

- [ ] `profiles.ts` - Profile definitions
  ```typescript
  type ExperienceProfile = 'freeform' | 'survey' | 'informational'
  ```
- [ ] `profile-constraints.ts` - Step category constraints per profile
  ```typescript
  // freeform: all categories
  // survey: info, input, capture, share (no transform)
  // informational: info only
  ```
- [ ] `slot-compatibility.ts` - Slot → profile mapping
  ```typescript
  // main: freeform, survey
  // pregate: informational, survey
  // preshare: informational, survey
  ```
- [ ] `validateProfile(profile, steps)` - Returns validation result
- [ ] Unit tests for profile validation

**Testable outcome:**

- Profile validation correctly accepts/rejects step combinations
- Slot compatibility correctly filters profiles

**Parallelizable:** Yes (independent of UI)

---

## Phase 2 — Workspace Experience Data Model

**Goal:** Establish Firestore structure for workspace experiences.

**Location:** `domains/workspace/experiences/` (new subdomain)

**Deliverables:**

- [ ] `schemas/experience.schema.ts` - Zod schema
  ```typescript
  {
    id: string
    name: string
    status: 'active' | 'deleted'
    profile: ExperienceProfile
    media?: { mediaAssetId: string; url: string }
    steps: Step[]
    createdAt: number
    updatedAt: number
  }
  ```
- [ ] `types/experience.types.ts` - TypeScript types
- [ ] Firestore path: `/workspaces/{workspaceId}/experiences/{experienceId}`
- [ ] Security rules for workspace experiences (admin-only)

**Testable outcome:**

- Experience schema validates correctly
- Security rules allow admin access, deny guest access

**Parallelizable:** Yes (independent of UI)

---

## Phase 3 — Workspace Experience CRUD Hooks

**Goal:** Enable creating, reading, updating, deleting experiences.

**Location:** `domains/workspace/experiences/hooks/`

**Deliverables:**

- [ ] `useWorkspaceExperiences.ts` - List experiences for workspace
- [ ] `useWorkspaceExperience.ts` - Get single experience
- [ ] `useCreateExperience.ts` - Create with name + profile
- [ ] `useUpdateExperience.ts` - Update experience (name, steps, media)
- [ ] `useDeleteExperience.ts` - Soft delete (status = 'deleted')

**Testable outcome:**

- CRUD operations work via hooks
- Experiences persist in Firestore
- Soft delete sets status correctly

**Parallelizable:** Yes (after Phase 2)

---

## Phase 4 — Event Config Experiences Schema

**Goal:** Add experiences field to event draftConfig/publishedConfig.

**Location:** `domains/event/shared/schemas/`

**Deliverables:**

- [ ] Update `project-event-config.schema.ts` to include:
  ```typescript
  experiences: {
    main: Array<{ experienceId: string; enabled: boolean }>
    pregate?: { experienceId: string; enabled: boolean }
    preshare?: { experienceId: string; enabled: boolean }
  }
  ```
- [ ] Add `experienceReleases` collection schema for publishedConfig
- [ ] Migration strategy for existing events (default to empty experiences)

**Testable outcome:**

- Event config schema validates with experiences field
- Existing events continue to work

**Parallelizable:** Yes (after Phase 2)

---

## Phase 5 — Experience Picker Modal (Select Existing)

**Goal:** Admin can select existing workspace experience for a slot.

**Location:** `domains/event/experiences/`

**Deliverables:**

- [ ] `components/ExperiencePicker.tsx` - Modal component
  - Lists active workspace experiences
  - Sorted by updatedAt DESC
  - Shows: name, profile, thumbnail
  - Filters by slot-compatible profiles
  - Disables experiences already in event
  - "Create new" primary action
- [ ] `hooks/useExperiencesForPicker.ts` - Query with filtering
- [ ] Empty state: "No experiences yet" + create button

**Testable outcome:**

- Picker opens and lists experiences
- Profile filtering works correctly
- Duplicates are disabled
- Selection closes modal and returns experienceId

**NOT doing:** Actual assignment to event (next phase)

**Parallelizable:** Yes (after Phase 3)

---

## Phase 6 — Experience Creation Flow

**Goal:** Admin can create new experience from event context.

**Location:** `domains/event/experiences/`

**Deliverables:**

- [ ] `components/CreateExperienceForm.tsx`
  - Name input (required)
  - Profile selector (filtered by target slot)
  - Submit creates experience and assigns to slot
- [ ] Route: `/workspace/$slug/projects/$projectId/events/$eventId/create-experience?slot=[slot]`
- [ ] Integration with workspace experience CRUD

**Testable outcome:**

- Create form shows only slot-compatible profiles
- Submitting creates experience in workspace
- Experience is assigned to target slot

**Parallelizable:** Yes (after Phase 5)

---

## Phase 7 — Event Sidebar: Main Experiences Section

**Goal:** Display and manage main experiences in Event Designer sidebar.

**Location:** `domains/event/designer/`

**Deliverables:**

- [ ] Add "Experiences" section to `EventDesignerSidebar.tsx`
  ```
  ┌─────────────────────────┐
  │ Welcome                 │
  │ Theme                   │
  │ Settings                │
  ├─────────────────────────┤
  │ EXPERIENCES        [+]  │  ← section header
  │   ├ Experience A   ⋮    │  ← draggable item
  │   └ Experience B   ⋮    │
  └─────────────────────────┘
  ```
- [ ] [+] button opens Experience Picker modal
- [ ] Context menu: rename, duplicate, enable/disable, remove from event
- [ ] Click experience → navigate to editor route (placeholder)

**Testable outcome:**

- Main experiences display in sidebar
- Add button opens picker
- Context menu actions work

**NOT doing:** Drag-to-reorder (next phase), pregate/preshare (later phase)

**Parallelizable:** Yes (after Phase 5, 6)

---

## Phase 8 — Main Experiences Reordering

**Goal:** Admin can reorder main experiences via drag and drop.

**Location:** `domains/event/designer/`

**Deliverables:**

- [ ] Integrate @dnd-kit for sidebar reordering
- [ ] `useReorderMainExperiences.ts` - Mutation hook
- [ ] Persist order to `draftConfig.experiences.main`

**Testable outcome:**

- Drag and drop reorders experiences
- Order persists to Firestore
- Order reflected in sidebar

**Parallelizable:** Yes (after Phase 7)

---

## Phase 9 — Pregate & Preshare Slots UI

**Goal:** Admin can assign experiences to pregate and preshare slots.

**Location:** `domains/event/designer/`

**Deliverables:**

- [ ] Add "Extras" section to sidebar
  ```
  ┌─────────────────────────┐
  │ EXPERIENCES        [+]  │
  │   ├ Experience A   ⋮    │
  │   └ Experience B   ⋮    │
  ├─────────────────────────┤
  │ EXTRAS                  │
  │   Pregate: [+ Add]      │  ← empty state
  │   Preshare: Welcome XP  │  ← filled state
  └─────────────────────────┘
  ```
- [ ] Pregate slot UI (single, optional)
- [ ] Preshare slot UI (single, optional)
- [ ] "Add" opens picker filtered for slot
- [ ] Context menu: clear slot, edit experience

**Testable outcome:**

- Pregate/preshare slots show in sidebar
- Can assign experience to each slot
- Can clear slot assignment
- Profile filtering works for each slot

**Parallelizable:** Yes (after Phase 7)

---

## Phase 10 — Welcome Screen Experience Cards

**Goal:** Welcome screen preview shows actual experiences (WYSIWYG).

**Location:** `domains/event/welcome/` + `src/shared/`

**Deliverables:**

- [ ] `shared/components/ExperienceCard.tsx` - Shared card component
  - Shows: thumbnail, name
  - Supports `mode: 'edit' | 'run'`
- [ ] `shared/components/ExperiencePicker.tsx` - Shared picker/grid
  - Supports `layout: 'list' | 'grid'`
  - Supports `mode: 'edit' | 'run'`
- [ ] Update `WelcomePreview.tsx` to render actual experiences
  - Resolve experiences from `draftConfig.experiences.main`
  - Fetch experience data (name, media) from workspace
  - Render using shared components

**Testable outcome:**

- Welcome preview shows actual experience cards
- Cards respect layout setting (list/grid)
- Adding/removing experiences updates preview immediately

**Parallelizable:** Yes (after Phase 7)

---

## Phase 11 — Step Registry Implementation

**Goal:** Define step types with schemas, defaults, and renderer bindings.

**Location:** `domains/experience/steps/`

**Deliverables:**

- [ ] `registry.ts` - Step registry with:
  - Step type enumeration
  - Config schema per step
  - Default config factory per step
  - Renderer binding per step
  - Editor config panel binding per step
- [ ] Populate schemas for MVP steps:
  - `info`
  - `input.scale`, `input.yesNo`, `input.multiSelect`, `input.shortText`, `input.longText`
  - `capture.photo` (placeholder config)
  - `transform.pipeline` (placeholder config)
  - `share`

**Testable outcome:**

- Step registry exports all MVP step types
- Each step has valid schema and defaults
- Adding new step type is contained change

**Parallelizable:** Yes (independent)

---

## Phase 12 — Experience Editor Layout

**Goal:** Create the experience editor page structure.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] Route: `/workspace/$slug/projects/$projectId/events/$eventId/experience/$experienceId`
- [ ] `containers/ExperienceEditorPage.tsx` - Main container
- [ ] Layout: step list (left) + preview (center) + config panel (right)
- [ ] Load experience from workspace
- [ ] Wire up with auto-save pattern

**Testable outcome:**

- Editor route loads and displays 3-column layout
- Experience data loads from Firestore
- Basic navigation works (back to event)

**NOT doing:** Step list interactions (next phase)

**Parallelizable:** Yes (after Phase 11)

---

## Phase 13 — Experience Editor: Step List

**Goal:** Admin can view, select, and navigate steps.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] `components/StepList.tsx` - Step list component
  - Display steps with icons and labels
  - Selected step highlighting
  - Click to select step
- [ ] URL sync: `?step=[stepId]`
- [ ] Default to first step if none selected

**Testable outcome:**

- Step list displays all steps
- Clicking step updates selection
- URL reflects selected step

**NOT doing:** Add/remove/reorder (future phases)

**Parallelizable:** Yes (after Phase 12)

---

## Phase 14 — Experience Editor: Step Preview (Edit Mode)

**Goal:** Center panel shows non-interactive step preview.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] `components/StepPreview.tsx` - Preview container
- [ ] `StepRenderer(mode='edit')` - Non-interactive rendering
- [ ] Wire up with PreviewShell for viewport switching
- [ ] Preview updates immediately on config changes

**Testable outcome:**

- Selected step renders in center panel
- Preview is non-interactive
- Config changes reflect immediately

**Parallelizable:** Yes (after Phase 13)

---

## Phase 15 — Experience Editor: Step Config Panel

**Goal:** Right panel shows step configuration form.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] `components/StepConfigPanel.tsx` - Config panel container
- [ ] Per-step config forms (from registry)
  - Start with `info` step config
- [ ] Auto-save on config changes
- [ ] Validation feedback

**Testable outcome:**

- Config panel shows form for selected step
- Changes persist to Firestore
- Preview updates on changes

**Parallelizable:** Yes (after Phase 14)

---

## Phase 16 — Experience Editor: Add Step

**Goal:** Admin can add steps to experience.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] "Add step" button/action
- [ ] Step type picker (filtered by profile)
- [ ] Insert step at end (or after selected)
- [ ] New step selected after add

**Testable outcome:**

- Add button shows allowed step types only
- Adding step updates list and persists
- New step is selected

**Parallelizable:** Yes (after Phase 15)

---

## Phase 17 — Experience Editor: Remove & Reorder Steps

**Goal:** Admin can remove and reorder steps.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] Remove step action (with confirmation for non-empty)
- [ ] Drag-to-reorder steps (@dnd-kit)
- [ ] Handle selected step removal gracefully

**Testable outcome:**

- Remove step works and persists
- Reorder works and persists
- UI stays consistent after operations

**Parallelizable:** Yes (after Phase 16)

---

## Phase 18 — Input Step Config Forms

**Goal:** Config forms for all input step types.

**Location:** `domains/experience/steps/input/`

**Deliverables:**

- [ ] `input.scale` config form (min, max, labels)
- [ ] `input.yesNo` config form (labels)
- [ ] `input.multiSelect` config form (options, min/max selections)
- [ ] `input.shortText` config form (placeholder, validation)
- [ ] `input.longText` config form (placeholder, max length)

**Testable outcome:**

- Each input step type has working config form
- Config persists correctly
- Preview updates on config changes

**Parallelizable:** Yes (after Phase 15)

---

## Phase 19 — Session Domain Implementation

**Goal:** Enable session creation and subscription.

**Location:** `domains/session/`

**Deliverables:**

- [ ] `schemas/session.schema.ts` - Session Zod schema
- [ ] `hooks/useCreateSession.ts`
- [ ] `hooks/useSession.ts` - Subscribe to session
- [ ] `hooks/useUpdateSession.ts`
- [ ] Firestore path: `/projects/{projectId}/sessions/{sessionId}`
- [ ] Security rules for sessions

**Testable outcome:**

- Can create session (preview and guest modes)
- Can subscribe to session updates
- Session persists to Firestore

**Parallelizable:** Yes (independent)

---

## Phase 20 — Experience Runtime Engine Core

**Goal:** Step sequencing and state management.

**Location:** `domains/experience/runtime/`

**Deliverables:**

- [ ] `engine.ts` - Runtime engine
  - Step sequencing (next/back)
  - State accumulation (answers)
  - API: `currentStep`, `canProceed`, `next()`, `back()`
- [ ] `hooks/useExperienceRuntime.ts` - Hook adapter
- [ ] Integration with session state

**Testable outcome:**

- Runtime sequences through steps correctly
- State accumulates as expected
- Navigation boundaries enforced

**Parallelizable:** Yes (after Phase 19)

---

## Phase 21 — Step Renderers (Run Mode): Info & Input

**Goal:** Interactive step rendering for guest/preview.

**Location:** `domains/experience/steps/`

**Deliverables:**

- [ ] `StepRenderer(mode='run')` - Interactive rendering
- [ ] `info` step renderer (display only, proceed button)
- [ ] Input step renderers (interactive forms):
  - `input.scale`
  - `input.yesNo`
  - `input.multiSelect`
  - `input.shortText`
  - `input.longText`

**Testable outcome:**

- Steps render interactively in run mode
- User input captured correctly
- Proceed/back navigation works

**Parallelizable:** Yes (after Phase 20)

---

## Phase 22 — Admin Preview Integration

**Goal:** Admin can preview experience using runtime.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] "Preview" button in experience editor
- [ ] Preview modal/page using runtime
- [ ] Create preview session (`mode='preview'`, `configSource='draft'`)
- [ ] Use same step renderers as guest

**Testable outcome:**

- Preview button opens experience in run mode
- Session created with preview mode
- Steps are interactive

**Parallelizable:** Yes (after Phase 21)

---

## Phase 23 — Guest Record & Join Shell

**Goal:** Guest record creation and join route basics.

**Location:** `domains/guest/`

**Deliverables:**

- [ ] `/join/[projectId]` route implementation
- [ ] Resolve chain: project → activeEventId → event (published)
- [ ] Create guest record if not exists
- [ ] Error states: 404, Coming Soon (no active event)

**Testable outcome:**

- Valid project link loads
- Guest record created in Firestore
- Error states display correctly

**NOT doing:** Welcome screen with experiences (next phase)

**Parallelizable:** Yes (after Phase 4)

---

## Phase 24 — Guest Welcome Screen

**Goal:** Guest sees welcome screen with experience picker.

**Location:** `domains/guest/`

**Deliverables:**

- [ ] Load `publishedConfig` experiences
- [ ] Load experience releases for display data
- [ ] Render `WelcomeScreen(mode='run')` with shared components
- [ ] Experience selection navigates to experience route

**Testable outcome:**

- Welcome screen shows experiences from publishedConfig
- Experiences render with name and thumbnail
- Selection navigates to experience flow

**Parallelizable:** Yes (after Phase 23, Phase 10)

---

## Phase 25 — Guest Experience Flow

**Goal:** Guest can run selected experience.

**Location:** `domains/guest/`

**Deliverables:**

- [ ] Route: `/join/[projectId]/experience/[experienceId]?session=[sessionId]`
- [ ] Create guest session with `releaseId`
- [ ] Load experience from release
- [ ] Run through runtime engine
- [ ] Complete experience flow

**Testable outcome:**

- Guest can select and run experience
- Session created with correct data
- Steps execute correctly

**Parallelizable:** Yes (after Phase 24)

---

## Phase 26 — Experience Release Creation

**Goal:** Event publish creates immutable releases.

**Location:** `domains/event/`

**Deliverables:**

- [ ] Update publish flow to create releases
- [ ] For each enabled experience:
  - Create release in `/projects/{projectId}/experienceReleases/{releaseId}`
  - Freeze experience data (profile, media, steps)
- [ ] Write releaseIds to `publishedConfig.experiences`
- [ ] Transaction for atomicity

**Testable outcome:**

- Publishing event creates releases
- Releases contain frozen experience data
- publishedConfig references releaseIds

**Parallelizable:** Yes (after Phase 25)

---

## Phase 27 — Publish Validation

**Goal:** Prevent invalid experiences from being published.

**Location:** `domains/experience/validation/`

**Deliverables:**

- [ ] Pre-publish validation for each experience
  - Profile constraints
  - Step config completeness
  - Required step ordering
- [ ] Block publish on validation errors
- [ ] Show validation errors in UI

**Testable outcome:**

- Invalid experiences block publish
- Errors are clear and actionable
- Valid experiences publish successfully

**Parallelizable:** Yes (after Phase 26)

---

## Phase 28 — Capture Step: Photo

**Goal:** Add photo capture capability.

**Location:** `domains/experience/steps/capture/`

**Deliverables:**

- [ ] `capture.photo` step config form
- [ ] `capture.photo` step renderer (edit mode)
- [ ] `capture.photo` step renderer (run mode)
  - Camera capture via `shared/camera`
  - File upload fallback
- [ ] Runtime support for media output

**Testable outcome:**

- Photo capture works in preview and guest
- Captured photo stored correctly
- Media output available for downstream steps

**Parallelizable:** Yes (after Phase 21)

---

## Phase 29 — Share Step

**Goal:** Guest can share/download result.

**Location:** `domains/experience/steps/share/`

**Deliverables:**

- [ ] `share` step config form
- [ ] `share` step renderer (edit mode)
- [ ] `share` step renderer (run mode)
  - Download button
  - Copy link
  - Social sharing (based on event config)
- [ ] Consume upstream media/result

**Testable outcome:**

- Share step displays result
- Download works
- Sharing options match event config

**Parallelizable:** Yes (after Phase 28)

---

## Phase 30 — Pregate & Preshare Runtime Integration

**Goal:** Pregate and preshare experiences run in guest flow.

**Location:** `domains/guest/`

**Deliverables:**

- [ ] Run pregate experience before welcome (if enabled)
- [ ] Run preshare experience before share step (if enabled)
- [ ] Proper sequencing and state handling

**Testable outcome:**

- Pregate runs before welcome
- Preshare runs before share
- Flow completes correctly

**Parallelizable:** Yes (after Phase 25)

---

## Phase 31 — Transform Step (Heavy Track)

**Goal:** Add async AI processing.

**Location:** `domains/experience/steps/transform/` + `functions/`

**Deliverables:**

- [ ] `transform.pipeline` step config form
- [ ] `transform.pipeline` step renderer (shows progress)
- [ ] Cloud Function for transform job
- [ ] Session-based job tracking
- [ ] Runtime waits for completion
- [ ] Error handling + retries

**Testable outcome:**

- Transform job triggers correctly
- Progress displays in UI
- Result available for share step
- Errors handled gracefully

**Parallelizable:** Partial (cloud infra ↔ frontend)

---

## Phase 32 — Polish & Hardening

**Goal:** Production-ready cleanup.

**Deliverables:**

- [ ] Soft delete handling in all UIs
- [ ] Hide deleted/disabled experiences everywhere
- [ ] Preview session visibility rules
- [ ] Error boundary coverage
- [ ] Loading states polish
- [ ] Edge case handling

**Parallelizable:** Yes (independent polish tasks)

---

## Critical Files to Modify/Create

**New domains/subdomains:**

- `apps/clementine-app/src/domains/experience/` - Core experience domain
- `apps/clementine-app/src/domains/session/` - Session domain
- `apps/clementine-app/src/domains/workspace/experiences/` - Workspace experience CRUD
- `apps/clementine-app/src/domains/event/experiences/` - Event-level experience management

**Existing files to modify:**

- `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`
- `apps/clementine-app/src/domains/event/designer/components/EventDesignerSidebar.tsx`
- `apps/clementine-app/src/domains/event/welcome/components/WelcomePreview.tsx`
- `apps/clementine-app/src/domains/project/shared/schemas/` (add activeEventId)

**New routes:**

- `/workspace/$slug/projects/$projectId/events/$eventId/create-experience`
- `/workspace/$slug/projects/$projectId/events/$eventId/experience/$experienceId`
- `/join/$projectId`
- `/join/$projectId/experience/$experienceId`

**Shared modules to create/extend:**

- `src/shared/components/ExperienceCard.tsx`
- `src/shared/components/ExperiencePicker.tsx` (guest-facing)

---

## Dependency Graph

```
Phase 0 (Foundations)
    ↓
    ├── Phase 1 (Profiles)
    ├── Phase 2 (Data Model)
    │       ↓
    │   Phase 3 (CRUD Hooks)
    │       ↓
    │   Phase 5 (Picker Modal) ────┐
    │       ↓                      │
    │   Phase 6 (Create Flow)      │
    │       ↓                      │
    │   Phase 7 (Sidebar Main)     │
    │       ↓                      │
    │   ├── Phase 8 (Reorder)      │
    │   ├── Phase 9 (Extras)       │
    │   └── Phase 10 (Welcome WYSIWYG) ←┘
    │
    └── Phase 4 (Event Config Schema)
            ↓
        Phase 23 (Join Shell)
            ↓
        Phase 24 (Guest Welcome) ← Phase 10
            ↓
        Phase 25 (Guest Flow) ← Phase 21

Phase 11 (Step Registry)
    ↓
Phase 12 (Editor Layout)
    ↓
Phase 13 (Step List)
    ↓
Phase 14 (Step Preview)
    ↓
Phase 15 (Config Panel)
    ↓
├── Phase 16 (Add Step)
├── Phase 17 (Remove/Reorder)
└── Phase 18 (Input Configs)

Phase 19 (Session Domain)
    ↓
Phase 20 (Runtime Engine)
    ↓
Phase 21 (Step Renderers Run)
    ↓
├── Phase 22 (Admin Preview)
├── Phase 28 (Capture Photo)
│       ↓
│   Phase 29 (Share Step)
└── Phase 25 (Guest Flow)
        ↓
    Phase 26 (Releases)
        ↓
    Phase 27 (Validation)

Phase 30 (Pregate/Preshare Runtime) ← Phase 25
Phase 31 (Transform) ← Phase 28
Phase 32 (Polish) ← all
```

---

## MVP Scope Summary

**In Scope:**

- Workspace-scoped experiences with event-scoped UX
- Three profiles: freeform, survey, informational
- Three slots: main (array), pregate (single), preshare (single)
- Experience picker with profile filtering
- Experience editor with step management
- WYSIWYG Welcome screen
- Guest join flow with experience selection
- Session-based runtime
- Photo capture, input steps, info steps, share step
- Event publish with immutable releases

**Out of Scope (MVP Cut):**

- Experience Library UI
- Marketplace / Templates
- Version history
- Video/GIF capture (placeholder only)
- Transform step (Phase 31, heavy track)
- Analytics dashboards
- Role/permission granularity
