# Experience System Roadmap

> **Related Documents:**
> - [Architecture: Experiences System](./arch-expereinces-system.md)
> - [PRD: Workspace Experiences](./epic-experience-system-prd.md)

---

## Overview

This roadmap implements the Experience System with **workspace-scoped experiences** and **event-scoped UX**.

**Key architectural decisions:**

- Experiences stored at workspace level (`/workspaces/{workspaceId}/experiences`)
- UX is event-scoped (experiences managed from event context)
- Publishing creates immutable releases (`/projects/{projectId}/experienceReleases`)
- `/join/[projectId]` resolves one active event
- WYSIWYG for Welcome screen and step renderers (same component, two modes)
- `ExperienceDesignerLayout` separate from `EventDesignerLayout`

**Roadmap principles:**

- Each phase is **small, functional, and UI-testable**
- Foundation phases may be technical-only
- No bundling unrelated features into one phase

---

## Phase 0 — Structural Foundations

**Goal:** Establish domain scaffolding and naming conventions.

**Deliverables:**

- [ ] Create `domains/experience/` scaffolding
  - `shared/` (schemas, types, hooks placeholder)
  - `steps/` (step registry skeleton)
  - `validation/` (profile rules placeholder)
  - `runtime/` (engine interface placeholder)
  - `editor/` (placeholder)
- [ ] Create `domains/session/` scaffolding
  - Session types and schemas
  - API shape (`createSession`, `subscribeSession`)
- [ ] Define `ExperienceProfile` type: `'freeform' | 'survey' | 'informational'`
- [ ] Add `activeEventId` field to project schema
- [ ] **Rename existing components:**
  - `WelcomeControls` → `WelcomeConfigPanel`
  - `ThemeControls` → `ThemeConfigPanel`

**Testable outcome:**

- App boots with new domains
- No circular dependencies
- TypeScript compiles with new types
- Renamed components work correctly

---

## Phase 1 — Experience Data Layer

**Goal:** Enable workspace experience CRUD operations.

**Location:** `domains/experience/shared/`

**Deliverables:**

- [ ] `schemas/workspace-experience.schema.ts` - Experience document schema
- [ ] `types/workspace-experience.types.ts` - TypeScript types
- [ ] `hooks/useWorkspaceExperiences.ts` - List experiences
- [ ] `hooks/useWorkspaceExperience.ts` - Get single experience
- [ ] `hooks/useCreateExperience.ts` - Create with name + profile
- [ ] `hooks/useUpdateExperience.ts` - Update experience
- [ ] `hooks/useDeleteExperience.ts` - Soft delete
- [ ] Firestore security rules for `/workspaces/{workspaceId}/experiences`
- [ ] Profile validation utilities (`validateProfile`, slot compatibility)

**Testable outcome:**

- Can create/read/update/delete experiences via Firestore console
- Profile validation works correctly
- Security rules enforce admin-only access

---

## Phase 2 — Event Config Experiences Schema

**Goal:** Add experiences field to event configuration.

**Location:** `domains/event/shared/schemas/`

**Deliverables:**

- [ ] Update `project-event-config.schema.ts`:
  ```typescript
  experiences: {
    main: Array<{ experienceId: string; enabled: boolean }>
    pregate?: { experienceId: string; enabled: boolean }
    preshare?: { experienceId: string; enabled: boolean }
  }
  ```
- [ ] Add `experienceReleases` collection schema
- [ ] Migration strategy for existing events (default empty experiences)

**Testable outcome:**

- Event config schema validates with experiences field
- Existing events continue to work

---

## Phase 3 — ExperienceSlotManager & Panels

**Goal:** Create reusable components for experience management.

**Location:** `domains/event/experiences/`

**Deliverables:**

- [ ] `components/ExperienceSlotManager.tsx`
  - Props: `mode: 'list' | 'single'`, `slot`, `experiences`, `onUpdate`
  - Internal state machine (default → connecting → creating)
- [ ] `components/ExperienceListItem.tsx`
  - Drag handle (list mode), thumbnail, name, toggle, context menu
- [ ] `components/ConnectExperiencePanel.tsx`
  - Back button, experience list (filtered by slot), "Create new" action
