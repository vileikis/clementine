# Tasks: Step List Styling Updates

**Input**: Design documents from `/specs/034-step-list-styling/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Not requested - manual visual testing appropriate for UI styling changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Root**: `apps/clementine-app/`
- **Components**: `src/domains/experience/designer/components/`
- **Utilities**: `src/domains/experience/steps/registry/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared utility function that both US1 and US2 depend on

- [ ] T001 Add `CategoryColorClasses` interface and `getCategoryColorClasses()` utility function in `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts`

**Details for T001**:
```typescript
/**
 * Color classes for step category styling
 */
export interface CategoryColorClasses {
  /** Background class for the icon wrapper */
  wrapper: string
  /** Foreground/text class for the icon */
  icon: string
}

/**
 * Get Tailwind color classes for a step category
 */
export function getCategoryColorClasses(category: StepCategory): CategoryColorClasses {
  const colorMap: Record<StepCategory, CategoryColorClasses> = {
    info: { wrapper: 'bg-muted', icon: 'text-muted-foreground' },
    input: { wrapper: 'bg-info/10', icon: 'text-info' },
    capture: { wrapper: 'bg-success/10', icon: 'text-success' },
    transform: { wrapper: 'bg-destructive/10', icon: 'text-destructive' },
  }
  return colorMap[category]
}
```

**Checkpoint**: Utility function available for use in components

---

## Phase 2: User Story 1 - Visual Category Identification in Step List (Priority: P1) 🎯 MVP

**Goal**: Each step in the step list displays a colored icon wrapper that indicates the step's category

**Independent Test**: View a step list containing multiple step categories and verify each displays the correct colored background behind its icon

### Implementation for User Story 1

- [ ] T002 [US1] Import `getCategoryColorClasses` in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

- [ ] T003 [US1] Add colored icon wrapper around the step icon in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

**Details for T003**:
- Get category from `definition.category`
- Call `getCategoryColorClasses(definition.category)` to get Tailwind classes
- Wrap the existing `<Icon>` in a new `<div>` with classes:
  - `flex h-6 w-6 shrink-0 items-center justify-center rounded-md`
  - Plus the `wrapper` class from `getCategoryColorClasses()`
- Apply the `icon` class to the `<Icon>` component (replaces `text-muted-foreground`)

**Before**:
```tsx
<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
```

**After**:
```tsx
const colorClasses = getCategoryColorClasses(definition.category)
// ...
<div className={cn(
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
  colorClasses.wrapper
)}>
  <Icon className={cn('h-4 w-4', colorClasses.icon)} />
</div>
```

- [ ] T004 [US1] Verify light mode appearance in dev server for all four step categories (info, input, capture, transform)

- [ ] T005 [US1] Verify dark mode appearance by adding `dark` class to `<html>` in DevTools

**Checkpoint**: User Story 1 complete - step list icons have colored wrappers by category

---

## Phase 3: User Story 2 - Visual Category Identification in Add Step Dialog (Priority: P1)

**Goal**: Step type options in the Add Step dialog display colored icon wrappers matching their category

**Independent Test**: Open the Add Step dialog and verify each step type button displays the correct category-colored icon wrapper

### Implementation for User Story 2

- [ ] T006 [US2] Import `getCategoryColorClasses` in `apps/clementine-app/src/domains/experience/designer/components/AddStepDialog.tsx`

- [ ] T007 [US2] Add colored icon wrapper around step type icons in the dialog buttons in `apps/clementine-app/src/domains/experience/designer/components/AddStepDialog.tsx`

**Details for T007**:
- Inside the `steps.map()` loop, get color classes via `getCategoryColorClasses(stepDef.category)`
- Wrap the existing `<Icon>` in a styled div similar to US1:

**Before**:
```tsx
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4 shrink-0" />
  <span className="font-medium">{stepDef.label}</span>
</div>
```

**After**:
```tsx
const colorClasses = getCategoryColorClasses(stepDef.category)
// ...
<div className="flex items-center gap-2">
  <div className={cn(
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
    colorClasses.wrapper
  )}>
    <Icon className={cn('h-4 w-4', colorClasses.icon)} />
  </div>
  <span className="font-medium">{stepDef.label}</span>
</div>
```

- [ ] T008 [US2] Verify Add Step dialog colors match step list colors for all categories

**Checkpoint**: User Story 2 complete - Add Step dialog has matching colored icon wrappers

---

## Phase 4: User Story 3 - Simplified Drag Interaction (Priority: P2)

**Goal**: Users can drag steps to reorder by clicking anywhere on the step item

**Independent Test**: Hover over a step item (verify pointer cursor), then drag it to reorder

### Implementation for User Story 3

