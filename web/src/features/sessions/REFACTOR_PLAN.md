# Sessions Feature Module - Refactor Plan

**Created:** 2024-11-27
**Priority:** HIGH
**Approach:** Incremental - preserve existing, add minimal new fields

---

## Overview

This is an **incremental refactor** that:
- ✅ Preserves existing Session schema and state values
- ✅ Keeps current Firestore subcollection path
- ✅ Fixes module structure to match standards
- ✅ Adds only minimal new fields for journey support

---

## Phase 1: Directory Structure

**Goal:** Reorganize files into compliant structure.

### Task 1.1: Create new folders

```bash
mkdir -p web/src/features/sessions/{actions,repositories,schemas}
```

### Task 1.2: Move and rename files

| From | To |
|------|-----|
| `lib/actions.ts` | `actions/sessions.actions.ts` |
| `lib/repository.ts` | `repositories/sessions.repository.ts` |
| `lib/repository.test.ts` | `repositories/sessions.repository.test.ts` |
| `lib/validation.ts` | `schemas/sessions.schemas.ts` |
| `types/session.types.ts` | `types/sessions.types.ts` |

### Task 1.3: Create barrel exports

**`actions/index.ts`:**
```typescript
export * from './sessions.actions';
```

**`repositories/index.ts`:**
```typescript
export * from './sessions.repository';
```

**`schemas/index.ts`:**
```typescript
export * from './sessions.schemas';
```

**`types/index.ts`:**
```typescript
export * from './sessions.types';
```

### Task 1.4: Update internal imports

Update imports in moved files:
- `sessions.actions.ts`: Change `"./repository"` → `"../repositories"`
- `sessions.actions.ts`: Change `"../types/session.types"` → `"../types"`
- `sessions.repository.ts`: Change `"../types/session.types"` → `"../types"`
- `sessions.repository.ts`: Change `"./validation"` → `"../schemas"`

### Task 1.5: Fix public API (index.ts)

```typescript
// ============================================================================
// Types - Safe (compile-time only)
// ============================================================================
export type {
  Session,
  SessionState,
  SessionData,
} from './types';

// ============================================================================
// Server Actions - NOT EXPORTED
// Import directly: @/features/sessions/actions
// ============================================================================

// ============================================================================
// Repository - NOT EXPORTED
// Import directly: @/features/sessions/repositories
// ============================================================================
```

### Task 1.6: Delete `lib/` folder

After verifying all imports work, remove the empty `lib/` folder.

---

## Phase 2: Data Model Extension

**Goal:** Add minimal new fields for journey support while preserving existing schema.

### Task 2.1: Update types (`types/sessions.types.ts`)

```typescript
// Session types - PRESERVED from existing implementation
// Extended with journey support fields

export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";

// NEW: Dynamic data store for step inputs
export interface SessionData {
  selected_experience_id?: string;
  [key: string]: any;
}

export interface Session {
  id: string;
  eventId: string;

  state: SessionState;

  // Capture/transform fields (existing)
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;

  // NEW: Journey support
  journeyId?: string;
  currentStepIndex?: number;
  data?: SessionData;

  // Timestamps (existing)
  createdAt: number;
  updatedAt: number;
}
```

### Task 2.2: Update schema (`schemas/sessions.schemas.ts`)

```typescript
import { z } from "zod";

const sessionStateSchema = z.enum([
  "created",
  "captured",
  "transforming",
  "ready",
  "error",
]);

// NEW: Schema for dynamic step data
const sessionDataSchema = z.object({
  selected_experience_id: z.string().optional(),
}).passthrough(); // Allow additional keys

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  state: sessionStateSchema,
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().optional(),
  error: z.string().optional(),

  // NEW: Journey support
  journeyId: z.string().optional(),
  currentStepIndex: z.number().int().min(0).optional(),
  data: sessionDataSchema.optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
```

---

## Phase 3: Repository Updates

**Goal:** Add functions for journey-based session operations.

### Task 3.1: Add new repository functions

Add to `repositories/sessions.repository.ts`:

