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

**Source**: `/src/domains/session/shared/schemas/session.schema.ts` (exists)

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Unique session identifier (Firestore document ID) |
| `projectId` | string | Yes | - | Parent project ID |
| `eventId` | string | Yes | - | Event that triggered this session |
| `experienceId` | string | Yes | - | Experience configuration being executed |
| `mode` | enum | Yes | - | Session mode: `'preview'` \| `'guest'` |
| `configSource` | enum | Yes | - | Which config to use: `'draft'` \| `'published'` |
| `status` | enum | No | `'active'` | Lifecycle status: `'active'` \| `'completed'` \| `'abandoned'` \| `'error'` |
| `currentStepIndex` | number | No | `0` | Current step index (0-based) |
| `inputs` | Record<string, unknown> | No | `{}` | Step inputs keyed by step ID |
| `outputs` | Record<string, MediaReference> | No | `{}` | Generated media keyed by step ID |
| `activeJobId` | string \| null | No | `null` | Transform job ID (for async processing) |
| `resultAssetId` | string \| null | No | `null` | Final result asset ID |
| `createdAt` | number | Yes | - | Creation timestamp (Unix ms) |
| `updatedAt` | number | Yes | - | Last update timestamp (Unix ms) |
| `completedAt` | number \| null | No | `null` | Completion timestamp (Unix ms) |

#### Validation Rules

- `id`: Non-empty string
- `mode`: Must be `'preview'` or `'guest'`
- `configSource`: Must be `'draft'` or `'published'`
- `status`: Must be one of `'active'`, `'completed'`, `'abandoned'`, `'error'`
- `currentStepIndex`: Non-negative integer

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

### 2. RuntimeState (In-Memory)

**Description**: Represents the current state of an experience execution. Used internally by the runtime engine, not persisted directly (derived from session document).

**Source**: `/src/domains/experience/shared/types/runtime.types.ts` (exists)

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `currentStepIndex` | number | Current step index (0-based) |
| `inputs` | Record<string, unknown> | Collected inputs keyed by step ID |
| `outputs` | Record<string, MediaReference> | Generated outputs keyed by step ID |

---

### 3. MediaReference (Shared)

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
  projectId: string     // Required - parent project
  eventId: string       // Required - triggering event
  experienceId: string  // Required - experience to run
  mode: 'preview' | 'guest'  // Required - session mode
  configSource: 'draft' | 'published'  // Required - config to use
}
```

### UpdateSessionProgressInput

**Purpose**: Input for updating session progress during execution.

```typescript
{
  sessionId: string              // Required - session to update
  currentStepIndex?: number      // Optional - new step index
  inputs?: Record<string, unknown>  // Optional - updated inputs
  outputs?: Record<string, MediaReference>  // Optional - updated outputs
}
```

### CompleteSessionInput

**Purpose**: Input for marking a session as completed.

```typescript
{
  sessionId: string  // Required - session to complete
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
- `inputs` uses `Record<string, unknown>` to support various input types (string, number, boolean, array)
- `outputs` is strongly typed with `MediaReference` schema
