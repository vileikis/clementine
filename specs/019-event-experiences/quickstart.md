# Quickstart Guide: Event Experiences & Extras

**Feature Branch**: `019-event-experiences`
**Date**: 2024-12-04

## Overview

This guide provides step-by-step implementation order for the Event Experiences & Extras feature. Follow this sequence to ensure dependencies are satisfied.

---

## Prerequisites

Before starting implementation:

1. **Branch Setup**: Ensure you're on the `019-event-experiences` branch
2. **Dependencies**: Run `pnpm install` from repo root
3. **Dev Server**: Verify `pnpm dev` runs without errors
4. **Existing Files**: Familiarize yourself with:
   - `web/src/features/events/` - Event feature module
   - `web/src/features/experiences/` - Experience feature module
   - `web/src/components/ui/sheet.tsx` - Drawer component

---

## Implementation Phases

### Phase 1: Data Layer (Types, Schemas, Constants)

**Goal**: Establish the data model foundation

**Order**:

1. **Update Types** (`web/src/features/events/types/event.types.ts`)
   - Add `ExtraSlotFrequency` type
   - Update `EventExperienceLink` interface (add `enabled`, `frequency`)
   - Add `EventExtras` interface
   - Update `Event` interface (add `extras` field)

2. **Update Schemas** (`web/src/features/events/schemas/events.schemas.ts`)
   - Add `extraSlotFrequencySchema`
   - Update `eventExperienceLinkSchema`
   - Add `eventExtrasSchema`
   - Update `eventSchema`
   - Add input schemas for server actions

3. **Update Constants** (`web/src/features/events/constants.ts`)
   - Add `EXTRA_SLOTS` constant with slot metadata
   - Add `EXTRA_FREQUENCIES` constant with frequency options
   - Add `DEFAULT_EVENT_EXTRAS` constant

**Validation**: Run `pnpm type-check` - should pass with no errors

---

### Phase 2: Repository Layer

**Goal**: Add Firestore operations for experiences and extras

**Order**:

1. **Update Repository** (`web/src/features/events/repositories/events.repository.ts`)
   - Update `createEvent` to include default extras
   - Add `addEventExperience` function
   - Add `updateEventExperience` function
   - Add `removeEventExperience` function
   - Add `setEventExtra` function
   - Add `updateEventExtra` function
   - Add `removeEventExtra` function

**Validation**: Run `pnpm type-check` - should pass

---

### Phase 3: Server Actions

**Goal**: Create authenticated endpoints for UI

**Order**:

1. **Add Actions** (`web/src/features/events/actions/events.actions.ts`)
   - Add `addEventExperienceAction`
   - Add `updateEventExperienceAction`
   - Add `removeEventExperienceAction`
   - Add `setEventExtraAction`
   - Add `updateEventExtraAction`
   - Add `removeEventExtraAction`

2. **Update Barrel Export** (`web/src/features/events/actions/index.ts`)
   - Export new actions

**Validation**: Run `pnpm type-check` and `pnpm lint` - should pass

---

### Phase 4: Hooks

**Goal**: Add data fetching hook for resolving experience details

**Order**:

1. **Verify existing `useExperiences` hook** (`web/src/features/experiences/hooks/useExperiences.ts`)
   - Already provides real-time subscription to company's active experiences
   - Returns `{ experiences, loading, error }`
   - **No changes needed** - reuse as-is for experience picker

2. **Create `useExperienceDetails` hook** (`web/src/features/experiences/hooks/useExperienceDetails.ts`)
   - Batch fetch experience details by array of IDs
   - Returns `{ experiencesMap, loading, error }`
   - Place in **experiences module** (queries `/experiences` collection, uses `Experience` type)

3. **Update Barrel Export** (`web/src/features/experiences/hooks/index.ts`)
   - Export new `useExperienceDetails` hook

4. **Update Feature Export** (`web/src/features/experiences/index.ts`)
   - Ensure `useExperienceDetails` is exported from feature

**Validation**: Run `pnpm type-check` - should pass

---

### Phase 5: UI Components - Experiences Section

**Goal**: Build the experiences management UI

**Order**:

1. **Create Directory Structure**:
   ```
   web/src/features/events/components/general/
   └── index.ts
   ```

2. **Create `ExperiencesSection`** (`components/general/ExperiencesSection.tsx`)
   - Section container with header and subtitle
   - Grid layout for cards
   - Pass event data and handlers

3. **Create `AddExperienceCard`** (`components/general/AddExperienceCard.tsx`)
   - Plus icon card
   - Opens picker drawer on click

4. **Create `EventExperienceCard`** (`components/general/EventExperienceCard.tsx`)
   - Display experience name (resolved from Experience data)
   - Enable/disable toggle
   - Click to open edit drawer
   - Muted styling when disabled

