# Architecture Doc: Experiences System (Editor + Runtime)

## 1. Purpose

Define how the Experiences system is built and organized in the codebase, ensuring:

- One canonical implementation of step definitions and rendering
- Shared runtime engine used by **guest** and **admin preview**
- Clear domain boundaries and import rules
- Predictable state ownership for editor vs runtime
- Async transform jobs supported via persisted Sessions

---

## 2. High-Level System Overview

### Two major planes

**Design-time (Admin)**

- Experience Editor (edit steps/config)
- Event Designer integration (attach experiences to event slots)
- Preview (runs draft config through real runtime/session)

**Run-time (Guest + Preview)**

- Experience Runtime Engine executes steps sequentially
- Sessions persist state to support async jobs (transform pipeline)
- Guest uses published config; Preview uses draft config

---

## 3. Domain Boundaries

### Primary domains involved

- `domains/experience`

  - Step registry (types, schemas, renderer binding)
  - Profile rules & validation
  - Editor UI (step list, config panels, non-interactive preview)
  - Runtime engine (step runner + orchestration primitives)

- `domains/event`

  - Event designer/editor
  - Attaching experiences to event slots (main/pregate/preshare)
  - Event publish flow (publishes experiences as part of event publish)
  - Experience Picker configuration (ordering, enabled flags)

- `domains/session` (new domain)

  - Session creation for both `guest` and `preview`
  - Session state subscription and updates
  - Session mode handling (preview vs guest)
  - Session lifecycle utilities (e.g., closing session)

- `domains/guest`

  - Guest shell routes and UX chrome
  - Uses experience runtime engine + sessions to run flows

### Non-domain modules used

- `src/shared/camera` for capture (camera + upload/permissions)
- `src/shared/preview-shell` for rendering preview inside admin UI
- `integrations/*` for Firebase, Sentry, etc.

---

## 4. Import & Dependency Rules (to avoid a hairball)

1. **`domains/experience` must not import from `domains/event` or `domains/guest`.**

   - Experience is a core capability, not a leaf.

2. **`domains/event` and `domains/guest` may import from `domains/experience` and `domains/session`.**

3. **`domains/session` must not import UI from event/guest.**

   - It can expose hooks and services used by both.

4. `src/shared/*` remains cross-cutting UI/utilities only.

   - No experience business rules in `src/shared`.

---

## 5. Key Concepts and Responsibilities

### 5.1 Step Registry (Single Source of Truth)

Lives in `domains/experience/steps`.

Responsibilities:

- Enumerate supported `StepType`s
- Provide per-step:

  - config schema (Zod)
  - default config factory
  - validation hooks (beyond schema, if needed)
  - renderer binding (component to render step)
  - optional editor config panel binding

**Goal:** adding a new step type is a contained change.

---

### 5.2 Step Rendering Strategy: One Implementation, Two Modes

All step types render via a shared renderer that supports:

- `mode: 'edit' | 'run'`

**Run mode**

- Interactive
- Reads/writes to runtime state
- Used by **guest** and **admin preview**

**Edit mode**

- Non-interactive visual preview
- Reflects the current draft step config immediately
- Used inside the Experience Editor center preview

This prevents divergence between admin preview and guest.

---

### 5.3 Experience Runtime Engine (Shared)

Lives in `domains/experience/runtime`.

Responsibilities:

- Execute steps sequentially
- Maintain runtime state:

  - current step index
  - accumulated answers/inputs
  - produced outputs (e.g., `resultAssetId`)

- Enforce prerequisites (e.g., share requires result)
- Expose an API for UI bindings:

  - `currentStep`
  - `canProceed`
  - `next()`, `back()`
  - `setAnswer(...)`, `setMedia(...)` etc. (abstracted)

**Important:** runtime is UI-agnostic; UI uses it via hooks/adapters.

---

### 5.4 Profile Validation (Constraint Rules)

Lives in `domains/experience/validation`.

Responsibilities:

- Validate step sequence against `ExperienceProfile`
- Provide:

  - blocking publish errors
  - inline editor warnings/errors (step-level)

- Run on:

  - editor interactions (best-effort feedback)
  - publish action (hard gate)

---

## 6. Session Integration (Preview + Guest)

### Why sessions are required

Transform steps trigger asynchronous jobs; the job orchestration depends on persisted session state and outputs.

### Session domain responsibilities

`domains/session` provides:

- `createSession({ eventId, experienceId, mode, configSource })`
- `subscribeSession(sessionId)` (realtime updates)
- `updateSessionProgress(...)` (when needed)
- `closeSession(...)` or mark complete

### Mode differences handled outside step UI

Step UI is identical in run mode, but session-level callbacks differ by mode:

- analytics events
- persistence policies
- guardrails

These are top-level runtime/session concerns, not per-step forks.

---

## 7. Admin Experiences: Editor vs Preview

### Experience Editor (Admin)

- Edits experience `draft`:

  - step order
  - step configs

- Uses `StepRenderer(mode='edit')` for visual preview

### Admin Preview

- Runs the experience using the same run-time stack as guest:

  - `StepRenderer(mode='run')`
  - runtime engine
  - sessions + async jobs

- Uses `configSource='draft'` and `mode='preview'`
- Rendered inside admin UI via `shared/preview-shell`

---

## 8. Guest Experience Runner

Guest routes:

- Load event published config
- Start session (`mode='guest', configSource='published'`)
- Run selected experience through runtime engine (run mode)
- Capture, transform, share follow normal runtime progression

---

## 9. Routing & State Ownership

### Experience Editor route

`/workspace/[slug]/project/[projectId]/event/[eventId]/experience/[experienceId]?step=[stepId]`

Rules:

- `stepId` is optional and used only for “selected step in editor UI”
- If missing/invalid, default to first step
- Step list edits must gracefully handle stale `stepId`

### Guest routes

Guest routing is independent and runs published experiences.
(Exact path can vary; architecture only requires separation.)

---

## 10. Editor UX Composition (High-level wiring)

In `domains/experience/editor`:

- Left: step list (select/reorder/add/remove)
- Center: preview shell + StepRenderer(edit)
- Right: step config panel (from registry)

The editor writes draft state to persistence via mutations in experience domain.

---

## 11. Event Designer Integration

`domains/event` responsibilities:

- Choose experiences for:

  - `main[]` (ordered, enabled flags)
  - `pregate`, `preshare`

- Control enabled/disabled without deletion
- Launch Experience Editor route for a selected experience
- Event publish triggers:

  - snapshot event config
  - publish referenced experiences (draft → published)

---

## 12. Testing Strategy (Minimal but essential)

### Unit tests (experience domain)

- Step config schemas validate expected shapes
- Profile validation rules catch illegal sequences
- Runtime engine state transitions:

  - next/back boundaries
  - dependency enforcement (share requires result)
  - transform output propagation

### Integration tests

- Preview session path triggers async jobs and completes
- Guest path identical step UI in run mode
- Event publish publishes experiences and locks live behavior

---

## 13. Open Extensions (Explicitly Not MVP)

- Branching/conditional steps
- Cross-experience navigation
- Template library (separate from experiences)
- Multi-locale content tooling
- Rich analytics dashboards

This architecture keeps those possible without rewriting core boundaries.

---

## 14. Summary of Non-negotiables

- Single step registry (no duplicate step implementations)
- Single runtime engine used by preview + guest
- Sessions are persisted for both preview and guest to support async transforms
- Event publish is the only publishing action; no standalone experience publish
- Clear import boundaries to prevent domain coupling
