# Server Actions Contract: Guest Flow

**Feature**: 026-guest-flow
**Date**: 2024-12-11

## Overview

This document defines the Server Action contracts for the guest flow feature. All actions use the Admin SDK for Firestore writes and follow the existing `ActionResponse<T>` pattern.

---

## Response Types

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
```

---

## Action: createGuestAction

Creates or retrieves a guest record for an authenticated user.

### Signature

```typescript
async function createGuestAction(
  projectId: string,
  authUid: string
): Promise<ActionResponse<Guest>>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Project ID from URL params |
| authUid | string | Firebase Auth anonymous user UID |

### Returns

```typescript
// Success - guest created or existing guest returned
{
  success: true,
  data: {
    id: "abc123...",
    projectId: "proj_xyz",
    authUid: "abc123...",
    createdAt: 1702339200000,
    lastSeenAt: 1702339200000
  }
}

// Error - invalid project
{
  success: false,
  error: {
    code: "PROJECT_NOT_FOUND",
    message: "Project does not exist"
  }
}

// Error - validation failed
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid authUid format"
  }
}
```

### Behavior

1. Validate `projectId` exists and is "live"
2. Check if guest document exists at `/projects/{projectId}/guests/{authUid}`
3. If exists: update `lastSeenAt` and return existing guest
4. If not exists: create new guest record with current timestamp
5. Return guest data

### Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| PROJECT_NOT_FOUND | 404 | Project doesn't exist or not live |
| VALIDATION_ERROR | 400 | Invalid input parameters |
| INTERNAL_ERROR | 500 | Firestore operation failed |

---

## Action: createSessionAction

Creates a new session for a guest starting an experience.

### Signature

```typescript
async function createSessionAction(
  input: CreateSessionInput
): Promise<ActionResponse<Session>>

interface CreateSessionInput {
  projectId: string
  guestId: string
  experienceId: string
  eventId: string
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Project ID |
| guestId | string | Guest ID (Firebase Auth UID) |
| experienceId | string | Experience being started |
| eventId | string | Active event ID |

### Returns

```typescript
// Success
{
  success: true,
  data: {
    id: "sess_abc123",
    projectId: "proj_xyz",
    guestId: "guest_uid",
    experienceId: "exp_123",
    eventId: "evt_456",
    state: "created",
    currentStepIndex: 0,
    data: {},
    createdAt: 1702339200000,
    updatedAt: 1702339200000
  }
}

// Error - experience not found in event
{
  success: false,
  error: {
    code: "EXPERIENCE_NOT_FOUND",
    message: "Experience is not available for this event"
  }
}
```

### Behavior

1. Validate all input fields with Zod schema
2. Verify guest exists in project
3. Verify experience is enabled in event
4. Create session document with:
   - Auto-generated ID
   - State: "created"
   - currentStepIndex: 0
   - data: {}
   - Timestamps
5. Update guest's `lastSeenAt`
6. Return created session

### Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input parameters |
| GUEST_NOT_FOUND | 404 | Guest doesn't exist in project |
| EXPERIENCE_NOT_FOUND | 404 | Experience not enabled in event |
| INTERNAL_ERROR | 500 | Firestore operation failed |

---

## Action: getSessionAction

Retrieves an existing session by ID.

### Signature

```typescript
async function getSessionAction(
  projectId: string,
  sessionId: string
): Promise<ActionResponse<Session | null>>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Project ID |
| sessionId | string | Session ID from URL params |

### Returns

```typescript
// Success - session found
{
  success: true,
  data: { /* Session object */ }
}

// Success - session not found
{
  success: true,
  data: null
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid session ID format"
  }
}
```

### Behavior

1. Validate input parameters
2. Query `/projects/{projectId}/sessions/{sessionId}`
3. Return session if found, null if not

### Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input parameters |
| INTERNAL_ERROR | 500 | Firestore operation failed |

---

## Action: validateSessionOwnershipAction

Validates that a session belongs to the current guest.

### Signature

```typescript
async function validateSessionOwnershipAction(
  projectId: string,
  sessionId: string,
  guestId: string
): Promise<ActionResponse<{ valid: boolean; session: Session | null }>>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Project ID |
| sessionId | string | Session ID to validate |
| guestId | string | Current guest's ID |

### Returns

```typescript
// Success - ownership valid
{
  success: true,
  data: {
    valid: true,
    session: { /* Session object */ }
  }
}

// Success - ownership invalid (different guest)
{
  success: true,
  data: {
    valid: false,
    session: null
  }
}

// Success - session not found
{
  success: true,
  data: {
    valid: false,
    session: null
  }
}
```

### Behavior

1. Fetch session by ID
2. Compare `session.guestId` with provided `guestId`
3. Return validation result

### Use Case

Called when page loads with `?s={sessionId}` to verify the session can be resumed by the current guest. If invalid, caller should create a new session.

---

## File Location

```
web/src/features/guest/actions/guests.actions.ts
```

### Export Pattern

```typescript
// guests.actions.ts
"use server"

export async function createGuestAction(...)
export async function createSessionAction(...)
export async function getSessionAction(...)
export async function validateSessionOwnershipAction(...)

// actions/index.ts
export * from "./guests.actions"
```

---

## Usage Examples

### Creating Guest on Page Load

```typescript
// In client component after auth
useEffect(() => {
  async function initGuest() {
    if (user) {
      const result = await createGuestAction(projectId, user.uid)
      if (result.success) {
        setGuest(result.data)
      }
    }
  }
  initGuest()
}, [user, projectId])
```

### Starting Experience

```typescript
async function handleExperienceClick(experienceId: string) {
  const result = await createSessionAction({
    projectId,
    guestId: guest.id,
    experienceId,
    eventId: event.id,
  })

  if (result.success) {
    router.push(`/join/${projectId}?exp=${experienceId}&s=${result.data.id}`)
  }
}
```

### Validating Session on Resume

```typescript
async function validateAndResumeSession() {
  if (!sessionId || !guest) return

  const result = await validateSessionOwnershipAction(
    projectId,
    sessionId,
    guest.id
  )

  if (result.success && result.data.valid) {
    setSession(result.data.session)
  } else {
    // Create new session
    const newSession = await createSessionAction({ ... })
    router.replace(`/join/${projectId}?exp=${experienceId}&s=${newSession.data.id}`)
  }
}
```
