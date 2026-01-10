# Data Model: Experience Data Layer & Event Config Schema

**Date**: 2026-01-10
**Branch**: `021-exp-data-layer`

## Overview

This document defines the data entities, their relationships, and validation rules for the experience data layer.

---

## Entities

### 1. WorkspaceExperience

**Collection Path**: `/workspaces/{workspaceId}/experiences/{experienceId}`

**Description**: A mutable experience template owned by a workspace. Contains configuration, steps, and metadata. Never directly consumed by guests.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Auto-generated document ID |
| `name` | string | Yes | - | Display name (1-100 characters) |
| `status` | enum | Yes | 'active' | 'active' \| 'deleted' |
| `profile` | enum | Yes | - | 'freeform' \| 'survey' \| 'informational' (immutable after creation) |
| `media` | object \| null | No | null | Optional thumbnail/hero media |
| `media.mediaAssetId` | string | Yes* | - | Asset ID reference |
| `media.url` | string | Yes* | - | Public URL for rendering |
| `steps` | array | Yes | [] | Ordered array of Step objects |
| `createdAt` | number | Yes | - | Unix timestamp (ms) |
| `updatedAt` | number | Yes | - | Unix timestamp (ms) |
| `deletedAt` | number \| null | No | null | Soft delete timestamp |

**Validation Rules**:
- `name`: min 1, max 100 characters
- `profile`: immutable after document creation
- `steps`: must conform to profile constraints (see Profile Validation)
- `status`: only transition allowed is 'active' → 'deleted'

**Indexes Required**:
- Composite: `status` ASC, `updatedAt` DESC (for list query)

---

### 2. ExperienceReference

**Embedded In**: Event draftConfig and publishedConfig

**Description**: A reference to an experience within an event's configuration. Represents the assignment relationship.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `experienceId` | string | Yes | - | Reference to workspace experience |
| `enabled` | boolean | Yes | true | Whether experience is active in event |

**For Published Config** (additional field):

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `releaseId` | string | Yes | - | Reference to frozen release snapshot |

---

### 3. EventExperiencesConfig

**Embedded In**: ProjectEventConfig (draftConfig and publishedConfig)

**Description**: Configuration for all experience slots in an event.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `main` | ExperienceReference[] | Yes | [] | Ordered array of main experiences |
| `pregate` | ExperienceReference \| null | No | null | Single optional pregate experience |
| `preshare` | ExperienceReference \| null | No | null | Single optional preshare experience |

**Slot Semantics**:
- `main`: Multiple experiences, displayed on Welcome screen, guest selects one
- `pregate`: Optional single experience, runs before Welcome screen
- `preshare`: Optional single experience, runs after main experience, before share

---

### 4. ExperienceRelease

**Collection Path**: `/projects/{projectId}/experienceReleases/{releaseId}`

**Description**: An immutable snapshot of an experience created at event publish time. Read by guests.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Auto-generated document ID |
| `experienceId` | string | Yes | - | Source experience reference |
| `sourceEventId` | string | Yes | - | Event that triggered publish |
| `data.profile` | enum | Yes | - | Frozen profile type |
| `data.media` | object \| null | No | null | Frozen media configuration |
| `data.steps` | array | Yes | [] | Frozen step configurations |
| `createdAt` | number | Yes | - | Unix timestamp (ms) |
| `createdBy` | string | Yes | - | User ID who published |

**Invariants**:
- Document is immutable after creation (no updates allowed)
- `data` field contains complete frozen copy of experience configuration

---

## Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKSPACE                                 │
│  /workspaces/{workspaceId}                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ experiences/ (subcollection)                             │    │
│  │   ├── {experienceId}  ← WorkspaceExperience              │    │
│  │   ├── {experienceId}                                     │    │
│  │   └── ...                                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
        │
        │ references via experienceId
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PROJECT                                  │
│  /projects/{projectId}                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ events/ (subcollection)                                  │    │
│  │   └── {eventId}                                          │    │
│  │         ├── draftConfig                                  │    │
│  │         │     └── experiences: EventExperiencesConfig    │    │
│  │         │           ├── main: [ExperienceReference, ...] │    │
│  │         │           ├── pregate: ExperienceReference?    │    │
│  │         │           └── preshare: ExperienceReference?   │    │
│  │         └── publishedConfig                              │    │
│  │               └── experiences: (with releaseIds)         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ experienceReleases/ (subcollection)                      │    │
│  │   ├── {releaseId}  ← ExperienceRelease (immutable)       │    │
│  │   ├── {releaseId}                                        │    │
│  │   └── ...                                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Relationships**:
1. **Workspace → Experiences**: One-to-many ownership
2. **Event Config → Experience References**: Many-to-many via experienceId
3. **Published Config → Releases**: One-to-one via releaseId
4. **Release → Source Experience**: Reference only (no live link)

---

## Profile Constraints

### Step Categories

| Category | Step Types |
|----------|------------|
| `info` | info |
| `input` | input.scale, input.yesNo, input.multiSelect, input.shortText, input.longText |
| `capture` | capture.photo, capture.video, capture.gif |
| `transform` | transform.pipeline |
| `share` | share |

### Profile → Allowed Categories

| Profile | Allowed Categories |
|---------|-------------------|
| `freeform` | info, input, capture, transform, share |
| `survey` | info, input, capture, share |
| `informational` | info |

### Slot → Allowed Profiles

| Slot | Allowed Profiles |
|------|-----------------|
| `main` | freeform, survey |
| `pregate` | informational, survey |
| `preshare` | informational, survey |

---

## State Transitions

### WorkspaceExperience.status

```
┌─────────┐
│ active  │ ──── soft delete ────▶ ┌─────────┐
└─────────┘                        │ deleted │
     │                             └─────────┘
     │
     └── create, update, read (allowed)
```

**Transitions**:
- `active` → `deleted`: Via soft delete (sets status, deletedAt)
- No reverse transition (deleted experiences cannot be restored in MVP)

### Event Publishing Flow (Future Reference)

```
draftConfig.experiences                    publishedConfig.experiences
┌─────────────────────┐                    ┌─────────────────────┐
│ main: [             │                    │ main: [             │
│   { experienceId,   │   ── PUBLISH ──▶   │   { experienceId,   │
│     enabled }       │                    │     releaseId,      │
│ ]                   │                    │     enabled }       │
│ pregate: {...}      │                    │ ]                   │
│ preshare: {...}     │                    │ pregate: {...}      │
└─────────────────────┘                    │ preshare: {...}     │
        │                                  └─────────────────────┘
        │ references                              │ references
        ▼                                         ▼
/workspaces/.../experiences          /projects/.../experienceReleases
    (mutable)                               (immutable)
```

---

## Validation Rules Summary

### On Create Experience
- `name`: required, 1-100 characters
- `profile`: required, must be valid enum value
- `steps`: optional, defaults to empty array
- `status`: automatically set to 'active'
- `createdAt`, `updatedAt`: automatically set to current timestamp

### On Update Experience
- `profile`: cannot be changed (reject update)
- `status`: can only change from 'active' to 'deleted'
- `name`: if provided, must be 1-100 characters
- `steps`: if provided, must conform to profile constraints
- `updatedAt`: automatically updated

### On Assign to Event
- Experience must exist and be active
- Experience profile must be compatible with target slot
- Experience cannot be assigned to same slot twice (no duplicates in main array)

### On Publish Event (Future)
- All enabled experiences must exist and be active
- All experiences must pass profile validation
- Creates immutable release for each enabled experience
