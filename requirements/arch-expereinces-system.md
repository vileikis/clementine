# Architecture Doc: Experiences System (Editor + Runtime)

> **Related Documents:**
> - [PRD: Workspace Experiences](./epic-experience-system-prd.md)
> - [Roadmap: Experience System](./experience-system-roadmap.md)

---

## 1. Purpose

Define how the Experiences system is built and organized in the codebase, ensuring:

- One canonical implementation of step definitions and rendering
- Shared runtime engine used by **guest** and **admin preview**
- Clear domain boundaries and import rules
- Predictable state ownership for editor vs runtime
- Async transform jobs supported via persisted Sessions
- **WYSIWYG parity** between admin preview and guest flow

---

## 2. High-Level System Overview

### Two major planes

**Design-time (Admin)**

- Experience Editor (edit steps/config)
- Event Designer integration (attach experiences to event slots)
- Preview (runs draft config through real runtime/session)
- Welcome screen preview (shows actual experiences from draft)

**Run-time (Guest + Preview)**

- Experience Runtime Engine executes steps sequentially
- Sessions persist state to support async jobs (transform pipeline)
- Guest uses published config; Preview uses draft config
- Welcome screen renders experience picker with layout options

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
  - Event publish flow (creates experience releases)
  - Experience Picker configuration (ordering, enabled flags)
  - Welcome screen editor

- `domains/session` (new domain)

  - Session creation for both `guest` and `preview`
  - Session state subscription and updates
  - Session mode handling (preview vs guest)
  - Session lifecycle utilities (e.g., closing session)

- `domains/guest`

  - Guest shell routes and UX chrome
  - Uses experience runtime engine + sessions to run flows
  - Welcome screen rendering (guest mode)

- `domains/workspace`

  - Workspace-level experience CRUD (experiences subcollection)
  - Experience listing for picker

### Non-domain modules used

- `src/shared/camera` for capture (camera + upload/permissions)
- `src/shared/preview-shell` for rendering preview inside admin UI
- `src/shared/theming` for themed components and CSS variable generation
- `integrations/*` for Firebase, Sentry, etc.

---

## 4. Import & Dependency Rules (to avoid a hairball)

1. **`domains/experience` must not import from `domains/event` or `domains/guest`.**

   - Experience is a core capability, not a leaf.

2. **`domains/event` and `domains/guest` may import from `domains/experience` and `domains/session`.**

3. **`domains/session` must not import UI from event/guest.**

   - It can expose hooks and services used by both.

4. **`domains/workspace` owns experience CRUD; `domains/event` references experiences.**

   - Event domain reads experiences for assignment, does not own them.

5. `src/shared/*` remains cross-cutting UI/utilities only.

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

### 5.3 Welcome Screen: One Implementation, Two Modes

The Welcome screen follows the same pattern as step renderers:

- `mode: 'edit' | 'run'`

**Welcome screen includes:**

- Themed background
- Hero media
- Title
- Description
- Experience picker (respects `layout: 'list' | 'grid'`)

**Run mode**

- Interactive (experience selection triggers navigation)
- Reads from published config
- Used by **guest flow** (`/join/[projectId]`)

**Edit mode**

- Non-interactive visual preview
- Reads from draft config
- Shows actual experiences from `draftConfig.experiences.main`
- Used inside **Welcome Editor** (`WelcomeEditorPage.tsx`)

**WYSIWYG guarantee:** Admin sees exactly what guests will see.

---

### 5.4 Experience Profiles

Lives in `domains/experience/validation`.

**MVP Profiles:**

| Profile | Allowed Step Categories |
|---------|------------------------|
| `freeform` | info, input, capture, transform, share |
| `survey` | info, input, capture, share |
| `informational` | info only |

**Slot Compatibility:**

| Slot | Allowed Profiles |
|------|-----------------|
| `main` | freeform, survey |
| `pregate` | informational, survey |
| `preshare` | informational, survey |

**Profile Rules:**

- Profile is immutable after experience creation
- Step add menu filters by profile (only show allowed step types)
- Validation on save catches any invalid states
- Publish blocked if profile constraints violated

---

### 5.5 Experience Runtime Engine (Shared)

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

### 5.6 Profile Validation (Constraint Rules)

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

- `createSession({ eventId, experienceId, releaseId?, guestId?, mode, configSource })`
- `subscribeSession(sessionId)` (realtime updates)
- `updateSessionProgress(...)` (when needed)
- `closeSession(...)` or mark complete

### Session properties by mode

