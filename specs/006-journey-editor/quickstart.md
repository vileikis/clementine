# Quickstart: Journey Editor Development

**Feature**: Journey Editor
**Branch**: `006-journey-editor`
**Date**: 2025-11-26

## Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase project configured
- Access to existing event and journey data

---

## Getting Started

### 1. Switch to Feature Branch

```bash
git checkout 006-journey-editor
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Ensure `.env.local` has Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_PRIVATE_KEY=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
ADMIN_SECRET=...
```

### 4. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000

---

## Development Workflow

### Access Journey Editor

Navigate to an existing event's journey:

```
http://localhost:3000/events/{eventId}/design/journeys/{journeyId}
```

**Test Event ID**: Check Firestore console for existing events.

### Create Test Data

If no journeys exist, create one via the existing journeys list page:

```
http://localhost:3000/events/{eventId}/design/journeys
```

---

## Key Files to Implement

### Phase 1: Steps Module

```
web/src/features/steps/
├── types/step.types.ts      # Step type definitions
├── schemas/step.schemas.ts  # Zod validation schemas
├── repositories/steps.repository.ts
├── actions/steps.ts         # Server actions
└── constants.ts
```

### Phase 2: Simulator

```
web/src/features/simulator/
├── components/SimulatorScreen.tsx
└── components/steps/        # 11 step renderers
```

### Phase 3: Journey Editor UI

```
web/src/features/journeys/components/editor/
├── JourneyEditor.tsx        # Main 3-panel layout
├── StepList.tsx             # Left panel
├── StepPreview.tsx          # Middle panel
├── StepEditor.tsx           # Right panel
└── step-editors/            # 11 form editors
```

---

## Testing

### Run Tests

```bash
cd web
pnpm test
```

### Run Specific Test File

```bash
pnpm test step.schemas.test.ts
```

### Watch Mode

```bash
pnpm test --watch
```

---

## Validation Loop

Before committing, run the validation loop:

```bash
pnpm lint && pnpm type-check && pnpm test
```

---

## Existing Patterns to Reference

### Drag-and-Drop

See: `web/src/legacy-features/experiences/components/survey/SurveyStepList.tsx`

```typescript
import { DndContext, closestCenter, ... } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
```

### Form Management

See: `web/src/legacy-features/experiences/components/survey/SurveyStepEditor.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
```

### Server Actions

See: `web/src/features/journeys/actions/journeys.ts`

```typescript
"use server";
import { verifyAdminSecret } from "@/lib/auth/verify-admin";
import { revalidatePath } from "next/cache";
```

### Event Theme

See: `web/src/features/events/types/event.types.ts`

```typescript
export interface EventTheme {
  logoUrl?: string | null;
  primaryColor: string;
  text: { color: string; alignment: "left" | "center" | "right" };
  button: { backgroundColor?: string | null; textColor: string; radius: "none" | "sm" | "md" | "full" };
  background: { color: string; image?: string | null; overlayOpacity: number };
}
```

---

## Common Tasks

### Add a New Step Type Editor

1. Add type to `step.types.ts`
2. Add schema to `step.schemas.ts`
3. Add simulator component in `simulator/components/steps/`
4. Add editor form in `journeys/components/editor/step-editors/`
5. Update `StepEditor.tsx` switch statement
6. Update `StepTypeSelector.tsx` with icon and description

### Debug Real-Time Updates

Check Firestore subscription:

```typescript
useEffect(() => {
  console.log("Steps updated:", steps);
}, [steps]);
```

### Test Theme Application

Use the event's theme editor first:
```
http://localhost:3000/events/{eventId}/design
```

---

## Troubleshooting

### "Step not found" after creation

- Check `journey.stepOrder` includes the new step ID
- Verify step document exists in `/events/{eventId}/steps/{stepId}`

### Preview not updating

- Ensure `watch()` is called on the form
- Check component is using the watched values, not stale props

### Drag-drop not working on mobile

- Verify `PointerSensor` is configured with appropriate activation distance
- Test with touch events enabled in devtools

### Type errors with step config

- Ensure using discriminated union properly
- Check that type narrowing is happening before accessing config

---

## Useful Commands

```bash
# Type check only
pnpm type-check

# Lint with auto-fix
pnpm lint --fix

# Build for production
pnpm build

# Check bundle size
cd web && npx next build --analyze
```