- [ ] `components/CreateExperiencePanel.tsx`
  - Back button, name input, profile selector, create button
- [ ] `hooks/useExperiencesForSlot.ts` - Filtered query for picker

**Testable outcome:**

- Components render correctly in isolation (Storybook or manual)
- State machine transitions work
- Profile filtering works

---

## Phase 4 — Main Experiences in WelcomeConfigPanel

**Goal:** Admin can manage main experiences from Welcome tab.

**Location:** `domains/event/welcome/`

**Deliverables:**

- [ ] Integrate `ExperienceSlotManager` into `WelcomeConfigPanel`
  - Mode: `list`, slot: `main`
  - Below layout toggle in "Experiences" section
- [ ] Wire up mutations to update `draftConfig.experiences.main`
- [ ] "Add Experience" button always visible
- [ ] Experience list item with toggle, context menu (Edit, Remove)
- [ ] Drag-to-reorder with @dnd-kit

**Testable outcome:**

- Admin can add experiences from Welcome tab
- Can reorder, toggle, remove experiences
- Changes persist to Firestore

---

## Phase 5 — Extra Slots in Settings

**Goal:** Admin can manage pregate/preshare from Settings tab.

**Location:** `domains/event/settings/`

**Deliverables:**

- [ ] Add "Guest Flow" section to `EventSettingsPage`
- [ ] Integrate `ExperienceSlotManager` for pregate (mode: single)
- [ ] Integrate `ExperienceSlotManager` for preshare (mode: single)
- [ ] Clear labels: "Before Welcome (Pregate)", "Before Share (Preshare)"
- [ ] Add callout in `WelcomeConfigPanel` when extras configured (link to Settings)

**Testable outcome:**

- Admin can add/remove pregate experience from Settings
- Admin can add/remove preshare experience from Settings
- Callout appears in Welcome tab when extras exist

---

## Phase 6 — Welcome Screen WYSIWYG

**Goal:** Welcome preview shows actual experiences.

**Location:** `domains/event/welcome/` + `src/shared/`

**Deliverables:**

- [ ] `shared/components/ExperienceCard.tsx` - Shared card (thumbnail, name)
  - Supports `mode: 'edit' | 'run'`
- [ ] `shared/components/ExperiencePickerGrid.tsx` - List/grid layout
  - Supports `layout: 'list' | 'grid'`
- [ ] Update `WelcomePreview.tsx` to render actual experiences
  - Resolve from `draftConfig.experiences.main`
  - Fetch experience data (name, media)
  - Render using shared components

**Testable outcome:**

- Welcome preview shows experience cards (not placeholder)
- Cards update when experiences added/removed
- Layout toggle (list/grid) works

---

## Phase 7 — Experience Editor Layout

**Goal:** Create dedicated experience editor with 3-column layout.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] `containers/ExperienceDesignerLayout.tsx`
  - Breadcrumbs: Project / Event / Experience
  - No event tabs (Welcome, Theme, Settings)
- [ ] `containers/ExperienceEditorPage.tsx`
  - 3-column layout: step list | preview | config panel
- [ ] Route: `/workspace/$slug/projects/$projectId/events/$eventId/experience/$experienceId`
- [ ] Load experience from workspace
- [ ] Navigation from context menu "Edit" action

**Testable outcome:**

- Clicking "Edit" from experience list opens editor
- Editor shows 3-column layout
- Breadcrumb navigation works (back to event)

---

## Phase 8 — Step Registry & Config Panels

**Goal:** Define step types with schemas and config forms.

**Location:** `domains/experience/steps/`

**Deliverables:**

- [ ] `registry.ts` - Step registry with type enumeration
- [ ] Step schemas (Zod) for:
  - `info`
  - `input.scale`, `input.yesNo`, `input.multiSelect`, `input.shortText`, `input.longText`
  - `capture.photo` (placeholder)
  - `transform.pipeline` (placeholder)
  - `share`
- [ ] Default config factories per step
- [ ] `StepConfigPanel` components for each step type
- [ ] Profile-based step filtering utility

**Testable outcome:**

- Step registry exports all MVP step types
- Config panels render correctly
- Profile filtering returns correct step types

---