5. **Create `ExperiencePickerDrawer`** (`components/general/ExperiencePickerDrawer.tsx`)
   - Uses Sheet component
   - List view of company experiences (uses `useExperiences` from experiences module)
   - Detail view on selection
   - Label input field
   - Add button

6. **Create `EventExperienceDrawer`** (`components/general/EventExperienceDrawer.tsx`)
   - Uses Sheet component
   - Display experience info
   - Edit label field
   - "Open in Editor" link
   - Remove button with confirmation

7. **Update Barrel Export** (`components/general/index.ts`)

**Validation**: Run `pnpm type-check` and `pnpm lint` - should pass

---

### Phase 6: UI Components - Extras Section

**Goal**: Build the extras slots management UI

**Order**:

1. **Create `ExtrasSection`** (`components/general/ExtrasSection.tsx`)
   - Section container with header and subtitle
   - Vertical stack of slot cards

2. **Create `ExtraSlotCard`** (`components/general/ExtraSlotCard.tsx`)
   - Slot header with info tooltip
   - Empty state with "+" button
   - Filled state with experience name, frequency badge, toggle, remove

3. **Create `ExtraSlotDrawer`** (`components/general/ExtraSlotDrawer.tsx`)
   - Uses Sheet component
   - Experience selector (uses `useExperiences` from experiences module)
   - Label input field
   - Frequency radio buttons
   - "Open in Editor" link
   - Remove button with confirmation

4. **Update Barrel Export** (`components/general/index.ts`)

**Validation**: Run `pnpm type-check` and `pnpm lint` - should pass

---

### Phase 7: Main Tab Component

**Goal**: Assemble the General tab

**Order**:

1. **Create `EventGeneralTab`** (`components/EventGeneralTab.tsx`)
   - Main container component (same level as other tab components)
   - Renders ExperiencesSection and ExtrasSection from `general/`
   - Manages drawer state
   - Uses `useExperiences` for picker, `useExperienceDetails` for display
   - Passes event data and handlers

2. **Update Barrel Exports** (`components/index.ts`)
   - Export `EventGeneralTab`

**Validation**: Run `pnpm type-check` and `pnpm lint` - should pass

---

### Phase 8: Route Integration

**Goal**: Wire up the route and navigation

**Order**:

1. **Create Route Page** (`web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/general/page.tsx`)
   - Server component
   - Render EventGeneralTab

2. **Update Tab Navigation** (`web/src/features/events/components/EventDetailsHeader.tsx`)
   - Change tab name from "Experiences" to "General"
   - Update tab href from `/experiences` to `/general`

3. **Remove Old Route** (`web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/`)
   - Delete the directory (or keep as redirect)

4. **Delete Old Component** (`web/src/features/events/components/EventExperiencesTab.tsx`)
   - Remove placeholder component

**Validation**:
- Run `pnpm type-check` and `pnpm lint`
- Run `pnpm dev` and navigate to event General tab
- Verify tab renders correctly

---

### Phase 9: Testing & Polish

**Goal**: Ensure quality and handle edge cases

**Order**:

1. **Manual Testing Checklist**:
   - [ ] Add experience from picker
   - [ ] Toggle experience enabled/disabled
   - [ ] Edit experience label
   - [ ] Remove experience with confirmation
   - [ ] Add extra to empty slot
   - [ ] Toggle extra enabled/disabled
   - [ ] Edit extra label and frequency
   - [ ] Remove extra from slot
   - [ ] Test on mobile viewport (320px)
   - [ ] Test empty states (no experiences in library)

2. **Unit Tests** (optional, for critical paths):
   - Server action validation tests
   - Zod schema tests

3. **Visual Polish**:
   - Verify responsive behavior
   - Check touch target sizes (44x44px min)
   - Confirm disabled state styling

**Validation**: Run full validation loop:
```bash
pnpm lint && pnpm type-check && pnpm test
```

---

## File Reference

### Files to Create

```
web/src/features/experiences/
└── hooks/
    └── useExperienceDetails.ts    # New hook for batch fetching by IDs

web/src/features/events/
└── components/
    ├── EventGeneralTab.tsx        # Main tab component
    └── general/
        ├── index.ts
        ├── ExperiencesSection.tsx
        ├── AddExperienceCard.tsx
        ├── EventExperienceCard.tsx
        ├── ExperiencePickerDrawer.tsx
        ├── EventExperienceDrawer.tsx
        ├── ExtrasSection.tsx
        ├── ExtraSlotCard.tsx
        └── ExtraSlotDrawer.tsx

web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/
└── general/
    └── page.tsx
```

### Files to Modify

