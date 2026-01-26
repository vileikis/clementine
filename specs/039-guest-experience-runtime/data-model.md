# Data Model: Guest Experience Runtime

**Feature**: 039-guest-experience-runtime
**Date**: 2026-01-23
**Status**: Complete

## Overview

This document describes the data model extensions required for the guest experience runtime with pregate and preshare flows.

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Guest Journey Data Model                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Guest (per project visitor)                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ id: string (= authUid)                                        │  │
│  │ projectId: string                                             │  │
│  │ authUid: string                                               │  │
│  │ createdAt: number                                             │  │
│  │ completedExperiences: CompletedExperience[] ← NEW             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              │ 1:many                               │
│                              ▼                                      │
│  Session (per experience execution)                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ id: string                                                    │  │
│  │ projectId: string                                             │  │
│  │ workspaceId: string                                           │  │
│  │ eventId: string | null                                        │  │
│  │ experienceId: string                                          │  │
│  │ mode: 'preview' | 'guest'                                     │  │
│  │ configSource: 'draft' | 'published'                           │  │
│  │ status: 'active' | 'completed' | 'abandoned' | 'error'        │  │
│  │ answers: Answer[]                                             │  │
│  │ capturedMedia: CapturedMedia[]                                │  │
│  │ resultMedia: SessionResultMedia | null                        │  │
│  │ jobId: string | null                                          │  │
│  │ jobStatus: JobStatus | null                                   │  │
│  │ mainSessionId: string | null ← NEW (for pregate/preshare)     │  │
│  │ createdBy: string | null                                      │  │
│  │ createdAt: number                                             │  │
│  │ updatedAt: number                                             │  │
│  │ completedAt: number | null                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Schema Extensions

### Session Schema (packages/shared)

**File**: `packages/shared/src/schemas/session/session.schema.ts`

**New Field**:

```typescript
/**
 * Session Schema - mainSessionId extension
 *
 * For PREGATE and PRESHARE sessions: links to the main session
 * Main sessions do not use this field (they ARE the main session)
 *
 * Linking Flow:
 * 1. Pregate session created → mainSessionId: null
 * 2. Main session created → if pregate exists, update pregate: mainSessionId = main.id
 * 3. Preshare session created → mainSessionId from URL param (main session ID)
 *
 * Query: where mainSessionId == "main-456" returns all related sessions
 */
export const sessionSchema = z.looseObject({
  // ... existing fields ...

  /**
   * JOURNEY LINKING
   * For pregate/preshare sessions: references the main session ID
   * For main sessions: null (they are the anchor)
   */
  mainSessionId: z.string().nullable().default(null),

  // ... rest of existing fields ...
})
```

**Type Update**:
```typescript
export type Session = z.infer<typeof sessionSchema>
// Session type now includes mainSessionId: string | null
```

### Guest Schema (app domain)

**File**: `apps/clementine-app/src/domains/guest/schemas/guest.schema.ts`

**New Types**:

```typescript
/**
 * Completed Experience Entry
 *
 * Tracks when a guest completed an experience.
 * Used for pregate/preshare skip logic and analytics.
 */
export const completedExperienceSchema = z.object({
  /** Experience ID that was completed */
  experienceId: z.string().min(1, 'Experience ID is required'),

  /** Completion timestamp (Unix ms) */
  completedAt: z.number(),

  /** Session ID for analytics linking */
  sessionId: z.string().min(1, 'Session ID is required'),
})

export type CompletedExperience = z.infer<typeof completedExperienceSchema>
```

**Extended Guest Schema**:

```typescript
/**
 * Guest entity schema
 *
 * Represents an anonymous visitor to a project.
 * Extended with completedExperiences for pregate/preshare skip logic.
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

  /**
   * Track completed experiences for skip logic
   * Used to determine if guest should skip pregate/preshare
   */
  completedExperiences: z.array(completedExperienceSchema).default([]),
})

export type Guest = z.infer<typeof guestSchema>
```

## Existing Schemas (No Changes)

### Experience Reference (already exists)

**File**: `packages/shared/src/schemas/event/experiences.schema.ts`

```typescript
export const experienceReferenceSchema = z.object({
  experienceId: z.string().min(1, 'Experience ID is required'),
  enabled: z.boolean().default(true),
})

export const experiencesConfigSchema = z.object({
  main: z.array(mainExperienceReferenceSchema).default([]),
  pregate: experienceReferenceSchema.nullable().default(null),
  preshare: experienceReferenceSchema.nullable().default(null),
})
```

### Answer Schema (existing)

```typescript
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  answeredAt: z.number(),
})
```

