# Quickstart: Journey Init

**Feature**: 005-journey-init
**Date**: 2024-11-25

## Prerequisites

- Node.js 18+ and pnpm installed
- Firebase project configured with Firestore
- Environment variables set up (see `web/.env.local.example`)
- Development server can be started with `pnpm dev`

## Implementation Order

Follow this order to implement the feature incrementally:

### Phase 1: Data Layer (Foundation)

1. **Constants** - `web/src/features/journeys/constants.ts`
   - Define `JOURNEY_CONSTRAINTS` with name length limits

2. **Types** - `web/src/features/journeys/types/journeys.types.ts`
   - Define `JourneyStatus` type
   - Define `Journey` interface

3. **Schemas** - `web/src/features/journeys/schemas/journeys.schemas.ts`
   - Create `journeyStatusSchema`
   - Create `journeySchema` for document validation
   - Create `createJourneyInput` for action input validation

4. **Repository** - `web/src/features/journeys/repositories/journeys.repository.ts`
   - Implement `createJourney()`
   - Implement `listJourneys()`
   - Implement `getJourney()`
   - Implement `deleteJourney()` (soft delete)

### Phase 2: Server Actions

5. **Types** - `web/src/features/journeys/actions/types.ts`
   - Define `ActionResponse` type (or reuse from experiences)
   - Define `ErrorCodes`

6. **Actions** - `web/src/features/journeys/actions/journeys.ts`
   - Implement `createJourneyAction()`
   - Implement `listJourneysAction()`
   - Implement `getJourneyAction()`
   - Implement `deleteJourneyAction()`

### Phase 3: UI Components

7. **JourneyCard** - `web/src/features/journeys/components/JourneyCard.tsx`
   - Display journey name, step count, created date
   - Active toggle switch
   - Delete button
   - Click to navigate

8. **JourneyList** - `web/src/features/journeys/components/JourneyList.tsx`
   - Empty state with CTA
   - Map journeys to JourneyCard
   - Handle toggle active action

9. **CreateJourneyDialog** - `web/src/features/journeys/components/CreateJourneyDialog.tsx`
   - Form with name input
   - Validation error display
   - Submit handler with redirect

10. **DeleteJourneyDialog** - `web/src/features/journeys/components/DeleteJourneyDialog.tsx`
    - Confirmation message
    - Cancel and Delete buttons

### Phase 4: Routes

11. **List Page** - `web/src/app/events/[eventId]/journeys/page.tsx`
    - Fetch journeys and event data
    - Render JourneyList with CreateJourneyDialog

12. **Detail Page** - `web/src/app/events/[eventId]/journeys/[journeyId]/page.tsx`
    - Fetch journey data
    - Display name and "Work in Progress" message
    - Back navigation

### Phase 5: Barrel Exports

13. **Index files** - Create barrel exports for each directory
    - `actions/index.ts` - Type exports only
    - `components/index.ts`
    - `repositories/index.ts`
    - `schemas/index.ts`
    - `types/index.ts`
    - `index.ts` - Main feature export

## Quick Test Checklist

After each phase, verify:

### Phase 1: Data Layer
```bash
# Type check
pnpm type-check
```

### Phase 2: Server Actions
```typescript
// Test in development console or temporary route
import { createJourneyAction, listJourneysAction } from "@/features/journeys/actions/journeys";

// Create
const result = await createJourneyAction({ eventId: "test-event", name: "Test Journey" });
console.log(result);

// List
const list = await listJourneysAction("test-event");
console.log(list);
```

### Phase 3-4: UI Components
1. Navigate to `/events/{eventId}/journeys`
2. Verify empty state shows
3. Create a journey
4. Verify redirect to detail page
5. Navigate back to list
6. Toggle active status
7. Delete journey

## Key Files Reference

| File | Purpose |
|------|---------|
| `features/journeys/constants.ts` | Validation constraints |
| `features/journeys/types/journeys.types.ts` | TypeScript interfaces |
| `features/journeys/schemas/journeys.schemas.ts` | Zod validation |
| `features/journeys/repositories/journeys.repository.ts` | Firestore CRUD |
| `features/journeys/actions/journeys.ts` | Server Actions |
| `features/journeys/components/JourneyList.tsx` | List component |
| `features/journeys/components/JourneyCard.tsx` | Card component |
| `features/journeys/components/CreateJourneyDialog.tsx` | Create form |
| `features/journeys/components/DeleteJourneyDialog.tsx` | Delete confirm |
| `app/events/[eventId]/journeys/page.tsx` | List route |
| `app/events/[eventId]/journeys/[journeyId]/page.tsx` | Detail route |

## Dependencies to Import

```typescript
// Firebase Admin SDK
import { db } from "@/lib/firebase/admin";

// Authentication
import { verifyAdminSecret } from "@/lib/auth";

// Next.js
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Existing features
import { getEvent } from "@/features/events/repositories/events";
import { updateEventSwitchboardAction } from "@/features/events/actions/events";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
```

## Validation Loop

Before marking feature complete:

```bash
# Run all checks
pnpm lint
pnpm type-check
pnpm test

# Manual testing
pnpm dev
# Test all user flows in browser
```
