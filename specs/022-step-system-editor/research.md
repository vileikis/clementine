# Research: Step System & Experience Editor

**Feature**: 022-step-system-editor
**Date**: 2026-01-13
**Status**: Complete

## Research Tasks

### 1. Drag-and-Drop Library for Step Reordering

**Decision**: Use `@dnd-kit/core` and `@dnd-kit/sortable`

**Rationale**:
- Already listed as dependency in codebase (available but not yet used)
- Best-in-class React drag-and-drop library with accessibility support
- `@dnd-kit/sortable` provides out-of-box vertical list reordering
- Supports keyboard navigation (accessibility)
- Works with Radix UI primitives without conflicts

**Alternatives Considered**:
- `react-beautiful-dnd`: Deprecated, no longer maintained by Atlassian
- `react-dnd`: More complex API, requires more boilerplate
- Native HTML5 drag-and-drop: Poor accessibility, inconsistent behavior

**Implementation Pattern**:
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'

// StepList wraps items in DndContext + SortableContext
// StepListItem uses useSortable() hook for drag handles
```

---

### 2. Auto-Save Implementation Pattern

**Decision**: Extend existing `useAutoSave` hook with step-specific logic

**Rationale**:
- Existing hook in `shared/forms/hooks/useAutoSave.ts` provides debounced save
- Already used successfully in WelcomeEditorPage (uses 2000ms debounce)
- Patterns for diff calculation and validation before save established
- 2s debounce aligns with existing WelcomeEditor pattern

**Alternatives Considered**:
- Custom debounce logic: Unnecessary duplication
- Optimistic updates only: Risks data loss on navigation
- Server-side auto-save: Adds complexity, client-first architecture preferred

**Implementation Pattern**:
```tsx
// In ExperienceDesignerPage
const { triggerSave } = useAutoSave({
  form,
  originalValues: experience.draft,
  onUpdate: async (updates) => {
    await updateDraft.mutateAsync({
      experienceId,
      draft: { ...experience.draft, ...updates }
    })
  },
  fieldsToCompare: ['steps'],
  debounceMs: 2000,
})
```

---

### 3. Step Selection with URL Sync

**Decision**: Use TanStack Router search params for step selection state

**Rationale**:
- FR-008 requires URL parameter sync for deep linking
- TanStack Router provides type-safe search params
- Pattern already used in codebase for other selection states
- Enables browser back/forward navigation through steps

**Alternatives Considered**:
- Zustand store only: No deep linking, lost on refresh
- React state only: Same issues as Zustand
- Hash fragment: Less clean than search params

**Implementation Pattern**:
```tsx
// Route definition with search params
export const Route = createFileRoute('/workspace/$workspaceSlug/experiences/$experienceId')({
  validateSearch: z.object({
    step: z.string().optional(),
  }),
})

