# PRD: Workspace Experiences (Event-Scoped UX, MVP)

> **Related Documents:**
> - [Architecture: Experiences System](./arch-expereinces-system.md)
> - [Roadmap: Experience System](./experience-system-roadmap.md)

---

## 1. Goal & Non-Goals

### Goal

Enable admins to:

- Create and manage **mutable Experiences** at the workspace level
- Assign Experiences to Events via an **event-scoped UX**
- Publish Events in a way that **freezes runtime configuration**
- Allow guests to reliably consume **published experiences only**

### Non-Goals (Explicitly Out of Scope)

- Marketplace or cross-workspace sharing
- Experience templates
- Experience version history UI
- Workspace-scoped admin permissions
- Draft rollback / diffing
- Public project state abstraction (using project doc directly for MVP)
- Experience Library UI (global browsing, search, filters)

---

## 2. Core Concepts (Authoritative Definitions)

### Experience (Mutable)

- **Workspace-scoped**
- Edited over time
- Never directly consumed by guests
- Source of truth for publishing

### Experience Release (Immutable)

- **Project-scoped**
- Created at Event publish time
- Frozen copy of Experience draft
- Referenced by Events
- Consumed by guests

### Event

- **Project-scoped**
- References Experiences in `draftConfig`
- References ExperienceReleases in `publishedConfig`
- Can be re-published multiple times

### Session

Represents an execution of an experience.

- Can be `preview` or `guest` mode
- Always references:
  - `experienceId`
  - `eventId`
  - `projectId`
  - `releaseId` (required for guest, absent for preview)
- Uses either draft or published config depending on mode

---

## 3. Experience Profiles

Profiles define **what step types an experience can contain**. Profile is set at creation time and **cannot be changed** afterward.

### MVP Profiles

| Profile | Allowed Step Categories | Use Case |
|---------|------------------------|----------|
| `freeform` | info, input, capture, transform, share | Full flexibility for main experiences |
| `survey` | info, input, capture, share | Data collection, feedback (no AI transform) |
| `informational` | info only | Display-only content (welcome, instructions) |

### Slot Compatibility

| Slot | Allowed Profiles | Cardinality |
|------|-----------------|-------------|
| `main` | freeform, survey | Array (multiple) |
| `pregate` | informational, survey | Single (optional) |
| `preshare` | informational, survey | Single (optional) |

### Profile Rules

- Profile is **immutable** after experience creation
- Step add menu shows **only allowed step types** for the profile
- Validation on save catches any invalid states
- Admin cannot change profile; must create new experience

### Future Profiles (Out of Scope for MVP)

- `photo` - capture, transform, share (photo booth)
- `video` - capture, transform, share (video booth)
- `gif` - capture, transform, share (GIF booth)
- `ai_photo` - info, input, capture, transform, share (AI headshots)

---

## 4. Step Types

Steps are typed units of interaction or processing.

### Step Categories

| Category | Description |
|----------|-------------|
| `info` | Display informational content |
| `input` | Collect user input |
| `capture` | Capture media from user |
| `transform` | AI processing pipeline |
| `share` | Sharing/download step |

### MVP Step Types

| Type | Category | Description |
|------|----------|-------------|
| `info` | info | Display information (title, description, media) |
| `input.scale` | input | Opinion scale (1-5, 1-10) |
| `input.yesNo` | input | Yes/No question |
| `input.multiSelect` | input | Multiple choice selection |
| `input.shortText` | input | Short text input |
| `input.longText` | input | Long text input |
| `capture.photo` | capture | Photo capture (camera + upload) |
| `capture.video` | capture | Video capture |
| `capture.gif` | capture | GIF capture |
| `transform.pipeline` | transform | AI processing pipeline |
| `share` | share | Sharing and download options |

### Step Contracts

- `transform.pipeline` must produce `resultAssetId`
- `share` consumes `resultAssetId` (requires upstream transform or capture)

---

## 5. Firebase Data Model (MVP)

### 5.1 Workspaces

```
/workspaces/{workspaceId}
  name
  createdAt
```

### 5.2 Workspace Experiences (Mutable, Admin-Only)

```
/workspaces/{workspaceId}/experiences/{experienceId}
{
  id: string
  name: string
  status: 'active' | 'deleted'

  profile: 'freeform' | 'survey' | 'informational'

  media?: {
    mediaAssetId: string
    url: string
  }

  steps: Step[]

  createdAt: number
  updatedAt: number
}
```

**Notes:**
- No base64 or binary data
- Media always referenced by URL (thumbnail for picker/welcome screen)
- Soft deletion only (no cascading behavior in MVP)
- `steps` uses existing `Step` union type from codebase

