# Experience System Roadmap

> **Related Documents:**
> - [Architecture: Experiences System](./arch-expereinces-system.md)
> - [PRD: Experience Editor & Picker](./epic-experience-system-prd.md)

## Overview

This roadmap implements the Experience System epic. An Experience is a step-based interactive flow (info → input → capture → transform → share) scoped to an Event.

**Key architectural decisions:**
- `/join/[projectId]` route (project has `activeEventId` pointing to live event)
- Experience Editor is a **separate route** from Event Designer
- Pregate/preshare slots included from Phase 1

---

## Phase 0 — Structural Foundations (no UI)

**Goal:** Make it possible to build without rewrites.

**Deliverables:**
- [ ] Create `domains/experience/` scaffolding
- [ ] Create `domains/session/` scaffolding
- [ ] Step registry skeleton (types, no concrete steps yet)
- [ ] `ExperienceProfile` enum + empty validators
- [ ] Runtime engine interface (no implementation)
- [ ] Session API shape (`createSession`, `subscribeSession`)
- [ ] Add `activeEventId` field to project data model

**Testable outcome:**
- App boots with new domains
- No circular deps
- Can create a session record (manual/dev trigger)

**Parallelizable:** 🟢 Yes (runtime interfaces ↔ session API)

---

## Phase 1 — Main Experiences Integration (without Experience Editor)

**Goal:** Admin can manage main experiences as entities before editing them.

**Location:** `apps/clementine-app/src/domains/event/experiences/`

This creates a new subdomain under `event/` (alongside `designer/`, `settings/`, `theme/`, `welcome/`).

**Deliverables:**

*New module: `domains/event/experiences/`*
- [ ] `schemas/experience.schema.ts` - Zod schema for experience document
- [ ] `types/experience.types.ts` - TypeScript types
- [ ] `hooks/useExperiences.ts` - Fetch experiences list (names, ids, enabled state)
- [ ] `hooks/useCreateExperience.ts` - Create mutation
- [ ] `hooks/useDuplicateExperience.ts` - Duplicate mutation
- [ ] `hooks/useRenameExperience.ts` - Rename mutation
- [ ] `hooks/useReorderExperiences.ts` - Reorder main experiences
- [ ] `hooks/useToggleExperience.ts` - Enable/disable mutation
- [ ] `hooks/useDeleteExperience.ts` - Soft delete mutation

*Event Designer Sidebar additions (`EventDesignerSidebar.tsx`):*

```
┌─────────────────────────┐
│ Welcome                 │  ← existing link
│ Theme                   │  ← existing link
│ Settings                │  ← existing link
├─────────────────────────┤
│ EXPERIENCES        [+]  │  ← section header with add button
│   ├ Experience A   ⋮    │  ← draggable, click → editor route
│   ├ Experience B   ⋮    │     context menu: rename, duplicate,
│   └ Experience C   ⋮    │     enable/disable, delete
└─────────────────────────┘
```

- [ ] Add "Experiences" section to `EventDesignerSidebar`
- [ ] Add [+] button → navigates to `/workspace/$slug/projects/$projectId/events/$eventId/create-experience`
- [ ] Create experience route (name input + submit)
- [ ] List experiences with drag-to-reorder (using @dnd-kit)
- [ ] Context menu per experience: rename, duplicate, enable/disable, soft delete
- [ ] Click experience → navigate to editor route (placeholder for now)

*Event config schema:*
- [ ] Add `main` array to event config schema:
  ```typescript
  event.draftConfig.experiences = {
    main: Array<{ experienceId: string; enabled: boolean }>
  }
  ```

*Firestore:*
- [ ] Subcollection: `/projects/{projectId}/events/{eventId}/experiences/{experienceId}`

**Testable outcome:**
- Admin can create multiple main experiences
- Toggle enabled/disabled
- Reorder main experiences via drag & drop
- Duplicate/rename/delete experiences
- Navigate to experience editor route (placeholder)
- Changes reflected in event config

**NOT doing:** Extra slots (pregate/preshare), Editor, Runtime, Guest flow

**Parallelizable:** 🟢 Yes (Event UI ↔ persistence hooks)

---

## Phase 1.5 — Extra Slots (Pregate & Preshare)

**Goal:** Admin can assign experiences to pregate and preshare slots.

**Location:** Same module `domains/event/experiences/`

**Deliverables:**

*Additional hooks:*
- [ ] `hooks/useAssignExtraSlot.ts` - Assign experience to pregate/preshare
- [ ] `hooks/useClearExtraSlot.ts` - Remove experience from slot

*Event Designer Sidebar additions:*

