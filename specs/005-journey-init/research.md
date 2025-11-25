# Research: Journey Init

**Feature**: 005-journey-init
**Date**: 2024-11-25

## Overview

This document consolidates research findings for the Journey Init feature. Since the technical context is well-established (following existing feature module patterns), this research focuses on design decisions and best practices.

## Research Topics

### 1. Feature Module Pattern

**Decision**: Follow existing feature module structure from `companies` and `events` features.

**Rationale**:
- Consistent codebase organization
- Established patterns for schemas, repositories, actions, and components
- Proven type-safe approach with Zod validation
- ActionResponse pattern already in use

**Alternatives Considered**:
- Inline schemas in actions → Rejected: violates DRY, harder to maintain
- Separate schemas in `web/src/lib/schemas/` → Rejected: constitution says feature-specific schemas belong in feature modules

**Pattern Summary**:
```
features/{name}/
├── actions/        # Server Actions with "use server"
├── components/     # React components
├── repositories/   # Firestore operations
├── schemas/        # Zod schemas
├── types/          # TypeScript interfaces
├── constants.ts    # Validation constraints
└── index.ts        # Barrel exports
```

### 2. Soft Delete Pattern

**Decision**: Use status-based soft delete identical to companies feature.

**Rationale**:
- Data recovery possible if needed
- Maintains referential integrity
- Consistent with existing codebase
- Simpler than implementing hard delete with cascade logic

**Implementation**:
```typescript
interface Journey {
  status: "active" | "deleted";
  deletedAt: number | null;
  // ... other fields
}

// Delete operation
await db.collection("journeys").doc(journeyId).update({
  status: "deleted",
  deletedAt: Date.now(),
  updatedAt: Date.now()
});
```

**Alternatives Considered**:
- Hard delete with `doc.delete()` → Rejected: no data recovery, requires cascade logic for related data
- Separate archive collection → Rejected: over-engineering for current needs

### 3. Switchboard Pattern for Active Journey

**Decision**: Reuse existing `updateEventSwitchboardAction` from events feature.

**Rationale**:
- Already implemented and tested
- Ensures only one journey active per event
- Atomic update on event document
- No new code needed

**Implementation**:
```typescript
// From features/events/actions/events.ts
export async function updateEventSwitchboardAction(
  eventId: string,
  activeJourneyId: string | null
): Promise<ActionResponse<void>>
```

**Alternatives Considered**:
- Store active flag on Journey document → Rejected: requires transaction to ensure only one active, race condition risk
- New dedicated action → Rejected: duplicates existing functionality

### 4. Toast Notifications

**Decision**: Use shadcn/ui toast component for feedback.

**Rationale**:
- Already configured in the project
- Consistent UX pattern
- Non-blocking feedback
- Accessible

**Messages**:
- Create success: "Journey created" (implicit via redirect)
- Activate: "Journey activated"
- Deactivate: "Journey deactivated"
- Delete success: "Journey deleted"
- Error: Display error message from ActionResponse

### 5. Navigation and Redirect Pattern

**Decision**: Use Next.js `redirect()` after journey creation.

**Rationale**:
- Server-side redirect is cleaner than client-side router.push
- Ensures page is rendered with fresh data
- Follows existing patterns in the codebase

**Implementation**:
```typescript
// In CreateJourneyDialog, after successful creation:
// redirect(`/events/${eventId}/journeys/${journeyId}`)
```

**Note**: Since redirect throws, it should be called outside try-catch in Server Action, or use client-side router.push with revalidation.

### 6. List Sorting

**Decision**: Sort by `createdAt` descending (newest first).

**Rationale**:
- Most recently created journeys are likely most relevant
- Consistent with user expectations for content lists
- Simple Firestore query with orderBy

**Query**:
```typescript
db.collection("journeys")
  .where("eventId", "==", eventId)
  .where("status", "==", "active")
  .orderBy("createdAt", "desc")
  .get()
```

### 7. Component Architecture

**Decision**: Client Components for interactive UI, Server Components for pages.

**Rationale**:
- Pages can fetch data server-side (faster initial load)
- Interactive components (dialogs, toggles) need client-side state
- Follows Next.js 16 best practices

**Pattern**:
```typescript
// page.tsx (Server Component)
export default async function JourneysPage({ params }) {
  const journeys = await listJourneys(params.eventId);
  const event = await getEvent(params.eventId);
  return <JourneyList journeys={journeys} event={event} />;
}

// JourneyList.tsx (Client Component)
"use client";
export function JourneyList({ journeys, event }) {
  // Interactive state management
}
```

## Dependencies

### Existing Code to Reuse

| Component | Source | Purpose |
|-----------|--------|---------|
| `updateEventSwitchboardAction` | `features/events/actions/events.ts` | Set active journey |
| `getEvent` | `features/events/repositories/events.ts` | Validate event exists |
| `verifyAdminSecret` | `@/lib/auth` | Authentication check |
| `db` | `@/lib/firebase/admin` | Firestore Admin SDK |
| ActionResponse pattern | `features/experiences/actions/types.ts` | Consistent error handling |
| Toast | `@/components/ui/toast` | User feedback |
| Dialog, Button, Input, Switch, Card | `@/components/ui/*` | UI components |

### New Code Required

| Component | Purpose |
|-----------|---------|
| Journey types | TypeScript interfaces |
| Journey schemas | Zod validation |
| Journey repository | Firestore CRUD |
| Journey actions | Server Actions |
| JourneyCard | Display component |
| JourneyList | List with empty state |
| CreateJourneyDialog | Form dialog |
| DeleteJourneyDialog | Confirmation dialog |
| Journey routes | App Router pages |

## Conclusion

No technical blockers identified. All decisions align with established patterns and constitution principles. Ready to proceed with Phase 1 design artifacts.