| Property | Preview | Guest |
|----------|---------|-------|
| `mode` | `'preview'` | `'guest'` |
| `configSource` | `'draft'` | `'published'` |
| `releaseId` | absent | required |
| `guestId` | absent | required |

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

## 8. Welcome Screen: Editor vs Guest

### Welcome Editor (Admin)

Located at `domains/event/welcome/`.

- Edits welcome screen config (title, description, media, layout)
- Uses `WelcomeScreen(mode='edit')` for visual preview
- Shows actual experiences from `draftConfig.experiences.main`
- Non-interactive (clicking experience does nothing)

### Guest Welcome

Located at `domains/guest/`.

- Reads from `publishedConfig`
- Uses `WelcomeScreen(mode='run')`
- Shows experiences from `publishedConfig.experiences.main`
- Interactive (clicking experience navigates to experience flow)

### Shared Component

```typescript
// Shared Welcome screen component
interface WelcomeScreenProps {
  mode: 'edit' | 'run'
  config: WelcomeConfig
  experiences: ExperienceCard[]  // Resolved from draft or published
  layout: 'list' | 'grid'
  onSelectExperience?: (experienceId: string) => void  // Only in run mode
}
```

---

## 9. Guest Experience Runner

Guest routes:

- Load event published config
- Load experience releases from `publishedConfig.experiences`
- Start session (`mode='guest', configSource='published'`)
- Run selected experience through runtime engine (run mode)
- Capture, transform, share follow normal runtime progression

---

## 10. Routing & State Ownership

### Experience Editor route

`/workspace/[slug]/project/[projectId]/event/[eventId]/experience/[experienceId]?step=[stepId]`

Rules:

- `stepId` is optional and used only for "selected step in editor UI"
- If missing/invalid, default to first step
- Step list edits must gracefully handle stale `stepId`

### Guest routes

- `/join/[projectId]` - Welcome screen with experience picker
- `/join/[projectId]/experience/[experienceId]?session=[sessionId]` - Experience runner

---

## 11. Editor UX Composition (High-level wiring)

In `domains/experience/editor`:

- Left: step list (select/reorder/add/remove)
- Center: preview shell + StepRenderer(edit)
- Right: step config panel (from registry)

The editor writes draft state to persistence via mutations in experience domain.

**Step add menu:** Filtered by experience profile. Admin only sees step types allowed for the profile.

---

## 12. Event Designer Integration

`domains/event` responsibilities:

### Experience Picker (Select Existing)

- Modal to select workspace experience
- Filtered by slot-compatible profiles
- Shows: name, profile, thumbnail
- Disables experiences already in event
- "Create new" primary action

### Experience Creation

- From event context (feels event-local)
- Creates experience in workspace
- Assigns to slot immediately
- Creation flow: name + profile (filtered by slot)

### Experience Assignment

- Choose experiences for:

  - `main[]` (ordered, enabled flags, multiple allowed)
  - `pregate` (single, optional)
  - `preshare` (single, optional)

- Control enabled/disabled without deletion
- Launch Experience Editor route for a selected experience
- Event publish triggers experience release creation

---

## 13. Publishing Flow

### Event Publish

When publishing an event:

1. Load all referenced experiences (workspace-scoped)
2. For each enabled experience:
   - Create immutable release in `/projects/{projectId}/experienceReleases/{releaseId}`
   - Release contains frozen copy of experience draft
3. Write `publishedConfig` with releaseIds
4. Transaction ensures atomicity

### Invariants

- Draft changes never affect live behavior
- Experiences cannot be published independently
- Live behavior changes only via event publish
- Guests read only from experience releases (immutable)

---

## 14. Testing Strategy (Minimal but essential)

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
- Event publish creates releases and locks live behavior
- Welcome screen renders same in edit and run modes

---

## 15. Open Extensions (Explicitly Not MVP)

- Branching/conditional steps
- Cross-experience navigation
- Template library (separate from experiences)
- Multi-locale content tooling
- Rich analytics dashboards
- Experience Library UI

This architecture keeps those possible without rewriting core boundaries.

---

## 16. Summary of Non-negotiables

- Single step registry (no duplicate step implementations)
- Single runtime engine used by preview + guest
- Sessions are persisted for both preview and guest to support async transforms
- Event publish is the only publishing action; creates immutable releases
- Clear import boundaries to prevent domain coupling
- WYSIWYG for Welcome screen (same component, two modes)
- WYSIWYG for step renderers (same component, two modes)
- Profile-based step filtering in editor
- Experiences are workspace-scoped, UX is event-scoped