```
web/src/features/experiences/
├── hooks/index.ts                 # Export useExperienceDetails
└── index.ts                       # Export new hook from feature

web/src/features/events/
├── types/event.types.ts           # Add new types
├── schemas/events.schemas.ts      # Add new schemas
├── constants.ts                   # Add new constants
├── repositories/events.repository.ts  # Add new functions
├── actions/events.actions.ts      # Add new actions
├── components/index.ts            # Export new components
└── components/EventDetailsHeader.tsx  # Rename tab
```

### Files to Delete

```
web/src/features/events/components/EventExperiencesTab.tsx
web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx
```

---

## Common Patterns

### Server Action Pattern

```typescript
export async function addEventExperienceAction(
  input: AddEventExperienceInput
): Promise<ActionResponse<{ eventId: string }>> {
  // 1. Auth check
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: { code: "PERMISSION_DENIED", message: auth.error } };
  }

  try {
    // 2. Validate input
    const validated = addEventExperienceInputSchema.parse(input);

    // 3. Business logic & repository call
    const event = await getEvent(validated.projectId, validated.eventId);
    if (!event) {
      return { success: false, error: { code: "EVENT_NOT_FOUND", message: "Event not found" } };
    }

    await addEventExperience(validated.projectId, validated.eventId, {
      experienceId: validated.experienceId,
      label: validated.label ?? null,
      enabled: true,
      frequency: null,
    });

    // 4. Revalidate cache
    revalidatePath(`/[companySlug]/${validated.projectId}/${validated.eventId}`);

    // 5. Return success
    return { success: true, data: { eventId: validated.eventId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } };
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } };
  }
}
```

### Hook Pattern (useExperienceDetails - new hook)

```typescript
// web/src/features/experiences/hooks/useExperienceDetails.ts
"use client";

import { useReducer, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Experience } from "../types";

interface State {
  experiencesMap: Map<string, Experience>;
  loading: boolean;
  error: Error | null;
}

export function useExperienceDetails(experienceIds: string[]): State {
  const [state, dispatch] = useReducer(reducer, {
    experiencesMap: new Map(),
    loading: experienceIds.length > 0,
    error: null,
  });

  useEffect(() => {
    if (experienceIds.length === 0) {
      dispatch({ type: "RESET" });
      return;
    }

    dispatch({ type: "LOADING" });

    // Batch fetch experiences by IDs
    const fetchExperiences = async () => {
      try {
        const results = await Promise.all(
          experienceIds.map(async (id) => {
            const docRef = doc(db, "experiences", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              return { id, ...docSnap.data() } as Experience;
            }
            return null;
          })
        );

        const map = new Map<string, Experience>();
        results.forEach((exp) => {
          if (exp) map.set(exp.id, exp);
        });

        dispatch({ type: "SUCCESS", experiencesMap: map });
      } catch (err) {
        dispatch({ type: "ERROR", error: err as Error });
      }
    };

    fetchExperiences();
  }, [experienceIds.join(",")]); // Re-fetch when IDs change

  return state;
}
```

### Drawer Component Pattern

```typescript
interface ExperiencePickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  existingExperienceIds: string[];
  onAdd: (experienceId: string, label?: string) => Promise<void>;
}

export function ExperiencePickerDrawer({
  open,
  onOpenChange,
  companyId,
  existingExperienceIds,
  onAdd,
}: ExperiencePickerDrawerProps) {
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reuse existing hook from experiences module
  const { experiences, loading } = useExperiences(companyId);

  // Filter out already-attached experiences
  const availableExperiences = experiences.filter(
    (exp) => !existingExperienceIds.includes(exp.id)
  );

  const handleAdd = async () => {
    if (!selectedExperience) return;
    setIsSubmitting(true);
    await onAdd(selectedExperience.id, label || undefined);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {/* ... drawer content ... */}
      </SheetContent>
    </Sheet>
  );
}
```

---

## Troubleshooting

### Common Issues

1. **TypeScript errors after updating types**
   - Run `pnpm type-check` to see all affected files
   - Update Zod schemas to match types
   - Ensure default values are provided

2. **Firebase permission errors**
   - Verify server actions use Admin SDK
   - Check `verifyAdminSecret()` is called first
   - Confirm environment variables are set

3. **Drawer not opening**
   - Check `open` and `onOpenChange` props are passed correctly
   - Verify Sheet component is imported from `@/components/ui/sheet`

4. **Experience data not showing**
   - Check `useExperiences` hook is receiving correct companyId
   - Verify Firestore query filters are correct
   - Check console for Firestore errors

5. **Toggle not working**
   - Ensure `updateEventExperienceAction` is being called
   - Check optimistic update logic
   - Verify real-time hook is updating state