// Custom hook for selection
function useStepSelection(steps: Step[]) {
  const { step: selectedStepId } = Route.useSearch()
  const navigate = Route.useNavigate()

  const selectStep = (stepId: string | null) => {
    navigate({ search: { step: stepId ?? undefined } })
  }

  const selectedStep = steps.find(s => s.id === selectedStepId) ?? null

  return { selectedStep, selectStep }
}
```

---

### 4. Publish Validation Strategy

**Decision**: Client-side validation using Zod schemas before Firestore write

**Rationale**:
- All step config schemas defined with Zod
- Validation runs before mutation to provide immediate feedback
- Follows constitution principle III (Type-Safe Development)
- Firestore security rules provide secondary validation layer

**Alternatives Considered**:
- Server-side only validation: Slower feedback, requires Cloud Function
- No validation (rely on Firestore rules): Poor UX, no detailed error messages
- Firebase triggers: Async, can't prevent bad writes

**Implementation Pattern**:
```tsx
function validateForPublish(experience: Experience): ValidationResult {
  const errors: ValidationError[] = []

  // Rule 1: At least one step
  if (experience.draft.steps.length === 0) {
    errors.push({ field: 'steps', message: 'At least one step is required' })
  }

  // Rule 2: All steps have valid config
  for (const step of experience.draft.steps) {
    const schema = stepRegistry[step.type].configSchema
    const result = schema.safeParse(step.config)
    if (!result.success) {
      errors.push({
        field: `steps.${step.id}`,
        message: result.error.message
      })
    }
  }

  // Rule 3: Profile constraints
  const allowedTypes = getStepTypesForProfile(experience.profile)
  for (const step of experience.draft.steps) {
    if (!allowedTypes.includes(step.type)) {
      errors.push({
        field: `steps.${step.id}`,
        message: `Step type "${step.type}" not allowed for ${experience.profile} profile`
      })
    }
  }

  return { valid: errors.length === 0, errors }
}
```

---

### 5. Step Config Schema Design

**Decision**: Individual Zod schemas per step type with shared base patterns

**Rationale**:
- Each step type has unique configuration requirements
- Zod enables type inference for TypeScript integration
- Shared patterns (optional media, text limits) can be composed
- Schemas serve as single source of truth for validation and types

**Schema Patterns**:

| Step Type | Required Fields | Optional Fields |
|-----------|-----------------|-----------------|
| info | - | title, description, media |
| input.scale | question | min (default 1), max (default 5), minLabel, maxLabel |
| input.yesNo | question | - |
| input.multiSelect | question, options | minSelect (default 0), maxSelect (default options.length) |
| input.shortText | question | placeholder, maxLength (default 100) |
| input.longText | question | placeholder, maxLength (default 500) |
| capture.photo | - | instructions, countdown, overlay |
| transform.pipeline | - | (no config - "Coming soon") |

**Example Schema**:
```tsx
export const inputScaleConfigSchema = z.object({
  question: z.string().min(1).max(200),
  min: z.number().int().min(0).max(10).default(1),
  max: z.number().int().min(1).max(10).default(5),
  minLabel: z.string().max(50).optional(),
  maxLabel: z.string().max(50).optional(),
})
```

---

### 6. 3-Column Layout Responsive Strategy

**Decision**: Flex layout with collapsible columns on smaller viewports

**Rationale**:
- Desktop: Full 3-column layout (step list | preview | config)
- Tablet: 2-column with tabs or accordion for config
- Mobile: Single column with bottom sheet for config (mobile-first principle)
- Phone-frame preview always visible (core UX requirement)

**Alternatives Considered**:
- Fixed 3-column on all devices: Unusable on mobile
- Drawer-based navigation: More complex, less discoverable
- Separate routes for config: Poor UX, too many navigations

**Implementation Pattern**:
```tsx
// Desktop (lg+): 3 columns
// Tablet (md): Preview + sheet/drawer for config, step list in header
// Mobile (sm): Preview fullscreen, bottom sheet for step list and config

<div className="flex h-full">
  {/* Step List - hidden on mobile, sidebar on tablet+, column on desktop */}
  <aside className="hidden md:block w-64 lg:w-72 border-r">
    <StepList />
  </aside>

  {/* Preview - always visible, centered */}
  <main className="flex-1 min-w-0">
    <StepPreview />
  </main>

  {/* Config Panel - hidden on mobile (use sheet), sidebar on tablet+ */}
  <aside className="hidden lg:block w-80 border-l">
    <StepConfigPanel />
  </aside>
</div>

{/* Mobile: Bottom sheet for step list and config */}
<Sheet className="lg:hidden">
  ...
</Sheet>
```

---

### 7. Step Registry Architecture

**Decision**: Object-based registry with lazy-loaded renderers and config panels

**Rationale**:
- Central registry enables profile filtering, step creation, validation
- Lazy loading prevents large bundle size from loading all renderers upfront
- Registry pattern matches Epic E2 requirements document design

**Implementation Pattern**:
```tsx
interface StepDefinition {
  type: string
  category: StepCategory
  label: string
  icon: LucideIcon
  configSchema: z.ZodSchema
  defaultConfig: () => StepConfig
  // Lazy-loaded components
  EditRenderer: React.LazyExoticComponent<React.ComponentType<StepRendererProps>>
  ConfigPanel: React.LazyExoticComponent<React.ComponentType<StepConfigPanelProps>>
}

const stepRegistry: Record<string, StepDefinition> = {
  'info': {
    type: 'info',
    category: 'info',
    label: 'Information',
    icon: Info,
    configSchema: infoConfigSchema,
    defaultConfig: () => ({ title: '', description: '', media: null }),
    EditRenderer: lazy(() => import('./renderers/InfoStepRenderer')),
    ConfigPanel: lazy(() => import('./config-panels/InfoStepConfigPanel')),
  },
  // ... other step types
}
```

---

## Summary

All technical unknowns have been resolved. The implementation will:

1. **Use @dnd-kit** for accessible drag-and-drop step reordering
2. **Extend useAutoSave** with 2s debounce for draft persistence
3. **Sync selection to URL** via TanStack Router search params
4. **Validate client-side** before publish using Zod schemas
5. **Define individual schemas** per step type with sensible defaults
6. **Responsive 3-column layout** with mobile-first bottom sheets
7. **Object-based registry** with lazy-loaded components

No blocking unknowns remain. Ready for Phase 1: Design & Contracts.
