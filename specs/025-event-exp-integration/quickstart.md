# Quickstart: Event-Experience Integration

**Feature**: 025-event-exp-integration
**Date**: 2026-01-14

## Overview

This guide provides a quick reference for implementing the event-experience integration feature. Use this alongside the detailed plan and data model documents.

---

## Key Files to Create

### 1. Schema (First Priority)

```
apps/clementine-app/src/domains/event/experiences/schemas/event-experiences.schema.ts
```

Defines `experienceReferenceSchema`, `mainExperienceReferenceSchema`, and `experiencesConfigSchema`.

**Update** `project-event-config.schema.ts` to add `experiences` field.

### 2. Hooks (with colocated tests)

```
apps/clementine-app/src/domains/event/experiences/hooks/
├── useExperiencesForSlot.ts         # Direct Firestore queries with real-time updates
├── useExperiencesForSlot.test.ts    # Colocated test
├── useUpdateEventExperiences.ts     # Uses Firestore transaction
└── useUpdateEventExperiences.test.ts # Colocated test
```

### 3. Components

```
apps/clementine-app/src/domains/event/experiences/components/
├── ExperienceSlotManager.tsx    # Main orchestrator
├── ExperienceSlotItem.tsx       # Individual item in slot
├── ConnectExperienceDrawer.tsx  # Selection drawer
├── ExperienceCard.tsx           # Preview card
└── index.ts                     # Barrel exports
```

### 4. Integration Points

```
apps/clementine-app/src/domains/event/welcome/components/WelcomeConfigPanel.tsx  # Add experiences section
apps/clementine-app/src/domains/event/settings/containers/EventSettingsPage.tsx  # Add Guest Flow section
```

---

## Implementation Order

```
1. Schema Definition
   └── event-experiences.schema.ts
   └── Update project-event-config.schema.ts

2. Data Layer
   └── useExperiencesForSlot.ts
   └── useUpdateEventExperiences.ts

3. UI Components (Bottom-up)
   └── ExperienceCard.tsx
   └── ExperienceSlotItem.tsx
   └── ConnectExperienceDrawer.tsx
   └── ExperienceSlotManager.tsx

4. Integration
   └── WelcomeConfigPanel.tsx
   └── EventSettingsPage.tsx

5. Preview
   └── Update WelcomePreview.tsx
```

---

## Code Snippets

### Schema Extension

```typescript
// In project-event-config.schema.ts
import { experiencesConfigSchema } from '@/domains/event/experiences'

export const projectEventConfigSchema = z.looseObject({
  // ... existing fields ...
  experiences: experiencesConfigSchema.nullable().default(null),
})
```

### Using ExperienceSlotManager

```tsx
// In WelcomeConfigPanel.tsx
import { ExperienceSlotManager } from '@/domains/event/experiences'

<EditorSection title="Experiences">
  <ExperienceSlotManager
    mode="list"
    slot="main"
    workspaceId={workspaceId}
    workspaceSlug={workspaceSlug}
    experiences={draftConfig.experiences?.main ?? []}
    onUpdate={(main) => updateExperiences({ main })}
  />
</EditorSection>
```

### Using ConnectExperienceDrawer

```tsx
import { Sheet, SheetContent } from '@/ui-kit/ui/sheet'

const [drawerOpen, setDrawerOpen] = useState(false)

<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
  <SheetContent side="right">
    <ConnectExperienceDrawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      slot="main"
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      assignedExperienceIds={assignedIds}
      onSelect={handleSelectExperience}
    />
  </SheetContent>
</Sheet>
```

### Drag-and-Drop Setup

```tsx
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensors, useSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
)

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={items.map(i => i.experienceId)} strategy={verticalListSortingStrategy}>
    {/* Sortable items */}
  </SortableContext>
</DndContext>
```

---

## Profile Filtering Reference

```typescript
const SLOT_PROFILES = {
  main: ['freeform', 'survey'],
  pregate: ['survey', 'story'],
  preshare: ['survey', 'story'],
} as const
```

---

## Testing Commands

```bash
# Run all tests
pnpm app:test

# Run specific test file
pnpm app:test -- event-experiences.schema.test.ts

# Type check
pnpm app:type-check

# Lint and format
pnpm app:check
```

---

## Key Patterns to Follow

### 1. Schema with Defaults

```typescript
export const experienceReferenceSchema = z.object({
  experienceId: z.string().min(1),
  enabled: z.boolean().default(true),
})
```

### 2. Nullable Optional Fields

```typescript
// Firestore-safe pattern
pregate: experienceReferenceSchema.nullable().default(null),
```

### 3. Firestore IN Query for Slot Filtering

```typescript
// useExperiencesForSlot uses direct Firestore query with IN operator
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'

const q = query(
  collection(firestore, `workspaces/${workspaceId}/experiences`),
  where('status', '==', 'active'),
  where('profile', 'in', SLOT_PROFILES[slot]), // ['freeform', 'survey'] or ['survey', 'story']
  orderBy('createdAt', 'desc')
)

// Real-time updates via onSnapshot
const unsubscribe = onSnapshot(q, (snapshot) => {
  const experiences = snapshot.docs.map(doc => convertFirestoreDoc(doc, experienceSchema))
  queryClient.setQueryData(['experiences', 'slot', workspaceId, slot], experiences)
})
```

### 4. Firestore Transactions for Atomic Updates

```typescript
// useUpdateEventExperiences uses transaction for atomic updates
import { runTransaction, doc } from 'firebase/firestore'

await runTransaction(firestore, async (transaction) => {
  const eventDoc = await transaction.get(eventRef)
  const currentExperiences = eventDoc.data().draftConfig.experiences ?? defaultExperiences

  transaction.update(eventRef, {
    'draftConfig.experiences': { ...currentExperiences, ...input },
    updatedAt: Date.now(),
  })
})
```

### 5. Debounced Search (UI concern, in ConnectExperienceDrawer)

```typescript
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearch = useDebouncedValue(searchQuery, 300)

// Applied in component, not in hook
const searchFiltered = useMemo(() =>
  experiences.filter(exp =>
    exp.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ),
  [experiences, debouncedSearch]
)
```

### 6. Open in New Tab

```typescript
window.open(`/workspace/${workspaceSlug}/experiences/${experienceId}`, '_blank')
```

---

## Common Gotchas

1. **Firestore undefined**: Always use `.nullable().default(null)` not optional
2. **Array order**: Preserve order when updating - use immutable array operations
3. **Touch targets**: Minimum 44x44px for all interactive elements
4. **Debounce**: 300ms for search, 2000ms for auto-save
5. **Profile badge**: Reuse from `@/domains/experience/library/components/ProfileBadge`
6. **Transaction pattern**: Always read current state inside transaction, then merge
7. **Colocated tests**: Put `*.test.ts` next to implementation file, not in separate folder

---

## Related Documentation

- [Plan](./plan.md) - Implementation plan
- [Data Model](./data-model.md) - Schema definitions
- [Contracts](./contracts/components.md) - Component interfaces
- [Spec](./spec.md) - Feature specification