## Phase 9 — Experience Editor: Step List & Selection

**Goal:** Admin can view, select, and manage steps.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] `components/StepList.tsx` - Display steps with icons/labels
- [ ] Step selection with URL sync (`?step=[stepId]`)
- [ ] "Add step" action with step type picker (filtered by profile)
- [ ] Remove step action (via context menu)
- [ ] Drag-to-reorder steps (@dnd-kit)

**Testable outcome:**

- Step list shows all steps in experience
- Can add/remove/reorder steps
- Profile filtering limits step types

---

## Phase 10 — Experience Editor: Step Preview & Config

**Goal:** Admin can configure steps with live preview.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] `components/StepPreview.tsx` - Center preview panel
- [ ] `StepRenderer(mode='edit')` - Non-interactive preview
- [ ] Wire up `StepConfigPanel` to right panel
- [ ] Auto-save step config changes
- [ ] Preview updates immediately on changes

**Testable outcome:**

- Selecting step shows preview and config
- Editing config updates preview immediately
- Changes persist to Firestore

---

## Phase 11 — Session Domain

**Goal:** Enable session creation and subscription.

**Location:** `domains/session/`

**Deliverables:**

- [ ] `schemas/session.schema.ts` - Session Zod schema
- [ ] `hooks/useCreateSession.ts`
- [ ] `hooks/useSession.ts` - Subscribe to session
- [ ] `hooks/useUpdateSession.ts`
- [ ] Firestore security rules for sessions

**Testable outcome:**

- Can create session (preview and guest modes)
- Can subscribe to session updates
- Session persists to Firestore

---

## Phase 12 — Experience Runtime Engine

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

---

## Phase 13 — Step Renderers (Run Mode)

**Goal:** Interactive step rendering for guest/preview.

**Location:** `domains/experience/steps/`

**Deliverables:**

- [ ] `StepRenderer(mode='run')` - Interactive rendering
- [ ] `info` step renderer (display + proceed)
- [ ] Input step renderers (interactive forms):
  - `input.scale`, `input.yesNo`, `input.multiSelect`
  - `input.shortText`, `input.longText`

**Testable outcome:**

- Steps render interactively in run mode
- User input captured correctly
- Proceed/back navigation works

---

## Phase 14 — Admin Preview

**Goal:** Admin can preview experience using runtime.

**Location:** `domains/experience/editor/`

**Deliverables:**

- [ ] "Preview" button in experience editor
- [ ] Preview modal/fullscreen using runtime
- [ ] Create preview session (`mode='preview'`, `configSource='draft'`)
- [ ] Use same step renderers as guest

**Testable outcome:**

- Preview button opens experience in run mode
- Session created with preview mode
- Steps are interactive

---

## Phase 15 — Guest Join & Welcome

**Goal:** Guest can access event and see welcome screen.

**Location:** `domains/guest/`

**Deliverables:**

- [ ] `/join/[projectId]` route
- [ ] Resolve chain: project → activeEventId → event (published)
- [ ] Create guest record if not exists
- [ ] Load `publishedConfig` experiences and releases
- [ ] Render `WelcomeScreen(mode='run')` with shared components
- [ ] Error states: 404, Coming Soon

**Testable outcome:**

- Valid project link loads welcome screen
- Experiences display from publishedConfig
- Guest record created

---

## Phase 16 — Guest Experience Flow

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

---

## Phase 17 — Experience Release & Publish

**Goal:** Event publish creates immutable releases.

**Location:** `domains/event/`

**Deliverables:**

- [ ] Update publish flow to create releases
- [ ] For each enabled experience:
  - Create release in `/projects/{projectId}/experienceReleases/{releaseId}`
  - Freeze experience data (profile, media, steps)
- [ ] Write releaseIds to `publishedConfig.experiences`
- [ ] Transaction for atomicity
- [ ] Pre-publish validation (profile constraints, step completeness)

**Testable outcome:**

- Publishing event creates releases
- Invalid experiences block publish
- Guest sees published experiences only

---

## Phase 18 — Capture & Share Steps

**Goal:** Photo capture and sharing functionality.

**Location:** `domains/experience/steps/`

**Deliverables:**

