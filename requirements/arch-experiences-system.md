# Architecture: Experiences System

> **Related Documents:**
> - [Overview: Experience System](./experience-system-overview.md)
> - [Epic PRDs](./experience-system-overview.md#epic-roadmap)

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

- Experience Library (browse, create, manage experiences)
- Experience Editor (edit steps/config, publish)
- Event Designer integration (attach experiences to event slots)
- Share Screen Editor (configure event-level share screen)
- Preview (runs draft config through real runtime/session)

**Run-time (Guest + Preview)**

- Experience Runtime Engine executes steps sequentially
- Sessions persist state to support async jobs (transform pipeline)
- Guest uses published config; Preview uses draft config
- Welcome screen renders experience picker with layout options
- Share screen displays result with download/sharing options

---

## 3. Domain Boundaries

### Primary domains involved

- `domains/experience`

  - `shared/` - Schemas, types, CRUD hooks (owns experience data)
  - `library/` - Experience Library UI (list, create)
  - `steps/` - Step registry (types, schemas, renderer binding)
  - `validation/` - Profile rules & validation
  - `runtime/` - Runtime engine (step runner + orchestration primitives)
  - `editor/` - Experience editor UI (step list, config panels, preview)

- `domains/event`

  - Event designer/editor
  - `experiences/` - Thin UI layer for experience assignment
    - `ExperienceSlotManager` component
    - `ConnectExperiencePanel`, `CreateExperiencePanel`
  - `share/` - Share screen editor
  - Welcome screen editor (`WelcomeConfigPanel`)
  - Settings page (`EventSettingsPage` with "Guest Flow" section)

- `domains/session`

  - Session creation for both `guest` and `preview`
  - Session state subscription and updates
  - Session mode handling (preview vs guest)
  - Session lifecycle utilities

- `domains/guest`

  - Guest shell routes and UX chrome
  - Uses experience runtime engine + sessions to run flows
  - Welcome screen rendering (guest mode)
  - Share screen rendering (guest mode)

### Non-domain modules used

- `src/shared/camera` for capture (camera + upload/permissions)
- `src/shared/preview-shell` for rendering preview inside admin UI
- `src/shared/theming` for themed components and CSS variable generation
- `integrations/*` for Firebase, Sentry, etc.

---

## 4. Import & Dependency Rules

1. **`domains/experience` must not import from `domains/event` or `domains/guest`.**

   - Experience is a core capability, not a leaf.

2. **`domains/event` and `domains/guest` may import from `domains/experience` and `domains/session`.**

3. **`domains/session` must not import UI from event/guest.**

   - It can expose hooks and services used by both.

4. **`domains/experience` owns experience CRUD; `domains/event` provides UI for assignment.**

   - Experience domain owns schemas, types, and data hooks
   - Event domain imports from `domains/experience/shared/` for data operations
   - No circular dependencies

5. `src/shared/*` remains cross-cutting UI/utilities only.

   - No experience business rules in `src/shared`.

**Dependency flow:**
```
domains/experience/shared/   ← pure types, schemas, hooks
         ↓
domains/experience/library/  ← Experience Library UI
domains/experience/editor/   ← Experience Editor UI
         ↓
domains/event/experiences/   ← UI for assignment (picker, panels)
         ↓
domains/event/welcome/       ← WelcomeConfigPanel uses ExperienceSlotManager
domains/event/settings/      ← Settings uses ExperienceSlotManager for extras
domains/event/share/         ← Share screen editor
```

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

**MVP Step Types:**

| Type | Category | Description |
|------|----------|-------------|
| `info` | info | Display information |
| `input.scale` | input | Opinion scale |
| `input.yesNo` | input | Yes/No question |
| `input.multiSelect` | input | Multiple choice |
| `input.shortText` | input | Short text input |
| `input.longText` | input | Long text input |
| `capture.photo` | capture | Photo capture |
| `transform.pipeline` | transform | AI processing (placeholder) |

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

### 5.3 Experience Profiles

Lives in `domains/experience/validation`.

**MVP Profiles:**

| Profile | Allowed Step Categories |
|---------|------------------------|
| `freeform` | info, input, capture, transform |
| `survey` | info, input, capture |
| `story` | info only |

**Slot Compatibility:**

| Slot | Allowed Profiles |
|------|-----------------|
| `main` | freeform, survey |
| `pregate` | story, survey |
| `preshare` | story, survey |

**Profile Rules:**

- Profile is immutable after experience creation
- Step add menu filters by profile (only show allowed step types)
- Validation on save catches any invalid states
- Publish blocked if profile constraints violated

---

### 5.4 Experience Runtime Engine (Shared)

Lives in `domains/experience/runtime`.

Responsibilities:

- Execute steps sequentially
- Maintain runtime state:

  - current step index
  - accumulated answers/inputs
  - produced outputs (e.g., `resultAssetId`)

- Expose an API for UI bindings:

  - `currentStep`
  - `canGoBack`, `canGoNext`
  - `next()`, `back()`
  - `setAnswer(...)`, `setMedia(...)` etc.

**Important:** runtime is UI-agnostic; UI uses it via hooks/adapters.

---

### 5.5 Share Screen (Event-Scoped)

The share screen is **event-scoped**, not experience-scoped.

- Configured in Event Designer (Share tab)
- Displays after any experience completes
- Contains: result media, title, description, CTA, sharing options
- Same share screen for all experiences in an event

**Share screen follows the same two-mode pattern:**

- `mode: 'edit'` - Non-interactive preview in editor
- `mode: 'run'` - Interactive with download/share buttons

---

## 6. Data Model

### 6.1 Experience Document

**Path:** `/workspaces/{workspaceId}/experiences/{experienceId}`

```typescript
{
  // Identity
  id: string
  name: string

  // Metadata
  status: 'active' | 'deleted'
  profile: 'freeform' | 'survey' | 'story'
  media: { mediaAssetId: string; url: string } | null

  // Configuration
  draft: { steps: Step[] }
  published: { steps: Step[] } | null

  // Timestamps
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  publishedBy: string | null
  deletedAt: number | null
}
```

**Key design decisions:**

- **Media at root level** (not in draft/published) for easy list display
- **Draft/published on same doc** - no separate releases collection
- **All events share current published version** - instant updates everywhere

### 6.2 Session Document

**Path:** `/workspaces/{workspaceId}/sessions/{sessionId}`

```typescript
{
  id: string
  workspaceId: string
  experienceId: string
  mode: 'preview' | 'guest'

  // Progress
  currentStepIndex: number
  status: 'active' | 'completed' | 'abandoned'

  // Collected data
  answers: Array<{ stepId, stepType, value, answeredAt }>
  capturedMedia: Array<{ stepId, mediaAssetId, url, capturedAt }>

  // Result
  resultAssetId: string | null
  resultUrl: string | null

  // Timestamps
  createdAt: number
  updatedAt: number
  completedAt: number | null
}
```

### 6.3 Event Config (experiences field)

```typescript
// In projectEventConfigSchema
experiences: {
  main: Array<{ experienceId: string; enabled: boolean }>
  pregate: { experienceId: string; enabled: boolean } | null
  preshare: { experienceId: string; enabled: boolean } | null
}

shareScreen: {
  title: string
  description: string | null
  cta: { label: string; action: 'restart' | 'external'; url: string | null } | null
}

sharing: {
  download: { enabled: boolean; quality: 'original' | 'optimized' }
  copyLink: { enabled: boolean }
  social: { facebook, twitter, instagram, whatsapp, email }
}
```

---

## 7. Session Integration (Preview + Guest)

### Why sessions are required

Transform steps trigger asynchronous jobs; the job orchestration depends on persisted session state and outputs.

### Session modes

| Property | Preview | Guest |
|----------|---------|-------|
| `mode` | `'preview'` | `'guest'` |
| Config source | draft | published |
| Analytics | Excluded | Included |

### Mode differences handled outside step UI

Step UI is identical in run mode, but session-level callbacks differ by mode:

- analytics events
- persistence policies
- guardrails

These are top-level runtime/session concerns, not per-step forks.

---

## 8. Admin Experiences: Library, Editor, Preview

### Experience Library

Located at `domains/experience/library/`.

- Browse workspace experiences
- Filter by profile
- Create new experiences
- Navigate to editor

**Route:** `/workspace/:slug/experiences`

### Experience Editor

Located at `domains/experience/editor/`.

- 3-column layout: step list | preview | config panel
- Edits experience `draft.steps`
- Uses `StepRenderer(mode='edit')` for visual preview
- Auto-saves changes
- Publish button copies draft → published

**Route:** `/workspace/:slug/experiences/:experienceId`

### Admin Preview

- Runs the experience using the same runtime stack as guest
- Uses draft config and `mode='preview'`
- Creates preview session
- Rendered inside admin UI via `shared/preview-shell`

---

## 9. Welcome Screen: Editor vs Guest

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
- Shows experiences with published data
- Interactive (clicking experience navigates to experience flow)

**WYSIWYG guarantee:** Admin sees exactly what guests will see.

---

## 10. Routing

### Admin Routes

| Route | Purpose |
|-------|---------|
| `/workspace/:slug/experiences` | Experience Library |
| `/workspace/:slug/experiences/create` | Create experience |
| `/workspace/:slug/experiences/:id` | Experience editor |
| `/workspace/:slug/projects/:projectId/events/:eventId` | Event designer |
| `/workspace/:slug/projects/:projectId/events/:eventId/share` | Share screen editor |

### Guest Routes

| Route | Purpose |
|-------|---------|
| `/join/:projectId` | Welcome screen |
| `/join/:projectId/pregate` | Pregate experience |
| `/join/:projectId/experience/:experienceId` | Main experience |
| `/join/:projectId/preshare` | Preshare experience |
| `/join/:projectId/share` | Share screen |

---

## 11. Publishing Flow

### Experience Publish

Triggered by admin in Experience Editor:

1. Validate draft steps against profile constraints
2. Copy `draft` to `published`
3. Set `publishedAt` and `publishedBy`

**Invariant:** All events using this experience immediately see the new published version.

### Event Publish

Triggered by admin in Event Designer:

1. Validate all enabled experiences are published
2. Copy `draftConfig` to `publishedConfig`
3. Set event status and timestamps

**Invariant:** Event publish does NOT create experience snapshots. Events always reference current published experience version.

---

## 12. Event Designer Integration

### ExperienceSlotManager Component

Reusable component that encapsulates the state machine for managing experiences:

```typescript
interface ExperienceSlotManagerProps {
  mode: 'list' | 'single'
  slot: 'main' | 'pregate' | 'preshare'
  workspaceId: string
  experiences: ExperienceReference[]
  onUpdate: (experiences: ExperienceReference[]) => void
}
```

| Mode | Behavior |
|------|----------|
| `list` | Multiple items, drag-to-reorder, "Add" always visible |
| `single` | 0 or 1 item, no reorder, "Add" only when empty |

**Internal state machine:**
```
default → ConnectExperiencePanel → CreateExperiencePanel → default
```

### Experience Assignment Locations

| Slot | Location | Component |
|------|----------|-----------|
| `main` | Welcome tab → WelcomeConfigPanel | ExperienceSlotManager (list) |
| `pregate` | Settings tab → "Guest Flow" | ExperienceSlotManager (single) |
| `preshare` | Settings tab → "Guest Flow" | ExperienceSlotManager (single) |

### Edit Navigation

"Edit" action in experience list opens experience editor **in a new browser tab** (experience editor is not nested in event context).

---

## 13. Testing Strategy

### Unit tests (experience domain)

- Step config schemas validate expected shapes
- Profile validation rules catch illegal sequences
- Runtime engine state transitions:

  - next/back boundaries
  - answer/media collection

### Integration tests

- Preview session path creates session and completes
- Guest path identical step UI in run mode
- Experience publish updates published field
- Event publish validates experience states
- Welcome screen renders same in edit and run modes

---

## 14. Open Extensions (Explicitly Not MVP)

- Branching/conditional steps
- Cross-experience navigation
- Template library / marketplace
- Multi-locale content tooling
- Rich analytics dashboards
- Video/GIF capture
- Transform pipeline (placeholder only in MVP)

This architecture keeps those possible without rewriting core boundaries.

---

## 15. Naming Conventions

Consistent naming for config/control panels:

| Component | Purpose |
|-----------|---------|
| `WelcomeConfigPanel` | Welcome screen configuration |
| `ThemeConfigPanel` | Theme configuration |
| `ShareConfigPanel` | Share screen configuration |
| `StepConfigPanel` | Step configuration in experience editor |
| `ConnectExperiencePanel` | Experience picker (select existing) |
| `CreateExperiencePanel` | Experience creation form |
| `ExperienceSlotManager` | Manages experience list/slot with state machine |

**Convention:** Use `*ConfigPanel` suffix for right-side configuration panels.

---

## 16. Summary of Non-negotiables

- Single step registry (no duplicate step implementations)
- Single runtime engine used by preview + guest
- Sessions are persisted for both preview and guest
- Clear import boundaries to prevent domain coupling
- WYSIWYG for Welcome screen (same component, two modes)
- WYSIWYG for step renderers (same component, two modes)
- WYSIWYG for share screen (same component, two modes)
- Profile-based step filtering in editor
- Experiences are workspace-scoped with dedicated Library UI
- Draft/published on same experience doc (no releases)
- All events share current published experience version
- Share screen is event-scoped (not experience step)
- `*ConfigPanel` naming convention for config panels
