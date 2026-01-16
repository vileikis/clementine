# Data Model: Session & Runtime Foundation

**Feature**: 030-session-runtime-capture
**Date**: 2026-01-15

## Overview

This document defines the data entities for the Session & Runtime Foundation feature. The session entity is already implemented; this document serves as the canonical reference.

---

## Entities

### 1. Session

**Description**: Tracks a single execution of an experience by a user (admin in preview or guest in public mode).

**Firestore Path**: `/projects/{projectId}/sessions/{sessionId}`

**Source**: `/src/domains/session/shared/schemas/session.schema.ts` (TO UPDATE)

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Unique session identifier (Firestore document ID) |
| `projectId` | string | Yes | - | Parent project ID |
| `eventId` | string | Yes | - | Event that triggered this session |
| `experienceId` | string | Yes | - | Experience configuration being executed |
| `workspaceId` | string | Yes | - | Workspace ID for cross-project queries |
| `mode` | enum | Yes | - | Session mode: `'preview'` \| `'guest'` |
| `configSource` | enum | Yes | - | Which config to use: `'draft'` \| `'published'` |
| `status` | enum | No | `'active'` | Lifecycle status: `'active'` \| `'completed'` \| `'abandoned'` \| `'error'` |
| `currentStepIndex` | number | No | `0` | Current step index (0-based, for recovery) |
| `answers` | Answer[] | No | `[]` | Collected answers from input steps |
| `capturedMedia` | CapturedMedia[] | No | `[]` | Media captured from capture steps |
| `result` | SessionResult \| null | No | `null` | Final result from transform/capture |
| `jobId` | string \| null | No | `null` | Active transform job ID |
| `createdBy` | string \| null | No | `null` | User ID who created session (for security rules) |
| `createdAt` | number | Yes | - | Creation timestamp (Unix ms) |
| `updatedAt` | number | Yes | - | Last update timestamp (Unix ms) |
| `completedAt` | number \| null | No | `null` | Completion timestamp (Unix ms) |

#### Nested Types

**Answer** (collected from input steps):
| Field | Type | Description |
|-------|------|-------------|
| `stepId` | string | Step that collected this answer |
| `stepType` | string | Step type (e.g., 'input.scale', 'input.yesNo') |
| `value` | string \| number \| boolean \| string[] | The answer value |
| `answeredAt` | number | Timestamp when answered (Unix ms) |

**CapturedMedia** (from capture steps):
| Field | Type | Description |
|-------|------|-------------|
| `stepId` | string | Step that captured this media |
| `assetId` | string | Media asset ID in storage |
| `url` | string | Public URL to the asset |
| `createdAt` | number | Capture timestamp (Unix ms) |

**SessionResult** (final output):
| Field | Type | Description |
|-------|------|-------------|
| `stepId` | string | Step that produced the result |
| `assetId` | string | Result asset ID |
| `url` | string | Public URL to the result |
| `createdAt` | number | Result creation timestamp (Unix ms) |

#### Validation Rules

- `id`: Non-empty string
- `mode`: Must be `'preview'` or `'guest'`
- `configSource`: Must be `'draft'` or `'published'`
- `status`: Must be one of `'active'`, `'completed'`, `'abandoned'`, `'error'`
- `currentStepIndex`: Non-negative integer
- `answers[].stepType`: Must match valid step type from registry
- `answers[].value`: Type must match step type expectations

#### State Transitions

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────┐    complete()    ┌───────────────┐  │
│  │  active  │ ───────────────► │   completed   │  │
│  └──────────┘                  └───────────────┘  │
│       │                                           │
│       │ abandon()                                 │
│       │                                           │
│       ▼                                           │
│  ┌───────────────┐                               │
│  │   abandoned   │                               │
│  └───────────────┘                               │
│                                                     │
│       │ error condition                           │
│       ▼                                           │
│  ┌───────────────┐                               │
│  │     error     │                               │
│  └───────────────┘                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 2. SessionRuntimeStore (Zustand - In-Memory)

**Description**: Zustand store for runtime state management during experience execution. Separates UI navigation state from Firestore persistence.

**Source**: `/src/domains/experience/runtime/stores/useSessionRuntimeStore.ts` (TO CREATE)

**Design Rationale**:
- **Firestore session** = persistent progress (for recovery, analytics)
- **Zustand store** = runtime navigation state (for immediate UI updates)
- Navigation (back/forward) updates Zustand immediately, syncs to Firestore on "meaningful" events (answer submitted, step completed)

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `currentStepIndex` | number | Current step index for UI (0-based) |
| `answers` | Answer[] | Answers collected during runtime |
| `capturedMedia` | CapturedMedia[] | Media captured during runtime |
| `isComplete` | boolean | Whether experience has completed |
| `isSyncing` | boolean | Whether currently syncing to Firestore |