```
┌─────────────────────────┐
│ EXPERIENCES        [+]  │
│   ├ Experience A   ⋮    │
│   └ Experience B   ⋮    │
├─────────────────────────┤
│ EXTRAS                  │  ← section header (no add button here)
│   Pregate: [+ Add]      │  ← empty state: "+ Add" navigates to /create-experience
│   Preshare: Welcome XP  │  ← filled state: show name + slot label
└─────────────────────────┘
```

- [ ] Add "Extras" section to sidebar
- [ ] Pregate slot UI:
  - Empty: "Pregate: [+ Add]" → navigates to `/create-experience?slot=pregate`
  - Filled: "Pregate: {name}" + context menu (clear slot, click → editor)
- [ ] Preshare slot UI (same pattern with `?slot=preshare`)
- [ ] Update `/create-experience` route to handle optional `slot` query param
  - If `slot` param present, assign newly created experience to that slot after creation

*Event config schema:*
- [ ] Add optional slots to event config:
  ```typescript
  event.draftConfig.experiences = {
    main: Array<{ experienceId: string; enabled: boolean }>,
    pregate?: { experienceId: string; enabled: boolean },
    preshare?: { experienceId: string; enabled: boolean }
  }
  ```

**Testable outcome:**
- Admin can assign any experience to pregate slot
- Admin can assign any experience to preshare slot
- Slots show clear labels ("Pregate:", "Preshare:")
- Can clear/swap slot assignments
- **Cannot** reorder or duplicate extra slots (they're single assignments)

**NOT doing:** Editor, Runtime, Guest flow

**Parallelizable:** 🟢 Yes (can run after Phase 1 main list is stable)

---

## Phase 2 — Guest Join Shell + Welcome (No Runtime Yet)

**Goal:** Make `/join/[projectId]` real and reliable.

**Deliverables:**
- [ ] `/join/[projectId]` route implementation
- [ ] Resolve chain: project exists → `activeEventId` exists → event exists & active
- [ ] States: 404 (invalid), Coming Soon (no active event), Welcome screen
- [ ] Experience Picker UI (based on `event.publishedConfig.experiences`)
  - Respects order + enabled flags
  - Selection navigates to experience route (stubbed)
- [ ] Run pregate experience if enabled (stubbed)

**Testable outcome:**
- Real project links work
- Experience picker shows correct experiences in correct order
- Selecting experience navigates to placeholder

**NOT doing:** Step execution, Sessions, Runtime

**Parallelizable:** 🟢 Yes (can run in parallel with admin/editor work)

---

## Phase 3 — Minimal Runtime + Session (No Transform)

**Goal:** Prove the execution model with simple steps.

**Deliverables:**

*Runtime engine:*
- [ ] Step sequencing (next/back)
- [ ] State accumulation (answers, outputs)
- [ ] API: `currentStep`, `canProceed`, `next()`, `back()`, `setAnswer()`

*Session integration:*
- [ ] Create session on experience start
- [ ] Session properties: `mode: 'preview' | 'guest'`, `configSource: 'draft' | 'published'`
- [ ] Real-time session state subscription

*Non-transform steps:*
- [ ] `info` step
- [ ] `input.yesNo` step
- [ ] `input.scale` step
- [ ] `input.shortText` step
- [ ] `input.longText` step
- [ ] `input.multiSelect` step

*Shared rendering:*
- [ ] `StepRenderer(mode='run')` component

**Testable outcome:**
- Guest can select experience → go through info + inputs
- Session state updates correctly in Firestore
- Admin preview uses same runtime

**NOT doing:** Capture, Transform, Editor

**Parallelizable:** 🔴 Mostly No (runtime + steps tightly coupled)

---

## Phase 4 — Capture Steps (Still No Transform)

**Goal:** Add media input without async complexity.

**Deliverables:**
- [ ] `capture.photo` step (camera + upload via `shared/camera`)
- [ ] `capture.video` step (optional)
- [ ] `capture.gif` step (optional)
- [ ] Runtime support for media outputs
- [ ] `StepConfigPanel` for capture steps

**Testable outcome:**
- Guest can capture or upload photo
- Runtime carries media forward in session state
- Preview and guest behave identically

**NOT doing:** Transform, Editor (full)

**Parallelizable:** 🟡 Partial (UI config panels ↔ runtime media handling)

---

## Phase 5 — Experience Editor (Draft-Only, No Publish)

**Goal:** Let admins actually author experiences.

**Deliverables:**
- [ ] Experience Editor route: `/workspace/[slug]/project/[projectId]/event/[eventId]/experience/[experienceId]`
- [ ] Layout: step list (left) + preview (center) + config panel (right)
- [ ] Step list actions: add/remove/reorder/select
- [ ] `StepConfigPanel` per step type (from registry)
- [ ] `StepRenderer(mode='edit')` for center preview
- [ ] Draft autosave to Firestore

**Testable outcome:**
- Admin can build full experience using all non-transform steps
- See immediate visual preview
- Reload page without losing draft

**NOT doing:** Publish, Validation gating, Transform

**Parallelizable:** 🟢 Yes (Editor UI ↔ step config panels)

---

## Phase 6 — Event Publish Semantics (Without Transform)

**Goal:** Lock live behavior safely.

**Deliverables:**
- [ ] Event publish flow updates:
  - Snapshot event config
  - For each referenced experience: `draft` → `published`
- [ ] Guest runtime reads `published` config only
- [ ] Draft changes do not affect live guests
- [ ] Publish blocked if obvious invalid states (minimal validation)

**Testable outcome:**
- Change draft → guest unchanged
- Publish → guest updates
- Preview still uses draft

**Parallelizable:** 🔴 No (touches many layers)

---

## Phase 7 — Validation & Profiles

**Goal:** Prevent broken experiences from going live.

**Deliverables:**
- [ ] `ExperienceProfile` enforcement in editor
- [ ] Inline editor validation (step-level errors/warnings)
- [ ] Publish hard-gated on validation errors
- [ ] Rules:
  - Share requires result (upstream transform/capture)
  - Invalid step ordering blocked
  - Required step config enforced

**Testable outcome:**
- Invalid flows blocked from publish
- Errors visible and understandable in editor

**Parallelizable:** 🟢 Yes (validation logic ↔ UI polish)

---

## Phase 8 — Transform Step (Isolated, Heavy Track)

**Goal:** Add async AI processing without destabilizing everything else.

**Deliverables:**
- [ ] `transform.pipeline` step implementation
- [ ] Cloud Task orchestration (Firebase Functions)
- [ ] Session-based job tracking (status, progress, result)
- [ ] Runtime waits for job completion with polling/subscription
- [ ] Error handling + retries
- [ ] `share` step consumes `resultAssetId`

**Testable outcome:**
- End-to-end: capture → transform → share works
- Jobs resilient to page refresh/reconnect
- Transform errors handled gracefully

**Parallelizable:** 🟡 Partial (cloud infra ↔ runtime integration)

---

## Phase 9 — Polish, Cleanup, Hardening

**Goal:** Make it production-safe.

**Deliverables:**
- [ ] Soft delete handling in all UIs
- [ ] Hide deleted/disabled experiences everywhere
- [ ] Preview session visibility rules (admin tooling)
- [ ] Cleanup job hooks (future)
- [ ] UX polish and edge cases
- [ ] pregate/preshare full integration in guest flow

**Parallelizable:** 🟢 Yes (independent polish tasks)

---

## Critical Files to Modify/Create

**New domains/subdomains to create:**
- `apps/clementine-app/src/domains/experience/` - Core experience domain (runtime, steps, editor)
- `apps/clementine-app/src/domains/session/` - Session domain (guest + preview sessions)
- `apps/clementine-app/src/domains/event/experiences/` - Event-level experience management (list, CRUD)

**Existing files to modify:**
- `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts` (add experiences config)
- `apps/clementine-app/src/domains/event/designer/containers/EventDesignerPage.tsx` (add sidebar sections)
- `apps/clementine-app/src/domains/event/designer/components/EventDesignerSidebar.tsx` (add Experiences + Extra sections)
- `apps/clementine-app/src/domains/guest/containers/GuestExperiencePage.tsx` (implement join flow)
- `apps/clementine-app/src/domains/project/` (add `activeEventId` field)

**New routes to create:**
- `/workspace/$slug/projects/$projectId/events/$eventId/create-experience` - Create experience form
- `/workspace/$slug/projects/$projectId/events/$eventId/experience/$experienceId` - Experience editor
- `/join/$projectId` - Guest join flow

**Shared modules to leverage:**
- `src/shared/camera/` - For capture steps
- `src/shared/preview-shell/` - For editor preview
- `src/shared/editor-controls/` - For step config panels
- `src/shared/theming/` - For guest-facing styling

---

## Dependency Graph

```
Phase 0 (Foundations)
    ↓
Phase 1 (Main Experiences)
    ↓
Phase 1.5 (Extra Slots) ←→ Phase 2 (Guest Join Shell)  [parallel]
    ↓                              ↓
    └──────────────────────────────┘
                  ↓
            Phase 3 (Runtime + Session)
                  ↓
            Phase 4 (Capture Steps)
                  ↓
            Phase 5 (Experience Editor)
                  ↓
            Phase 6 (Publish Semantics)
                  ↓
            Phase 7 (Validation)
                  ↓
            Phase 8 (Transform Step)
                  ↓
            Phase 9 (Polish)
```
