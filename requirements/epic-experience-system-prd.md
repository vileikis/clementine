# PRD: Experience Editor & Experience Picker

## 1. Objective

Enable admins to **create, edit, preview, and publish Experiences**, where an Experience is a **step-based interactive flow** composed of steps such as info, input, capture, transform, and share.

Experiences are:

- **Scoped to an Event**
- **Stored under the Event as a subcollection**
- **Referenced by event configuration**
- **Versioned (draft / published)**
- **Published only via Event publish**

Events may include:

- Multiple **main experiences** (shown via Experience Picker)
- Optional **pregate** experience
- Optional **preshare** experience

---

## 2. Core Concepts

### Experience

A self-contained interactive flow composed of ordered steps.

- Owned by a single Event
- Draft and published snapshots
- Cannot be published independently
- Can be enabled/disabled without deletion

### Step

A typed unit of interaction or processing with a defined input/output contract.

### Experience Picker

UI on the Welcome screen allowing guests to select one of multiple enabled main experiences.

### Experience Profile

A constraint ruleset that governs allowed step types and ordering.

---

## 3. Firestore Structure (Relevant)

```
/projects/{projectId}
  /events/{eventId}
    event (doc)
    /experiences/{experienceId}
      experience (doc)
  /sessions/{sessionId}

```

- `experienceId` is Firestore-generated
- Sessions are project-scoped

---

## 4. Functional Requirements

### 4.1 Experience Management

Admins must be able to:

- **Create experience**
  - Creates a new experience under the event
  - Experience starts in draft state
- **Rename experience**
- **Duplicate experience**
  - Creates a new experience doc with copied draft content
- **Enable / disable experience**
  - Disabled experiences are hidden from guest flows
- **Soft delete experience**
  - Sets `status = 'deleted'`
  - Deleted experiences are not selectable
- **View publish state**
  - Clear indication whether draft differs from published
- **Preview experience**
  - Runs experience using draft config
  - Creates preview session
- **See which event the experience belongs to**
  - Context is always the current event

❌ Admins **cannot publish experiences independently**

---

### 4.2 Experience Composition (Editor)

Admins must be able to:

- **Add steps**
- **Remove steps**
- **Reorder steps**
- **Edit step configuration**
- **See a live preview of each step while editing**
- **Switch between steps via step list**
- **See validation errors inline**

Editor behavior:

- Step add menu is filtered by Experience Profile
- Invalid steps or flows are clearly marked
- Editor allows saving drafts even if invalid
- Publishing is blocked if validation fails

---

### 4.3 Step Validation Rules

An experience **cannot be published** if:

- Profile constraints are violated
- Required step ordering rules are broken
- A transform step lacks required inputs
- A share step has no upstream output
- Any step has invalid or incomplete configuration

---

### 4.4 Event Integration

Admins must be able to:

- **Attach experiences to event**
  - Main (multiple)
  - Pregate (optional)
  - Preshare (optional)
- **Reorder main experiences**
  - Order controls Experience Picker
- **Enable / disable attached experiences**
- **Preview event using draft config**
- **Publish event**

---

## 5. Event Configuration Model

```tsx
event.draftConfig.experiences = {
  main: Array<{
    experienceId: string
    version: 'draft' | 'published'
    enabled: boolean
  }>

  pregate?: {
    experienceId: string
    version: 'draft' | 'published'
    enabled: boolean
  }

  preshare?: {
    experienceId: string
    version: 'draft' | 'published'
    enabled: boolean
  }
}

```

### Rules

- Order of `main[]` defines picker order
- Disabled experiences are skipped in guest flow
- References use `{experienceId, version}` only

---

## 6. Guest Flow

1. Guest opens event
2. Optional pregate experience runs (if enabled)
3. Welcome screen shows Experience Picker
4. Guest selects one enabled main experience
5. Selected experience runs
6. Optional preshare experience runs
7. Share / exit

---

## 7. Preview vs Guest Sessions

Sessions are stored under `/projects/{projectId}/sessions`.

### Session Properties (Relevant)

```tsx
session {
  projectId
  eventId
  experienceId
  mode: 'preview' | 'guest'
  configSource: 'draft' | 'published'
}

```

- Preview sessions:
  - Created by admin preview
  - Visible in admin tooling
  - Excluded from guest analytics
- Guest sessions:
  - Created by live guests
  - Use published config only

Both session types are required to support async transform jobs.

---

## 8. Publishing Semantics (Critical)

### Event Publish

When publishing an event:

1. `event.draftConfig` → `event.publishedConfig`
2. For each referenced experience:
   - `experience.draft` → `experience.published`
3. Live guests read **only published config and published experience snapshots**

### Invariants

- Draft changes never affect live behavior
- Experiences cannot be published independently
- Live behavior changes only via event publish

---

## 9. Deletion & Cleanup

- Removing an experience from event config does not delete it
- Soft-deleted experiences remain until event cleanup
- Event cleanup job deletes:
  - Event doc
  - All subcollections (experiences, etc.)

---

## 10. Step Types (MVP)

- `info`
- `input.scale`
- `input.yesNo`
- `input.multiSelect`
- `input.shortText`
- `input.longText`
- `capture.photo` (camera + upload)
- `capture.video`
- `capture.gif`
- `transform.pipeline`
- `share`

### Contracts

- `transform.pipeline` must return `resultAssetId`
- `share` consumes `resultAssetId`

---

## 11. Out of Scope

- Event duplication
- Experience templates
- Guest galleries
- Analytics dashboards
- Conditional branching
