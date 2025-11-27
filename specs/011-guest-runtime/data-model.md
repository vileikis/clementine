# Data Model: Guest Experience Runtime Engine

**Feature**: 011-guest-runtime
**Date**: 2025-11-27

## Overview

This document defines the data model for the Guest Experience Runtime Engine. The implementation primarily extends the existing Session entity with journey-aware fields, while reusing existing Event, Journey, Step, and Experience entities.

---

## Entity Relationships

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Company   │     │    Event    │     │  Experience │
│             │────<│             │>────│             │
│  (existing) │ 1:N │  (existing) │ N:M │  (existing) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │ 1:N
                          │
                    ┌─────┴─────┐
                    │  Journey  │
                    │ (existing)│
                    └─────┬─────┘
                          │ 1:N
                          │
                    ┌─────┴─────┐
                    │   Step    │
                    │ (existing)│
                    └───────────┘

┌─────────────┐
│   Session   │  ←── EXTENDED for journey support
│  (modified) │
└─────────────┘
```

---

## Session Entity (Extended)

**Firestore Path**: `/events/{eventId}/sessions/{sessionId}`

The Session entity is the primary data structure modified for this feature. It tracks a guest's progress through a journey, storing captured media, form inputs, and AI transformation results.

### Schema Definition

```typescript
/**
 * Guest session state machine states
 */
type SessionState =
  | 'created'       // Session created, journey started
  | 'captured'      // Photo captured and uploaded
  | 'transforming'  // AI processing in progress
  | 'ready'         // Transform complete, result available
  | 'error';        // Error occurred (recoverable)

/**
 * Input value discriminated union for type-safe storage
 */
type StepInputValue =
  | { type: 'text'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'selection'; selectedId: string }
  | { type: 'selections'; selectedIds: string[] }
  | { type: 'photo'; url: string };

/**
 * Dynamic key-value store for step inputs
 */
interface SessionData {
  /** Selected experience from experience-picker step */
  selected_experience_id?: string;

  /** Step inputs keyed by stepId */
  [stepId: string]: StepInputValue | string | undefined;
}

/**
 * Guest session entity
 */
interface Session {
  /** Unique session identifier */
  id: string;

  /** Parent event ID */
  eventId: string;

  /** Current session state */
  state: SessionState;

  // ─── Capture & Transform Fields ───

  /** Firebase Storage path to captured input image */
  inputImagePath?: string;

  /** Full public URL to AI-transformed result image */
  resultImagePath?: string;

  /** Error message if state is 'error' */
  error?: string;

  // ─── Journey Support Fields (NEW) ───

  /** Journey ID this session is progressing through */
  journeyId?: string;

  /** Current step index in journey.stepOrder array */
  currentStepIndex?: number;

  /** Dynamic data store for step inputs */
  data?: SessionData;

  // ─── Timestamps ───

  /** Unix timestamp (ms) when session was created */
  createdAt: number;

  /** Unix timestamp (ms) when session was last updated */
  updatedAt: number;
}
```

### Validation Schema (Zod)

```typescript
// In features/sessions/schemas/sessions.schemas.ts

import { z } from 'zod';

export const sessionStateSchema = z.enum([
  'created',
  'captured',
  'transforming',
  'ready',
  'error',
]);

export const stepInputValueSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('boolean'), value: z.boolean() }),
  z.object({ type: z.literal('number'), value: z.number() }),
  z.object({ type: z.literal('selection'), selectedId: z.string() }),
  z.object({ type: z.literal('selections'), selectedIds: z.array(z.string()) }),
  z.object({ type: z.literal('photo'), url: z.string().url() }),
]);

export const sessionDataSchema = z.object({
  selected_experience_id: z.string().optional(),
}).catchall(stepInputValueSchema.optional());

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  state: sessionStateSchema,
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().url().optional(),
  error: z.string().optional(),
  journeyId: z.string().optional(),
  currentStepIndex: z.number().int().min(0).optional(),
  data: sessionDataSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;
export type SessionState = z.infer<typeof sessionStateSchema>;
export type SessionData = z.infer<typeof sessionDataSchema>;
export type StepInputValue = z.infer<typeof stepInputValueSchema>;
```

### State Transitions

```
┌─────────┐
│ created │◄────────────────────────────────────┐
└────┬────┘                                     │
     │ saveCapture()                            │ retry()
     ▼                                          │
