# Data Model: Guest Access & Welcome

**Feature**: 037-guest-welcome
**Date**: 2026-01-20

## Overview

This document defines the data entities, schemas, and relationships for the Guest Access & Welcome feature. All schemas use Zod for runtime validation following the project's Type-Safe Development principle.

---

## Entity Relationship Diagram

```text
┌─────────────────┐       ┌─────────────────────┐
│    Project      │       │    Workspace        │
│  /projects/{id} │       │ /workspaces/{id}    │
├─────────────────┤       ├─────────────────────┤
│ id              │       │ id                  │
│ name            │──┐    │ name                │
│ workspaceId ────┼──┼────│                     │
│ activeEventId ──┼──┼─┐  └─────────────────────┘
│ status          │  │ │            │
│ createdAt       │  │ │            │ 1:N
│ updatedAt       │  │ │            ▼
└─────────────────┘  │ │  ┌─────────────────────┐
        │            │ │  │    Experience       │
        │ 1:N        │ │  │ /workspaces/{wid}/  │
        ▼            │ │  │  experiences/{id}   │
┌─────────────────┐  │ │  ├─────────────────────┤
│     Guest       │  │ │  │ id                  │
│ /projects/{pid}/│  │ │  │ name                │
│  guests/{id}    │  │ │  │ media               │
├─────────────────┤  │ │  │ published           │
│ id              │  │ │  │ status              │
│ projectId       │  │ │  └─────────────────────┘
│ authUid         │  │ │            ▲
│ createdAt       │  │ │            │ referenced by
└─────────────────┘  │ │            │
                     │ │  ┌─────────────────────┐
                     │ └──│      Event          │
                     │    │ /projects/{pid}/    │
                     │    │  events/{id}        │
                     │    ├─────────────────────┤
                     │    │ id                  │
                     │    │ name                │
                     │    │ publishedConfig ────┼───┐
                     │    │ status              │   │
                     │    └─────────────────────┘   │
                     │                              │
                     │    ┌─────────────────────┐   │
                     │    │ ProjectEventConfig  │◄──┘
                     │    ├─────────────────────┤
                     │    │ theme               │
                     │    │ welcome             │
                     │    │ experiences.main[]  │
                     │    │ overlays            │
                     │    │ shareOptions        │
                     │    └─────────────────────┘
                     │
                     │    ┌─────────────────────┐
                     └────│     Session         │
                          │ /projects/{pid}/    │
                          │  sessions/{id}      │
                          ├─────────────────────┤
                          │ id                  │
                          │ projectId           │
                          │ workspaceId         │
                          │ eventId             │
                          │ experienceId        │
                          │ mode: 'guest'       │
                          │ configSource        │
                          │ status              │
                          │ createdBy           │
                          └─────────────────────┘
```

---

## 1. Guest Entity (NEW)

**Collection Path**: `/projects/{projectId}/guests/{guestId}`

**Purpose**: Tracks anonymous visitors to a project for session association.

### Schema Definition

```typescript
// File: domains/guest/schemas/guest.schema.ts

import { z } from 'zod'

/**
 * Guest entity schema
 *
 * Represents an anonymous visitor to a project.
 * Created on first visit, used to associate sessions.
 *
 * Firestore Path: /projects/{projectId}/guests/{guestId}
 *
 * Note: guestId equals authUid for simplicity (one guest record per auth session)
 */
export const guestSchema = z.object({
  /** Document ID (same as authUid) */
  id: z.string().min(1, 'Guest ID is required'),

  /** Project this guest visited */
  projectId: z.string().min(1, 'Project ID is required'),

  /** Firebase anonymous auth UID */
  authUid: z.string().min(1, 'Auth UID is required'),

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),
})

export type Guest = z.infer<typeof guestSchema>

/**
 * Input schema for creating a guest record
 */
export const createGuestInputSchema = z.object({
  projectId: z.string().min(1),
  authUid: z.string().min(1),
})

export type CreateGuestInput = z.infer<typeof createGuestInputSchema>
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| id | Non-empty string | "Guest ID is required" |
| projectId | Non-empty string | "Project ID is required" |
| authUid | Non-empty string | "Auth UID is required" |
| createdAt | Number (Unix ms) | - |

### State Transitions

Guests have no lifecycle states - they are created once and remain until explicitly deleted (outside scope of this feature).

---

## 2. Project Entity (EXISTING)

**Collection Path**: `/projects/{projectId}`

**Purpose**: Contains project metadata including active event reference.

### Schema Definition (Reference)

```typescript
// File: packages/shared/src/entities/project/project.schema.ts (existing)

export const projectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required').max(100),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  status: z.enum(['draft', 'live', 'deleted']),
  type: z.enum(['standard', 'ghost']).default('standard'),
  activeEventId: z.string().nullable(),  // Key field for guest access
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
```

### Guest Access Usage

| Field | Guest Access Relevance |
|-------|----------------------|
| activeEventId | **Critical**: Determines which event to load. Null = Coming Soon page |
| workspaceId | Required to fetch experiences from workspace collection |
| status | Projects with `deleted` status should show 404 |

---

## 3. Event Entity (EXISTING)

**Collection Path**: `/projects/{projectId}/events/{eventId}`

**Purpose**: Contains event configuration including published guest-facing settings.

### Schema Definition (Reference)

```typescript
// File: domains/event/shared/schemas/project-event-full.schema.ts (existing)