### 5.3 Projects

```
/projects/{projectId}
{
  workspaceId: string
  name: string
  activeEventId: string | null
  status: 'active' | 'deleted'
  createdAt: number
  updatedAt: number
}
```

Guests can read this doc in MVP (accepted risk).

### 5.4 Events

```
/projects/{projectId}/events/{eventId}
{
  name: string
  status: 'draft' | 'published' | 'deleted'

  draftConfig: {
    // ... existing config (theme, overlays, sharing, welcome) ...

    experiences: {
      main: Array<{
        experienceId: string
        enabled: boolean
      }>
      pregate?: {
        experienceId: string
        enabled: boolean
      }
      preshare?: {
        experienceId: string
        enabled: boolean
      }
    }
  }

  publishedConfig?: {
    // ... existing config (theme, overlays, sharing, welcome) ...

    experiences: {
      main: Array<{
        experienceId: string
        releaseId: string
        enabled: boolean
      }>
      pregate?: {
        experienceId: string
        releaseId: string
        enabled: boolean
      }
      preshare?: {
        experienceId: string
        releaseId: string
        enabled: boolean
      }
    }
  }

  publishedAt?: number
  publishedBy?: string

  createdAt: number
  updatedAt: number
  draftRevision: number
}
```

### 5.5 Experience Releases (Immutable, Guest-Readable)

```
/projects/{projectId}/experienceReleases/{releaseId}
{
  experienceId: string
  sourceEventId: string
  data: {
    profile: 'freeform' | 'survey' | 'informational'
    media?: { mediaAssetId: string; url: string }
    steps: Step[]
  }
  createdAt: number
  createdBy: string
}
```

**Rules:**
- Immutable after creation
- May be reused across events in the same project
- Guests never read workspace experiences directly

### 5.6 Guests

```
/projects/{projectId}/guests/{guestId}
{
  authUid: string
  createdAt: number
}
```

Created when guest first visits `/join/[projectId]`.

### 5.7 Sessions

```
/projects/{projectId}/sessions/{sessionId}
{
  projectId: string
  eventId: string
  experienceId: string
  releaseId?: string        // present if guest, absent if preview
  guestId?: string          // present if guest
  mode: 'preview' | 'guest'
  configSource: 'draft' | 'published'

  answers: [...]
  createdAt: number
}
```

**Rules:**
- Preview sessions: Created by admin, may use draft config, excluded from guest analytics
- Guest sessions: Must use published config, require releaseId

---

## 6. Admin UX (Event-Scoped, MVP)

### Experience Creation

- Triggered from Event editor only
- "Create new experience" action
- Created under workspace, but feels event-local
- Creation flow:
  1. Select slot (main, pregate, or preshare)
  2. Enter experience name
  3. Select profile (filtered by slot compatibility)
  4. Experience created and assigned to slot

### Experience Picker (Select Existing)

Used when assigning an experience to an Event slot.

**Data Source:**
- Lists all workspace-scoped experiences where `status === 'active'`
- Not filtered by project
- Sorted by `updatedAt` DESC (most recently edited first)

**Picker Behavior:**

| Aspect | Behavior |
|--------|----------|
| Trigger | "Add experience" or "Replace experience" opens modal |
| List contents | Name, profile, optional thumbnail |
| Selection | Attaches `experienceId` to target slot, closes modal |
| Profile filtering | Only shows experiences with compatible profiles for the slot |
| Duplicates | Experiences already in the event are disabled with reason |
| Create new | Primary action: "Create new experience" |
| Empty state | "No experiences yet" + "Create new experience" button |

**Explicit Non-Requirements:**
- No search
- No filters
- No tags
- No pagination
- No edit/rename/delete inside picker
- No "used by X events" indicators
- No project-level scoping
- No marketplace or templates

### Experience Assignment

- One experience per slot type (pregate/preshare are single)
- Main slot can have multiple experiences
- Same experience cannot be assigned twice in the same event

### Experience Removal from Event

- Removes reference only
- Does not delete experience from workspace

### No Dedicated Experience Library UI (MVP)

- No global browsing
- No bulk management
- Minimal surface area

---

## 7. Event Publishing — Production-Safe Algorithm

### Preconditions

1. **Load Event** - Fail if missing, deleted, or user unauthorized
2. **Validate draftConfig** - Enabled experiences must exist, no duplicate experienceIds across slots
3. **Load all referenced Experiences** (workspace-scoped) - Fail if any enabled experience is missing or deleted

### Publish Steps (Atomic)