┌──────────┐                                    │
│ captured │                                    │
└────┬─────┘                                    │
     │ triggerTransform()                       │
     ▼                                          │
┌──────────────┐     error                ┌─────┴────┐
│ transforming │────────────────────────► │  error   │
└──────┬───────┘                          └──────────┘
       │ AI complete
       ▼
┌─────────┐
│  ready  │
└─────────┘
```

### Example Documents

**Journey Session (in progress)**:
```json
{
  "id": "sess_abc123",
  "eventId": "evt_xyz789",
  "state": "created",
  "journeyId": "journey_001",
  "currentStepIndex": 2,
  "data": {
    "selected_experience_id": "exp_cartoon",
    "step_name": { "type": "text", "value": "Jane Doe" },
    "step_email": { "type": "text", "value": "jane@example.com" }
  },
  "createdAt": 1701100800000,
  "updatedAt": 1701100850000
}
```

**Completed Session (with AI result)**:
```json
{
  "id": "sess_def456",
  "eventId": "evt_xyz789",
  "state": "ready",
  "journeyId": "journey_001",
  "currentStepIndex": 6,
  "inputImagePath": "captures/evt_xyz789/sess_def456/input.jpg",
  "resultImagePath": "https://storage.googleapis.com/.../result.png",
  "data": {
    "selected_experience_id": "exp_cartoon",
    "step_name": { "type": "text", "value": "John Smith" },
    "step_email": { "type": "text", "value": "john@test.com" },
    "step_rating": { "type": "number", "value": 9 },
    "step_consent": { "type": "boolean", "value": true }
  },
  "createdAt": 1701100800000,
  "updatedAt": 1701101200000
}
```

**Error Session**:
```json
{
  "id": "sess_ghi789",
  "eventId": "evt_xyz789",
  "state": "error",
  "journeyId": "journey_001",
  "currentStepIndex": 4,
  "inputImagePath": "captures/evt_xyz789/sess_ghi789/input.jpg",
  "error": "AI transform failed: timeout after 45s",
  "data": {
    "selected_experience_id": "exp_cartoon"
  },
  "createdAt": 1701100800000,
  "updatedAt": 1701101000000
}
```

---

## Existing Entities (Reference)

The following entities are used by the Guest Runtime but not modified by this feature:

### Event (existing)

**Firestore Path**: `/events/{eventId}`

Relevant fields for guest runtime:
- `id: string` - Event identifier
- `name: string` - Display name
- `status: 'draft' | 'live' | 'archived'` - Event status
- `activeJourneyId?: string` - **Key field**: determines which journey guests experience
- `theme: EventTheme` - Branding configuration (colors, logo, typography)

### Journey (existing)

**Firestore Path**: `/events/{eventId}/journeys/{journeyId}`

Relevant fields:
- `id: string` - Journey identifier
- `eventId: string` - Parent event
- `name: string` - Journey name
- `stepOrder: string[]` - Ordered array of step IDs defining sequence
- `status: 'active' | 'deleted'` - Soft deletion

### Step (existing)

**Firestore Path**: `/events/{eventId}/steps/{stepId}`

Discriminated union by `type` field. All 11 step types defined in `features/steps/types/step.types.ts`.

### Experience (existing)

**Firestore Path**: `/experiences/{experienceId}`

Relevant fields for AI processing:
- `id: string` - Experience identifier
- `aiPhotoConfig?: { enabled, model, prompt, referenceImageUrls, aspectRatio }`
- `captureConfig: { type, countdown, cameraFacing, ... }`

---

## Storage Paths

Firebase Storage structure for session media:

```
captures/
  {eventId}/
    {sessionId}/
      input.jpg          # Guest's captured photo (before transform)

results/
  {eventId}/
    {sessionId}/
      result.png         # AI-transformed output (public URL stored in session)
```

---

## Indexes

No additional Firestore indexes required beyond existing:

```yaml
# Existing index for session queries
- collectionGroup: sessions
  queryScope: COLLECTION
  fields:
    - fieldPath: eventId
      order: ASCENDING
    - fieldPath: createdAt
      order: DESCENDING
```

---

## Migration Notes

No migration required. New fields (`journeyId`, `currentStepIndex`, `data`) are optional and backward-compatible with existing sessions.

Existing sessions without journey fields continue to work with legacy `GuestFlowContainer`.