- [ ] T009 [US3] Remove the drag handle button (GripVertical) from `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

**Details for T009**:
- Remove the entire drag handle `<button>` element (lines ~100-113 in original file)
- Remove the `GripVertical` import from lucide-react if no longer used elsewhere

- [ ] T010 [US3] Move `{...attributes}` and `{...listeners}` from the removed drag handle to the parent container div in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

**Details for T010**:
- Add `{...attributes}` and `{...listeners}` to the outer `<div ref={setNodeRef}>` element
- This makes the entire element draggable per dnd-kit documentation

**Before**:
```tsx
<div ref={setNodeRef} style={style} role="option" ...>
```

**After**:
```tsx
<div ref={setNodeRef} style={style} {...attributes} {...listeners} role="option" ...>
```

- [ ] T011 [US3] Update cursor classes on the parent container in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

**Details for T011**:
- Add `cursor-pointer` as default cursor
- Add `cursor-grabbing` when `isDragging` is true
- Keep existing `opacity-50` for dragging state
- Respect disabled state with `cursor-default`

```tsx
className={cn(
  'group flex items-center gap-2 rounded-md cursor-pointer',
  'transition-colors duration-150',
  isDragging && 'opacity-50 cursor-grabbing',
  isSelected && 'bg-accent text-accent-foreground',
  !isSelected && 'hover:bg-accent/50',
  disabled && 'cursor-default',
)}
```

- [ ] T012 [US3] Adjust the internal button (onClick handler) to not block drag interaction in `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

**Details for T012**:
- The inner button for selection can remain, but may need `pointer-events-none` during drag if there are issues
- Test that clicking still selects and dragging still reorders

- [ ] T013 [US3] Remove unused `GripVertical` import from `apps/clementine-app/src/domains/experience/designer/components/StepList.tsx` if present

- [ ] T014 [US3] Verify drag-to-reorder works from any point on the step item

- [ ] T015 [US3] Verify cursor changes: pointer on hover, grabbing during drag

**Checkpoint**: User Story 3 complete - full-item drag interaction works

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T016 Run `pnpm app:check` (format + lint fixes) in `apps/clementine-app/`

- [ ] T017 Run `pnpm app:type-check` to verify no TypeScript errors in `apps/clementine-app/`

- [ ] T018 Verify design system compliance - no hard-coded colors, all using theme tokens

- [ ] T019 Test all acceptance scenarios from spec.md:
  - Information step → grey/muted wrapper ✓
  - Input steps → blue/info wrapper ✓
  - Capture step → green/success wrapper ✓
  - Transform step → red/destructive wrapper ✓
  - Dark mode adaptation ✓
  - Drag from anywhere ✓
  - Cursor states ✓

- [ ] T020 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - creates shared utility
- **User Story 1 (Phase 2)**: Depends on Setup (T001)
- **User Story 2 (Phase 3)**: Depends on Setup (T001), can run in parallel with US1
- **User Story 3 (Phase 4)**: No dependencies on US1/US2 - can run in parallel after Setup
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

```
T001 (Setup)
  ├── T002-T005 (US1: Step List Colors) ─┐
  ├── T006-T008 (US2: Dialog Colors) ────┼── All can run in parallel after T001
  └── T009-T015 (US3: Drag Behavior) ────┘
                                          ↓
                                    T016-T020 (Polish)
```

### Parallel Opportunities

**After T001 completes, these can run in parallel:**
- US1 (T002-T005): StepListItem color changes
- US2 (T006-T008): AddStepDialog color changes
- US3 (T009-T015): Drag behavior changes

**Within each user story:**
- US3 T009 and T013 can run in parallel (different files, both removing GripVertical)

---

## Parallel Example: All User Stories After Setup

```bash
# After T001 (Setup) completes, launch all three user stories in parallel:

# Developer A or Parallel Task 1: User Story 1
Task: "T002 [US1] Import getCategoryColorClasses in StepListItem.tsx"
Task: "T003 [US1] Add colored icon wrapper in StepListItem.tsx"

# Developer B or Parallel Task 2: User Story 2
Task: "T006 [US2] Import getCategoryColorClasses in AddStepDialog.tsx"
Task: "T007 [US2] Add colored icon wrapper in AddStepDialog.tsx"

# Developer C or Parallel Task 3: User Story 3
Task: "T009 [US3] Remove drag handle button in StepListItem.tsx"
Task: "T010 [US3] Move attributes/listeners to parent in StepListItem.tsx"
```

**Note**: If working solo on US1 and US3 (both modify StepListItem.tsx), complete US1 first to avoid conflicts, then do US3.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (Setup)
2. Complete T002-T005 (User Story 1)
3. **STOP and VALIDATE**: Verify colored icons work in step list
4. This delivers the core visual value

### Recommended Order (Solo Developer)

1. T001: Setup utility function
2. T002-T005: US1 - Step list colors (core value)
3. T006-T008: US2 - Dialog colors (visual consistency)
4. T009-T015: US3 - Drag behavior (UX enhancement)
5. T016-T020: Polish & validation

### Incremental Delivery

Each user story adds value without breaking previous:
- After US1: Step list has category colors ✓
- After US2: Add dialog matches step list ✓
- After US3: Improved drag UX ✓

---

## Notes

- **No tests included** - manual visual testing per spec.md
- All tasks modify existing files - no new files created except utility function
- US1 and US3 both modify StepListItem.tsx - coordinate or do sequentially
- US2 modifies AddStepDialog.tsx independently
- All color classes use design system tokens - no hard-coded values
- Verify dark mode after each user story