```typescript
// NEW: Start session with journey context
export async function startJourneySession(
  eventId: string,
  journeyId: string
): Promise<string> {
  const eventDoc = await db.collection("events").doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error("Event not found");
  }

  const sessionRef = db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc();

  const now = Date.now();
  const session: Session = {
    id: sessionRef.id,
    eventId,
    journeyId,
    currentStepIndex: 0,
    data: {},
    state: "created",
    createdAt: now,
    updatedAt: now,
  };

  await sessionRef.set(session);
  return sessionRef.id;
}

// NEW: Update step index
export async function updateStepIndex(
  eventId: string,
  sessionId: string,
  stepIndex: number
): Promise<void> {
  await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      currentStepIndex: stepIndex,
      updatedAt: Date.now(),
    });
}

// NEW: Save step data
export async function saveStepData(
  eventId: string,
  sessionId: string,
  key: string,
  value: unknown
): Promise<void> {
  await db
    .collection("events")
    .doc(eventId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      [`data.${key}`]: value,
      updatedAt: Date.now(),
    });
}
```

---

## Phase 4: Actions Updates

**Goal:** Add server actions for journey-based flows.

### Task 4.1: Add new actions

Add to `actions/sessions.actions.ts`:

```typescript
// NEW: Start journey session
export async function startJourneySessionAction(
  eventId: string,
  journeyId: string
) {
  const sessionId = await startJourneySession(eventId, journeyId);
  return { sessionId };
}

// NEW: Advance to next step
export async function advanceStepAction(
  eventId: string,
  sessionId: string,
  nextIndex: number
) {
  await updateStepIndex(eventId, sessionId, nextIndex);
  revalidatePath(`/join/${eventId}`);
  return { success: true };
}

// NEW: Save data from a step
export async function saveStepDataAction(
  eventId: string,
  sessionId: string,
  key: string,
  value: unknown
) {
  await saveStepData(eventId, sessionId, key, value);
  return { success: true };
}
```

---

## Phase 5: Update Tests

**Goal:** Update tests for new structure and functions.

### Task 5.1: Update repository tests

- Rename file as part of Phase 1
- Add tests for new functions (`startJourneySession`, `updateStepIndex`, `saveStepData`)

### Task 5.2: Add action tests (optional)

Create `actions/sessions.actions.test.ts` if needed.

---

## Phase 6: Verification

**Goal:** Ensure everything works.

### Task 6.1: Run checks

```bash
pnpm type-check
pnpm lint
```

### Task 6.2: Update any external imports

Search codebase for imports from old paths and update:
- `@/features/sessions/lib/actions` → `@/features/sessions/actions`
- `@/features/sessions/lib/repository` → `@/features/sessions/repositories`
- `@/features/sessions` (for actions) → `@/features/sessions/actions`

---

## Implementation Checklist

| Task | Status |
|------|--------|
| Create new folders | ⬜ |
| Move/rename files | ⬜ |
| Create barrel exports | ⬜ |
| Update internal imports | ⬜ |
| Fix index.ts public API | ⬜ |
| Delete lib/ folder | ⬜ |
| Update types with new fields | ⬜ |
| Update schema with new fields | ⬜ |
| Add new repository functions | ⬜ |
| Add new actions | ⬜ |
| Update tests | ⬜ |
| Run type-check | ⬜ |
| Run lint | ⬜ |
| Update external imports | ⬜ |

---

## What's NOT Changing

- ✅ SessionState enum values (`created`, `captured`, `transforming`, `ready`, `error`)
- ✅ Firestore path (`/events/{eventId}/sessions/{sessionId}`)
- ✅ Existing fields (`inputImagePath`, `resultImagePath`, `error`, timestamps)
- ✅ Existing actions (`startSessionAction`, `saveCaptureAction`, `getSessionAction`, `triggerTransformAction`)
- ✅ Existing repository functions

---

## Success Criteria

- [ ] All files follow `[domain].[purpose].[ext]` naming
- [ ] No `lib/` folder exists
- [ ] index.ts only exports types
- [ ] New journey fields added to Session type
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
