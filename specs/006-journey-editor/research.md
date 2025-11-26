# Research: Journey Editor

**Feature**: Journey Editor
**Branch**: `006-journey-editor`
**Date**: 2025-11-26

## Overview

This document captures technology decisions, best practices research, and patterns for the Journey Editor implementation.

---

## 1. Drag-and-Drop Library

### Decision: @dnd-kit

**Rationale**: Already used in legacy `SurveyStepList.tsx` with proven patterns. Provides:
- Touch-friendly interactions with configurable sensors
- Accessible keyboard support
- Optimistic reordering with collision detection
- Works well with React 19

**Alternatives Considered**:
| Library | Pros | Cons | Why Rejected |
|---------|------|------|--------------|
| react-beautiful-dnd | Simple API, great UX | Unmaintained, React 18+ issues | No React 19 support, deprecated |
| dnd-kit | Active, accessible, modular | Slightly more setup | ✅ Selected |
| @hello-pangea/dnd | Fork of rbd, maintained | Less customizable | Not as flexible for custom sensors |

**Implementation Pattern** (from `SurveyStepList.tsx`):
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

---

## 2. Form Management

### Decision: react-hook-form + @hookform/resolvers/zod

**Rationale**: Already used extensively in `SurveyStepEditor.tsx` and `ExperienceEditor.tsx`. Provides:
- Performant re-renders (uncontrolled inputs)
- Built-in validation via Zod resolver
- Watch functionality for real-time preview updates
- Auto-save on blur pattern established

**Alternatives Considered**:
| Library | Pros | Cons | Why Rejected |
|---------|------|------|--------------|
| Formik | Familiar, widely used | Larger bundle, controlled inputs | Performance concerns |
| react-hook-form | ✅ Selected | Learning curve | Already in use |
| Native forms | No dependencies | Manual validation, more code | Too much boilerplate |

**Implementation Pattern**:
```typescript
const form = useForm<StepFormData>({
  resolver: zodResolver(stepSchema),
  defaultValues: step,
});

// Auto-save on blur
const handleBlur = async () => {
  const valid = await form.trigger();
  if (valid) await onSave(form.getValues());
};
```

---

## 3. Step Type Architecture

### Decision: Discriminated Union with Type-Specific Config

**Rationale**: Follows pattern from `experiences.schemas.ts` for type-safe step handling. TypeScript enforces correct config shape per step type.

**Pattern**:
```typescript
// Base interface shared by all steps
interface StepBase {
  id: string;
  eventId: string;
  journeyId: string;
  type: StepType;
  title?: string;
  description?: string;
  mediaUrl?: string;
  ctaLabel?: string;
}

// Type-specific extensions
interface StepInfo extends StepBase {
  type: "info";
  // No additional config
}

interface StepMultipleChoice extends StepBase {
  type: "multiple_choice";
  config: {
    variable: string;
    options: { label: string; value: string }[];
    allowMultiple: boolean;
    required: boolean;
  };
}

// Discriminated union
type Step = StepInfo | StepMultipleChoice | StepCapture | ...;
```

**Zod Pattern** (from `experiences.schemas.ts`):
```typescript
const stepSchema = z.discriminatedUnion("type", [
  infoStepSchema,
  multipleChoiceStepSchema,
  captureStepSchema,
  // ... all 11 types
]);
```

---

## 4. Real-Time Preview Updates

### Decision: React Context + Watch + Debounced Updates

**Rationale**:
- `watch()` from react-hook-form enables live preview without form submission
- Context (EventThemeProvider) provides theme to all step renderers
- Debouncing prevents excessive re-renders during typing

**Implementation Pattern**:
```typescript
// In StepEditor
const formValues = watch(); // Re-renders on any field change

// Pass to preview
<StepPreview step={{ ...step, ...formValues }} />
```

**Performance Consideration**: Preview component should be memoized to only re-render on actual value changes:
```typescript
const StepPreview = memo(({ step }: { step: Step }) => {
  // Render preview
}, (prev, next) => isEqual(prev.step, next.step));
```

---

## 5. URL Query Param Sync

### Decision: Next.js useSearchParams + useRouter

**Rationale**: Native Next.js 16 App Router solution. Enables:
- Deep linking to specific steps
- Browser back/forward navigation
- Shareable URLs

**Implementation Pattern**:
```typescript
function useSelectedStep(steps: Step[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const stepId = searchParams.get("stepId");
  const selectedStep = steps.find(s => s.id === stepId) ?? steps[0];

  const setSelectedStep = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("stepId", id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  return { selectedStep, setSelectedStep };
}
```

---

## 6. Firebase Firestore Structure

### Decision: Steps as Subcollection of Events

**Rationale**: Per data-model-v4.md and existing patterns:
- `/events/{eventId}/steps/{stepId}` - Step documents
- `/events/{eventId}/journeys/{journeyId}` - Journey with `stepOrder: string[]`

**Query Pattern**:
```typescript
// Get all steps for an event
const stepsRef = collection(db, "events", eventId, "steps");
const snapshot = await getDocs(stepsRef);

// Get ordered steps for a journey
const journey = await getDoc(doc(db, "events", eventId, "journeys", journeyId));
const stepOrder = journey.data().stepOrder;
const steps = await Promise.all(stepOrder.map(id => getDoc(doc(stepsRef, id))));
```