#### Actions

| Action | Description |
|--------|-------------|
| `initFromSession(session)` | Initialize store from session document |
| `setAnswer(stepId, stepType, value)` | Record an answer for a step |
| `setCapturedMedia(stepId, media)` | Record captured media for a step |
| `goToStep(index)` | Navigate to a specific step (no Firestore sync) |
| `nextStep()` | Move to next step (triggers Firestore sync) |
| `previousStep()` | Move to previous step (no Firestore sync) |
| `complete()` | Mark experience as complete (triggers Firestore sync) |
| `syncToFirestore()` | Persist current state to Firestore |

---

### 3. RuntimeState (Legacy - In-Memory)

**Description**: Simple state snapshot type used by RuntimeEngine interface. May be deprecated in favor of SessionRuntimeStore.

**Source**: `/src/domains/experience/shared/types/runtime.types.ts` (exists)

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `currentStepIndex` | number | Current step index (0-based) |
| `inputs` | Record<string, unknown> | Collected inputs keyed by step ID |
| `outputs` | Record<string, MediaReference> | Generated outputs keyed by step ID |

---

### 4. MediaReference (Shared)

**Description**: Reference to a media asset stored in Firebase Storage.

**Source**: `/src/shared/theming/schemas/media-reference.schema.ts` (exists)

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Public URL to the media asset |
| `type` | enum | Media type: `'image'` \| `'video'` |
| `width` | number | Width in pixels (optional) |
| `height` | number | Height in pixels (optional) |

---

## Input Schemas

### CreateSessionInput

**Purpose**: Input for creating a new session.

```typescript
{
  projectId: string       // Required - parent project
  eventId: string         // Required - triggering event
  experienceId: string    // Required - experience to run
  workspaceId: string     // Required - workspace for cross-project queries
  mode: 'preview' | 'guest'  // Required - session mode
  configSource: 'draft' | 'published'  // Required - config to use
}
```

### UpdateSessionProgressInput

**Purpose**: Input for updating session progress during execution.

```typescript
{
  projectId: string              // Required - project containing session
  sessionId: string              // Required - session to update
  currentStepIndex?: number      // Optional - new step index
  answers?: Answer[]             // Optional - answers to merge
  capturedMedia?: CapturedMedia[]  // Optional - media to merge
  result?: SessionResult         // Optional - final result
}
```

### CompleteSessionInput

**Purpose**: Input for marking a session as completed.

```typescript
{
  projectId: string  // Required - project containing session
  sessionId: string  // Required - session to complete
}
```

### AbandonSessionInput

**Purpose**: Input for marking a session as abandoned.

```typescript
{
  projectId: string  // Required - project containing session
  sessionId: string  // Required - session to abandon
}
```

---

## Relationships

```
┌─────────────┐
│   Project   │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐          ┌─────────────┐
│   Session   │ ◄─────── │    Event    │
└──────┬──────┘  eventId └──────┬──────┘
       │                        │
       │ experienceId           │ experiences[]
       │                        │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Experience  │ ◄─────── │ Experience  │
│   (draft)   │          │   Config    │
└─────────────┘          └─────────────┘
```

---

## Index Requirements

### Primary Queries

| Query | Index | Purpose |
|-------|-------|---------|
| Sessions by project | `projectId` (ASC) | List project sessions |
| Sessions by event | `projectId` (ASC), `eventId` (ASC) | List event sessions |
| Active sessions | `status` (ASC), `createdAt` (DESC) | Find active sessions |

### Firestore Composite Index

```json
{
  "collectionGroup": "sessions",
  "fields": [
    { "fieldPath": "projectId", "order": "ASCENDING" },
    { "fieldPath": "eventId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## Security Rules

See `firebase/firestore.rules` for implementation. Summary:

- **Read**: Project admins can read all sessions; authenticated users can read own sessions
- **Create**: Authenticated users can create sessions for accessible projects
- **Update**: Only session creator can update
- **Delete**: Prohibited

---

## Notes

- Session schema uses `z.looseObject()` for forward compatibility with future fields
- Timestamps use Unix milliseconds for consistency with Firestore
- `answers` array structure enables analytics queries by `stepType` and timing analysis via `answeredAt`
- `capturedMedia` and `result` use explicit structure rather than generic `Record<string, unknown>`
- `workspaceId` enables cross-project analytics queries
- `currentStepIndex` in Firestore is for session recovery, not real-time navigation state
- Zustand store provides immediate UI updates for navigation; Firestore sync happens on meaningful events
- Use `convertFirestoreData()` utility from `@/shared/utils/firestore-utils` for consistent type conversion