1. **Capture draftRevision** - Read `event.draftRevision`

2. **Prepare Releases** - For each enabled experience:
   - Build immutable payload from experience draft
   - Create `/experienceReleases/{releaseId}`

3. **Transaction** - Inside Firestore transaction:
   - Re-read event
   - Abort if `draftRevision` changed
   - Write `publishedConfig` referencing releaseIds
   - Set: `publishedAt`, `publishedBy`, `status = 'published'`, `updatedAt = now`

4. **Success** - Event is live, guests see published config only

### Failure Modes (Explicit)

| Failure | Action |
|---------|--------|
| Missing/deleted experience | Fail publish |
| Event edited during publish | Abort and retry |
| Partial publish | Never allowed |

---

## 8. Guest Flow

### Join Route: `/join/{projectId}`

1. **Read project** - Must exist
2. **Read activeEventId** - Must exist
3. **Read event** - Must exist and be published
4. **Load publishedConfig**
5. **Load referenced experienceReleases**
6. **Create guest record** if not exists (`/projects/{projectId}/guests/{guestId}`)
7. **Render Welcome screen** with experience picker

### Experience Selection

- Guest picks experience from Welcome screen
- Navigate to `/join/{projectId}/experience/{experienceId}?session={sessionId}`
- Create session doc with `guestId`, `eventId`, `experienceId`, `releaseId`

### Full Guest Flow

1. Guest opens event (via `/join/{projectId}`)
2. Optional pregate experience runs (if enabled)
3. Welcome screen shows Experience Picker
4. Guest selects one enabled main experience
5. Selected experience runs
6. Optional preshare experience runs
7. Share / exit

---

## 9. Security Model (MVP)

### Admin

Full access everywhere.

### Guest

**Read:**
- `/projects/{projectId}` (accepted risk for MVP)
- `/projects/{projectId}/events/{eventId}` (published fields only)
- `/projects/{projectId}/experienceReleases/{releaseId}`

**Write:**
- `/projects/{projectId}/sessions`
- `/projects/{projectId}/guests/{guestId}` (own doc only)

**No access to:**
- `/workspaces/*`
- Mutable experiences
- `draftConfig`

---

## 10. Preview vs Guest Sessions

Sessions are stored under `/projects/{projectId}/sessions`.

### Session Properties

| Property | Preview | Guest |
|----------|---------|-------|
| `mode` | `'preview'` | `'guest'` |
| `configSource` | `'draft'` | `'published'` |
| `releaseId` | absent | required |
| `guestId` | absent | required |
| Analytics | Excluded | Included |

Both session types support async transform jobs.

---

## 11. Step Validation Rules

An experience **cannot be published** if:

- Profile constraints are violated (step type not allowed for profile)
- Required step ordering rules are broken
- A transform step lacks required inputs
- A share step has no upstream output
- Any step has invalid or incomplete configuration

Validation timing:
- **On step add**: Only show allowed step types (preventive)
- **On save**: Validate and show errors/warnings (informative)
- **On publish**: Hard gate (blocking)

---

## 12. Explicit MVP Tradeoffs (Intentional)

- Project doc is guest-readable (accepted risk)
- No public state abstraction yet
- No experience deletion enforcement
- No template / marketplace concerns
- No admin role granularity

---

## 13. MVP Cut List (DO NOT BUILD)

These are explicitly forbidden for MVP:

| Item | Reason |
|------|--------|
| Experience Library UI | Event-scoped UX decided; library adds cognitive load |
| Marketplace / Templates / Sharing | Learn everything, do nothing pattern |
| Experience Version History | Published releases already act as history |
| Release Reuse / Hashing | Optimization before need; disk is cheap |
| Public Project State Abstraction | Consciously accepted risk for MVP |
| Soft-Delete Semantics UX | MVP trusts operator competence |
| Fancy Analytics | Log sessions correctly, analyze later |
| Role / Permission Granularity | Concierge-only; fake complexity |

---

## 14. Frozen Decisions (Do Not Revisit)

These are frozen unless reality breaks them:

- Experiences are **workspace-scoped**
- UX is **event-scoped**
- Guests **never read mutable experiences**
- Publish **creates immutable releases**
- `/join/[projectId]` resolves **one active event**
- MVP **trusts admin competence**

If you reopen these while coding, you are self-sabotaging.

---

## 15. What This Architecture Enables

- Safe publish semantics
- No guest exposure to drafts
- Reusable releases without syncing complexity
- Event-centric UX that doesn't fight the architecture
- Clean path to:
  - Experience library UI
  - Templates
  - Marketplace
  - Public project state
  - Workspace admins