**Real-time Subscription**:
```typescript
// Client SDK for live updates
const unsubscribe = onSnapshot(
  collection(db, "events", eventId, "steps"),
  (snapshot) => {
    const steps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSteps(sortByJourneyOrder(steps, journey.stepOrder));
  }
);
```

---

## 7. Step Reordering Strategy

### Decision: Optimistic UI + Server Validation

**Rationale**: Provides instant feedback while ensuring data integrity.

**Pattern** (from `SurveyStepList.tsx`):
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  // 1. Optimistic update
  const oldOrder = [...stepOrder];
  const newOrder = arrayMove(oldOrder, oldIndex, newIndex);
  setLocalSteps(reorderSteps(steps, newOrder));

  // 2. Server update
  try {
    await updateJourneyStepOrder(journeyId, newOrder);
  } catch (error) {
    // 3. Rollback on failure
    setLocalSteps(reorderSteps(steps, oldOrder));
    toast.error("Failed to reorder steps");
  }
};
```

---

## 8. Simulator Architecture

### Decision: Composition-Based with Theme Context

**Rationale**: Separates display-only previews from interactive guest components.

**Architecture**:
```
EventThemeProvider (context)
└── SimulatorScreen (theme-aware wrapper)
    └── {StepType}Step (read-only renderer)
        └── step-primitives (shared visual blocks)
```

**Theme Provider Pattern**:
```typescript
const EventThemeContext = createContext<EventThemeContextValue | null>(null);

interface EventThemeContextValue {
  theme: EventTheme;
  // Computed conveniences
  buttonBgColor: string;
  buttonTextColor: string;
  buttonRadius: string;
}
```

**SimulatorScreen Pattern**:
```typescript
function SimulatorScreen({ children }: { children: ReactNode }) {
  const { theme } = useEventTheme();

  return (
    <div
      className="aspect-9/16 rounded-lg overflow-hidden relative"
      style={{
        backgroundColor: theme.background.color,
        backgroundImage: theme.background.image ? `url(${theme.background.image})` : undefined,
        fontFamily: theme.fontFamily || undefined,
        color: theme.text.color,
        textAlign: theme.text.alignment,
      }}
    >
      {theme.background.image && theme.background.overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: theme.background.overlayOpacity }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
```

---

## 9. Responsive Layout Strategy

### Decision: CSS Grid + Tailwind Breakpoints

**Rationale**: Mobile-first stacking that progressively enhances to 3-panel layout.

**Breakpoints** (per constitution):
- Mobile (default): Vertical stack - list, preview, config
- Tablet (md: 768px+): 2 columns - list | (preview + config stacked)
- Desktop (lg: 1024px+): 3 columns - list | preview | config

**Implementation**:
```typescript
<div className="flex flex-col lg:flex-row h-full">
  {/* Left Panel - Step List */}
  <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r">
    <StepList />
  </aside>

  {/* Main Content */}
  <div className="flex-1 flex flex-col md:flex-row">
    {/* Middle Panel - Preview */}
    <div className="flex-1 p-4">
      <StepPreview />
    </div>

    {/* Right Panel - Config */}
    <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l">
      <StepEditor />
    </aside>
  </div>
</div>
```

---

## 10. Step Type Categories

### Decision: 4 Categories per PRD

**Categories for Add Step Dialog**:

| Category | Step Types | Icons |
|----------|-----------|-------|
| **Navigation** | `info`, `experience-picker` | `Layout`, `Grid` |
| **Capture** | `capture` | `Camera` |
| **Input** | `short_text`, `long_text`, `multiple_choice`, `yes_no`, `opinion_scale`, `email` | `Type`, `AlignLeft`, `List`, `ToggleLeft`, `Gauge`, `Mail` |
| **Completion** | `processing`, `reward` | `Loader`, `Gift` |

**Implementation**:
```typescript
const STEP_TYPE_CATEGORIES = [
  {
    name: "Navigation",
    types: [
      { type: "info", label: "Info", icon: Layout, description: "Welcome or message screen" },
      { type: "experience-picker", label: "Experience Picker", icon: Grid, description: "Choose an AI experience" },
    ],
  },
  // ... other categories
] as const;
```

---

## 11. Testing Strategy

### Decision: Critical Path Focus

**Priority Tests**:
1. Step CRUD operations (unit tests for server actions)
2. Step reordering (integration test for drag-drop + server)
3. Zod schema validation (unit tests for all 11 step types)
4. URL query param sync (hook test)

**Co-located Test Files**:
```text
features/steps/
├── actions/
│   ├── steps.ts
│   └── steps.test.ts
├── schemas/
│   ├── step.schemas.ts
│   └── step.schemas.test.ts
```

---

## Summary of Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| Drag-Drop | @dnd-kit | Already in codebase, touch-friendly |
| Forms | react-hook-form + zod | Performance, existing patterns |
| Step Types | Discriminated union | Type-safe, exhaustive checks |
| Preview Updates | watch() + memo | Real-time without re-renders |
| URL Sync | useSearchParams | Native Next.js, deep linking |
| Firestore | Subcollections | Per data-model-v4 |
| Reordering | Optimistic UI | Instant feedback, rollback on error |
| Simulator | Composition + context | Separation of concerns |
| Layout | CSS Grid + breakpoints | Mobile-first progressive |
| Testing | Critical paths only | Jest, co-located files |