export const projectEventFullSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'deleted']),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),

  // Guest-facing configurations
  draftConfig: projectEventConfigSchema.nullable(),
  publishedConfig: projectEventConfigSchema.nullable(),  // Key for guest access

  // Versioning
  draftVersion: z.number(),
  publishedVersion: z.number().nullable(),
  publishedAt: z.number().nullable(),
})
```

### Guest Access Usage

| Field | Guest Access Relevance |
|-------|----------------------|
| publishedConfig | **Critical**: Contains welcome, theme, and experiences config. Null = Coming Soon |
| publishedConfig.welcome | Title, description, media, layout for welcome screen |
| publishedConfig.theme | Colors, fonts for themed components |
| publishedConfig.experiences.main | List of enabled experience references |

---

## 4. Event Config Entity (EXISTING - Embedded)

**Embedded In**: `ProjectEvent.publishedConfig`

**Purpose**: Guest-facing configuration including welcome screen and experiences.

### Relevant Sub-schemas

```typescript
// Welcome configuration
export const welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),  // Hero image
  layout: z.enum(['list', 'grid']).default('list'),
})

// Experience references
export const mainExperienceReferenceSchema = z.object({
  experienceId: z.string().min(1),
  enabled: z.boolean().default(true),  // Filter for display
  applyOverlay: z.boolean().default(true),
})

export const experiencesConfigSchema = z.object({
  main: z.array(mainExperienceReferenceSchema).default([]),
  pregate: experienceReferenceSchema.nullable().default(null),  // E7 scope
  preshare: experienceReferenceSchema.nullable().default(null), // E7 scope
})
```

---

## 5. Experience Entity (EXISTING)

**Collection Path**: `/workspaces/{workspaceId}/experiences/{experienceId}`

**Purpose**: Contains experience definition including name and thumbnail for display.

### Schema Definition (Reference)

```typescript
// File: domains/experience/shared/schemas/experience.schema.ts (existing)

export const experienceSchema = z.looseObject({
  id: z.string(),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'deleted']).default('active'),
  profile: z.enum(['freeform', 'survey', 'story']),
  media: z.object({
    mediaAssetId: z.string().min(1),
    url: z.string().url(),
  }).nullable(),  // Thumbnail for card display
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),
  // ... versioning fields
})
```

### Guest Access Usage

| Field | Guest Access Relevance |
|-------|----------------------|
| name | Displayed on experience card |
| media.url | Thumbnail image for experience card |
| status | Only show `active` experiences |
| published | E7 scope - not used in this feature |

---

## 6. Session Entity (EXISTING)

**Collection Path**: `/projects/{projectId}/sessions/{sessionId}`

**Purpose**: Tracks guest participation in an experience.

### Schema Definition (Reference)

```typescript
// File: domains/session/shared/schemas/session.schema.ts (existing)

export const sessionSchema = z.looseObject({
  id: z.string(),
  projectId: z.string(),
  workspaceId: z.string(),
  eventId: z.string(),
  experienceId: z.string(),
  mode: z.enum(['preview', 'guest']),  // 'guest' for this feature
  configSource: z.enum(['draft', 'published']),  // 'published' for guest
  status: z.enum(['active', 'completed', 'abandoned', 'error']),
  createdBy: z.string().nullable(),  // Auth UID
  createdAt: z.number(),
  updatedAt: z.number(),
  // ... additional fields for E7
})
```

### Create Session Input

```typescript
// For guest experience selection
const createSessionInput = {
  projectId: string,
  workspaceId: string,
  eventId: string,
  experienceId: string,
  mode: 'guest',
  configSource: 'published',
}
```

---

## Data Flow Summary

### Guest Access Flow

```text
1. Guest visits /join/{projectId}
   └── Read: projects/{projectId}
       ├── Not found → 404 page
       ├── No activeEventId → Coming Soon page
       └── Has activeEventId → Continue

2. Load active event
   └── Read: projects/{projectId}/events/{activeEventId}
       ├── Not found → 404 page
       ├── No publishedConfig → Coming Soon page
       └── Has publishedConfig → Continue

3. Anonymous auth + guest record
   ├── signInAnonymously() → Get authUid
   └── Write: projects/{projectId}/guests/{authUid}

4. Load experience details
   └── For each enabled experience in publishedConfig.experiences.main:
       └── Read: workspaces/{workspaceId}/experiences/{experienceId}

5. Display welcome screen with themed components

6. Guest selects experience
   └── Write: projects/{projectId}/sessions/{newId}
       └── Navigate to /join/{projectId}/experience/{experienceId}?session={sessionId}
```

### Collections Accessed

| Collection | Operation | Frequency |
|------------|-----------|-----------|
| `projects/{projectId}` | Read | Once per page load |
| `projects/{projectId}/events/{eventId}` | Read | Once per page load |
| `projects/{projectId}/guests/{guestId}` | Write | Once per auth session |
| `workspaces/{workspaceId}/experiences/{id}` | Read | Per enabled experience |
| `projects/{projectId}/sessions/{id}` | Write | Once per experience selection |

---

## Firestore Security Rules (Required)

The following rules must be in place for guest access:

```javascript
// Guest can read project (for validation)
match /projects/{projectId} {
  allow read: if true;  // Public project info
}

// Guest can read event (for published config)
match /projects/{projectId}/events/{eventId} {
  allow read: if true;  // Public event info
}

// Guest can write own guest record
match /projects/{projectId}/guests/{guestId} {
  allow read, write: if request.auth != null
    && request.auth.uid == guestId;
}

// Guest can read experiences (for card display)
match /workspaces/{workspaceId}/experiences/{experienceId} {
  allow read: if true;  // Public experience info
}

// Guest can create sessions
match /projects/{projectId}/sessions/{sessionId} {
  allow create: if request.auth != null
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.mode == 'guest';
  allow read: if request.auth != null
    && resource.data.createdBy == request.auth.uid;
}
```

> Note: Security rules may need adjustment based on existing rules file. See `firebase/firestore.rules` for current configuration.