- [ ] `capture.photo` step config and renderers
  - Camera capture via `shared/camera`
  - File upload fallback
- [ ] Runtime support for media output
- [ ] `share` step config and renderers
  - Download, copy link, social sharing
  - Consume upstream media/result

**Testable outcome:**

- Photo capture works in preview and guest
- Share step displays result
- Full info → capture → share flow works

---

## Phase 19 — Pregate & Preshare Runtime

**Goal:** Extra experiences run in guest flow.

**Location:** `domains/guest/`

**Deliverables:**

- [ ] Run pregate experience before welcome (if enabled)
- [ ] Run preshare experience after main, before share (if enabled)
- [ ] Proper sequencing and state handling

**Testable outcome:**

- Pregate runs before welcome
- Preshare runs at correct point
- Flow completes correctly

---

## Phase 20 — Transform Step (Heavy Track)

**Goal:** Add async AI processing.

**Location:** `domains/experience/steps/transform/` + `functions/`

**Deliverables:**

- [ ] `transform.pipeline` step config and renderers
- [ ] Cloud Function for transform job
- [ ] Session-based job tracking
- [ ] Runtime waits for completion
- [ ] Error handling + retries

**Testable outcome:**

- Transform job triggers correctly
- Progress displays in UI
- Result available for share step

---

## Phase 21 — Polish & Hardening

**Goal:** Production-ready cleanup.

**Deliverables:**

- [ ] Soft delete handling in all UIs
- [ ] Hide deleted/disabled experiences everywhere
- [ ] Error boundary coverage
- [ ] Loading states polish
- [ ] Edge case handling

---

## Critical Files to Modify/Create

**New domains/subdomains:**

- `apps/clementine-app/src/domains/experience/` - Core experience domain
- `apps/clementine-app/src/domains/session/` - Session domain
- `apps/clementine-app/src/domains/event/experiences/` - Experience assignment UI

**Existing files to modify:**

- `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`
- `apps/clementine-app/src/domains/event/welcome/components/WelcomeControls.tsx` → rename to `WelcomeConfigPanel.tsx`
- `apps/clementine-app/src/domains/event/theme/components/ThemeControls.tsx` → rename to `ThemeConfigPanel.tsx`
- `apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx`
- `apps/clementine-app/src/domains/project/shared/schemas/` (add activeEventId)

**New routes:**

- `/workspace/$slug/projects/$projectId/events/$eventId/experience/$experienceId`
- `/join/$projectId`
- `/join/$projectId/experience/$experienceId`

**Shared modules to create:**

- `src/shared/components/ExperienceCard.tsx`
- `src/shared/components/ExperiencePickerGrid.tsx`

---

## Dependency Graph

```
Phase 0 (Foundations + Naming)
    ↓
Phase 1 (Data Layer)
    ↓
Phase 2 (Event Config Schema)
    ↓
Phase 3 (SlotManager & Panels)
    ↓
├── Phase 4 (Main in Welcome)
├── Phase 5 (Extras in Settings)
└── Phase 6 (Welcome WYSIWYG)
    ↓
Phase 7 (Editor Layout)
    ↓
Phase 8 (Step Registry)
    ↓
├── Phase 9 (Step List)
└── Phase 10 (Step Preview & Config)

Phase 11 (Session Domain)
    ↓
Phase 12 (Runtime Engine)
    ↓
Phase 13 (Step Renderers Run)
    ↓
├── Phase 14 (Admin Preview)
└── Phase 15 (Guest Join & Welcome)
        ↓
    Phase 16 (Guest Flow)
        ↓
    Phase 17 (Release & Publish)
        ↓
    Phase 18 (Capture & Share)
        ↓
    Phase 19 (Pregate/Preshare Runtime)
        ↓
    Phase 20 (Transform - Heavy)
        ↓
    Phase 21 (Polish)
```

---

## MVP Scope Summary

**In Scope:**

- Workspace-scoped experiences with event-scoped UX
- Three profiles: freeform, survey, informational
- Three slots: main (array), pregate (single), preshare (single)
- ExperienceSlotManager with state machine
- Experience editor (3-column, separate layout)
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
- Transform step (Phase 20, heavy track)
- Analytics dashboards
- Role/permission granularity