### CapturedMedia Schema (existing)

```typescript
export const capturedMediaSchema = z.object({
  stepId: z.string(),
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})
```

## Firestore Paths

| Entity | Path | Notes |
|--------|------|-------|
| Guest | `/projects/{projectId}/guests/{guestId}` | guestId = authUid |
| Session | `/projects/{projectId}/sessions/{sessionId}` | One per experience execution |
| Experience | `/workspaces/{workspaceId}/experiences/{experienceId}` | Referenced by ID |
| Job | `/projects/{projectId}/jobs/{jobId}` | Transform job tracking |

## Data Flow by Phase

### Phase: Welcome → Pregate

```
1. Guest selects experience from WelcomeScreen
2. Check: publishedConfig.experiences.pregate?.enabled
3. Check: guest.completedExperiences.some(e => e.experienceId === pregate.experienceId)
4. If pregate needed → navigate to /pregate?experience=selectedExperienceId
```

### Phase: Pregate → Main

```
1. Pregate route creates session (experienceId = pregate.experienceId)
   - mainSessionId: null (will be updated later)
2. Guest completes pregate steps
3. On completion:
   - Update guest.completedExperiences.push({ experienceId, completedAt, sessionId })
   - Navigate to /experience/{selectedExperienceId}?pregate={pregateSessionId} (replace)
```

### Phase: Main Experience

```
1. Main route creates session (experienceId from URL param)
2. If pregate param exists:
   - Update pregate session: mainSessionId = newMainSessionId
3. Guest completes main experience steps
4. On completion:
   - Update guest.completedExperiences
   - If experience has transform config → trigger startTransformPipeline
   - Check preshare requirement → navigate accordingly (replace)
```

### Phase: Main → Preshare

```
1. Check: publishedConfig.experiences.preshare?.enabled
2. Check: guest.completedExperiences.some(e => e.experienceId === preshare.experienceId)
3. If preshare needed → navigate to /preshare?session=mainSessionId (replace)
4. Preshare route creates session:
   - experienceId = preshare.experienceId
   - mainSessionId = from URL param
```

### Phase: Preshare → Share

```
1. Guest completes preshare steps
2. On completion:
   - Update guest.completedExperiences
   - Navigate to /share?session=mainSessionId (replace)
```

## Query Patterns

### Check Pregate Needed

```typescript
const needsPregate = (
  guest: Guest,
  config: ExperiencesConfig
): boolean => {
  const pregate = config.pregate
  if (!pregate?.enabled) return false

  return !guest.completedExperiences.some(
    e => e.experienceId === pregate.experienceId
  )
}
```

### Check Preshare Needed

```typescript
const needsPreshare = (
  guest: Guest,
  config: ExperiencesConfig
): boolean => {
  const preshare = config.preshare
  if (!preshare?.enabled) return false

  return !guest.completedExperiences.some(
    e => e.experienceId === preshare.experienceId
  )
}
```

### Get Journey Sessions

```typescript
// Find all sessions linked to a main session
const journeySessions = await getDocs(
  query(
    collection(firestore, 'projects', projectId, 'sessions'),
    where('mainSessionId', '==', mainSessionId)
  )
)
// Returns: pregate session, preshare session (if they exist)
// Note: Main session itself has mainSessionId = null
```

### Get Guest Journey

```typescript
// Get all sessions for a guest's experience completion
const guestJourneys = guest.completedExperiences.map(e => ({
  experienceId: e.experienceId,
  sessionId: e.sessionId,
  completedAt: new Date(e.completedAt),
}))
```

## Validation Rules

### Session Creation

| Field | Validation |
|-------|------------|
| `mainSessionId` | Must be null for main sessions, valid session ID for pregate/preshare |
| `experienceId` | Must reference existing experience |
| `projectId` | Must match authenticated context |

### Guest Update

| Field | Validation |
|-------|------------|
| `completedExperiences[].experienceId` | Must be non-empty string |
| `completedExperiences[].sessionId` | Must reference existing session |
| `completedExperiences[].completedAt` | Must be valid Unix timestamp |

## State Transitions

### Session Status

```
active → completed (on last step completion)
active → abandoned (on timeout or explicit abandon)
active → error (on system error)
```

### Guest Completion Flow

```
[] → [{ pregate }] → [{ pregate }, { main }] → [{ pregate }, { main }, { preshare }]
```

## Indexes Required

No new Firestore indexes required. The `mainSessionId` query uses a simple equality filter on a single field.

Existing indexes already support:
- Session queries by projectId
- Session queries by experienceId
- Guest queries by projectId
