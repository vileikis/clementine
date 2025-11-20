# Research: Survey Experience

**Date**: 2025-11-20  
**Feature**: Survey Experience Type  
**Purpose**: Technical research to inform implementation decisions

---

## Research Topics

### 1. Drag-and-Drop Libraries for React 19

**Decision**: Use `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop reordering

**Rationale**:
- **React 19 Compatible**: Modern library with full React 19 support (no legacy dependencies)
- **Accessibility**: Built-in keyboard navigation (WCAG 2.1 AA compliant)
- **Touch Support**: Works seamlessly on mobile devices with touch gestures
- **Lightweight**: ~10KB gzipped (modular, tree-shakeable)
- **Flexible API**: Provides both low-level (`@dnd-kit/core`) and high-level (`@dnd-kit/sortable`) abstractions
- **Performance**: Uses CSS transforms for smooth 60fps animations
- **Active Maintenance**: Well-maintained with frequent updates

**Alternatives Considered**:
- **react-beautiful-dnd**: Not compatible with React 18+ (deprecated by Atlassian)
- **react-dnd**: More complex API, heavier bundle size (~25KB), primarily designed for complex drop zones
- **Native HTML Drag & Drop API**: Poor mobile support, accessibility issues, inconsistent browser behavior

**Implementation Pattern**:
```typescript
// SurveyStepList.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

function SurveyStepList({ steps, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Call Server Action to update stepsOrder
      reorderStepsAction(eventId, experienceId, active.id, over.id);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={steps} strategy={verticalListSortingStrategy}>
        {steps.map((step) => (
          <SortableStepItem key={step.id} step={step} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

### 2. Form State Management with Zod Validation

**Decision**: Use React Hook Form v7+ with Zod resolver for form state and validation

**Rationale**:
- **Type-Safe**: Direct integration with Zod schemas via `@hookform/resolvers/zod`
- **Performance**: Uncontrolled components with minimal re-renders
- **DX**: Simple API (`register`, `handleSubmit`, `formState`)
- **Built-in Validation**: Client-side validation with real-time feedback
- **Small Bundle**: ~9KB gzipped
- **Server-Side Complement**: Client validation + Server Action validation (defense in depth)

**Alternatives Considered**:
- **Formik**: Larger bundle (~13KB), older API, less TypeScript-friendly
- **Uncontrolled Forms (plain React)**: More boilerplate, manual validation logic
- **Controlled Forms (useState)**: Excessive re-renders for large forms

**Implementation Pattern**:
```typescript
// SurveyStepEditor.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepBaseSchema } from '@/lib/schemas/survey';

function SurveyStepEditor({ step, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(stepBaseSchema),
    defaultValues: step,
  });

  const onSubmit = async (data) => {
    // Server Action with Zod validation
    const result = await updateSurveyStepAction(stepId, data);
    if (result.success) {
      onSave(result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      {/* ... */}
    </form>
  );
}
```

---

### 3. Real-Time Firestore Subscriptions Pattern

**Decision**: Use Firebase Client SDK `onSnapshot` with React hooks for real-time updates

**Rationale**:
- **Instant Updates**: Changes reflect immediately across all connected clients
- **Optimistic UI**: Fast feedback while Server Actions process in background
- **Scalable**: Firebase handles subscription management and connection pooling
- **Battery Efficient**: WebSocket connections with automatic reconnection
- **Consistent with Existing Patterns**: Aligns with current Clementine architecture (see `standards/backend/firebase.md`)

**Implementation Pattern**:
```typescript
// hooks/useSurveySteps.ts
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export function useSurveySteps(eventId: string, experienceId: string) {
  const [steps, setSteps] = useState<SurveyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stepsRef = collection(db, `events/${eventId}/steps`);
    const q = query(stepsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const stepsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SurveyStep[];
        setSteps(stepsData);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to steps:', err);
        setError('Failed to load survey steps');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId, experienceId]);

  return { steps, loading, error };
}
```

**Read-Write Split**:
- **Reads**: Client SDK with `onSnapshot` (real-time subscriptions)
- **Writes**: Server Actions with Admin SDK (business logic, validation)

---

### 4. Survey UX Best Practices

**Decision**: Follow Typeform/Google Forms patterns with mobile-first adaptations

**Key Principles**:
1. **Progressive Disclosure**: Show one step editor at a time (selected step model)
2. **Real-Time Preview**: Show guest-facing preview as creator configures
3. **Clear Visual Hierarchy**: Step numbering, drag handles, action buttons
4. **Inline Validation**: Immediate feedback on invalid configurations
5. **Mobile-First Touch Targets**: 44x44px minimum for all interactive elements
6. **Responsive Forms**: Stack vertically on mobile, side-by-side on desktop

**Mobile Adaptations**:
- Vertical stacking (editor on top, preview below)
- Collapsible sections to save screen space
- Bottom sheet for step type selector (modal alternative)
- Swipe gestures for navigation (future enhancement)

**Step Type Considerations**:
| Type | Mobile UX Challenge | Solution |
|------|---------------------|----------|
| Multiple Choice | Long option lists | Scrollable container, max 10 options |
| Opinion Scale | Small touch targets | Large tappable scale items (50px+) |
| Long Text | Virtual keyboard overlap | Auto-scroll to keep field visible |
| Statement | Passive step | Large, tappable "Continue" button |

---

### 5. Character Limits & Validation Rules

**Decision**: Enforce limits at schema level with clear user feedback

**Character Limits** (from spec):
- Title: 200 characters
- Description: 500 characters
- Placeholder: 100 characters
- Multiple Choice Option: 100 characters each

**Validation Rules**:
- Multiple Choice: Minimum 1 option (prevent empty)
- Opinion Scale: `minValue < maxValue`, both integers
- Email: RFC-compliant email regex pattern
- Step Count: Soft warning at 5 steps, hard limit at 10 steps

**Implementation**:
```typescript
// lib/schemas/survey.ts
import { z } from 'zod';

export const stepBaseSchema = z.object({
  title: z.string().min(1, 'Title required').max(200, 'Max 200 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
  required: z.boolean().nullable().default(null),
});

export const multipleChoiceConfigSchema = z.object({
  options: z.array(z.string().min(1).max(100)).min(1, 'At least 1 option required'),
  allowMultiple: z.boolean().default(false),
});

export const opinionScaleConfigSchema = z.object({
  minValue: z.number().int(),
  maxValue: z.number().int(),
  minLabel: z.string().max(50).optional(),
  maxLabel: z.string().max(50).optional(),
}).refine(data => data.minValue < data.maxValue, {
  message: 'Min value must be less than max value',
  path: ['minValue'],
});
```

---

### 6. Step Ordering Strategy

**Decision**: Store order in `SurveyExperience.config.stepsOrder: string[]` array

**Rationale**:
- **Simplicity**: Single source of truth for step order
- **Atomic Updates**: Update order array in one transaction
- **Query Efficiency**: No need to query steps in order (fetch by ID from array)
- **Consistency**: Aligns with Firestore best practices (avoid numeric ordering fields)

**Alternatives Considered**:
- **Position Field**: Requires reordering multiple documents (race conditions)
- **Linked List**: Complex traversal logic, prone to corruption
- **Auto ID Ordering**: Loses creator's intended order on reorder

**Implementation Pattern**:
```typescript
// actions/survey-steps.ts
export async function reorderStepsAction(
  eventId: string,
  experienceId: string,
  activeId: string,
  overId: string
) {
  'use server';
  
  const experienceRef = db
    .collection('events')
    .doc(eventId)
    .collection('experiences')
    .doc(experienceId);
  
  const experience = await experienceRef.get();
  const stepsOrder = experience.data()?.config?.stepsOrder || [];
  
  // Reorder array
  const oldIndex = stepsOrder.indexOf(activeId);
  const newIndex = stepsOrder.indexOf(overId);
  const newOrder = arrayMove(stepsOrder, oldIndex, newIndex);
  
  // Single atomic update
  await experienceRef.update({
    'config.stepsOrder': newOrder,
    updatedAt: Date.now(),
  });
  
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
```

---

### 7. Discriminated Union Types for Step Types

**Decision**: Use TypeScript discriminated unions with Zod's `.discriminatedUnion()`

**Rationale**:
- **Type Safety**: Compiler enforces correct config per step type
- **Runtime Validation**: Zod validates correct shape at runtime
- **Exhaustive Checks**: Switch statements require handling all types
- **Refactoring Safety**: Adding new types caught by TypeScript

**Implementation**:
```typescript
// lib/schemas/survey.ts
import { z } from 'zod';

// Base schema (common fields)
const stepBaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  required: z.boolean().nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Type-specific schemas
const multipleChoiceStepSchema = stepBaseSchema.extend({
  type: z.literal('multiple-choice'),
  config: z.object({
    options: z.array(z.string().min(1).max(100)).min(1),
    allowMultiple: z.boolean().default(false),
  }),
});

const yesNoStepSchema = stepBaseSchema.extend({
  type: z.literal('yes-no'),
  config: z.object({
    yesLabel: z.string().max(50).optional(),
    noLabel: z.string().max(50).optional(),
  }).optional(),
});

const opinionScaleStepSchema = stepBaseSchema.extend({
  type: z.literal('opinion-scale'),
  config: z.object({
    minValue: z.number().int(),
    maxValue: z.number().int(),
    minLabel: z.string().max(50).optional(),
    maxLabel: z.string().max(50).optional(),
  }).refine(data => data.minValue < data.maxValue, {
    message: 'Min must be less than max',
  }),
});

const shortTextStepSchema = stepBaseSchema.extend({
  type: z.literal('short-text'),
  config: z.object({
    placeholder: z.string().max(100).optional(),
    maxLength: z.number().int().positive().optional(),
  }).optional(),
});

const longTextStepSchema = stepBaseSchema.extend({
  type: z.literal('long-text'),
  config: z.object({
    placeholder: z.string().max(100).optional(),
    maxLength: z.number().int().positive().optional(),
  }).optional(),
});

const emailStepSchema = stepBaseSchema.extend({
  type: z.literal('email'),
  config: z.object({
    placeholder: z.string().max(100).optional(),
  }).optional(),
});

const statementStepSchema = stepBaseSchema.extend({
  type: z.literal('statement'),
  config: z.null().optional(),
});

// Discriminated union
export const surveyStepSchema = z.discriminatedUnion('type', [
  multipleChoiceStepSchema,
  yesNoStepSchema,
  opinionScaleStepSchema,
  shortTextStepSchema,
  longTextStepSchema,
  emailStepSchema,
  statementStepSchema,
]);

export type SurveyStep = z.infer<typeof surveyStepSchema>;
```

**Usage in Components**:
```typescript
function renderStepEditor(step: SurveyStep) {
  switch (step.type) {
    case 'multiple_choice':
      return <MultipleChoiceEditor config={step.config} />;
    case 'yes_no':
      return <YesNoEditor config={step.config} />;
    case 'opinion_scale':
      return <OpinionScaleEditor config={step.config} />;
    case 'short_text':
    case 'long_text':
      return <TextEditor type={step.type} config={step.config} />;
    case 'email':
      return <EmailEditor config={step.config} />;
    case 'statement':
      return <StatementEditor />;
    default:
      // TypeScript error if not exhaustive
      const _exhaustive: never = step;
      return null;
  }
}
```

**Note**: The existing codebase uses `snake_case` for step types (see `surveyStepTypeSchema` in `features/experiences/lib/schemas.ts`), so we maintain that convention.

---

## Summary of Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | React 19 compatible, accessible, touch-friendly |
| Form State | React Hook Form + Zod resolver | Type-safe, performant, minimal re-renders |
| Real-Time Data | Firebase Client SDK `onSnapshot` | Instant updates, battery efficient |
| Survey UX | Typeform-inspired, mobile-first | Proven patterns, accessible, responsive |
| Validation | Zod schemas at client + server | Defense in depth, type safety |
| Step Ordering | Array in experience config | Simple, atomic, consistent |
| Type System | Discriminated unions | Compile-time + runtime safety |
| Schema Location | `features/experiences/lib/schemas.ts` | Co-located with feature (existing pattern) |
| Naming Convention | `snake_case` for step types | Matches existing codebase convention |

---

## Existing Code Integration

**Current Survey Schemas** (`features/experiences/lib/schemas.ts`):
- Lines 99-103: `surveyConfigSchema` - needs `surveyStepIds` → `stepsOrder` rename
- Lines 218-225: `surveyStepTypeSchema` - needs `yes_no` type added
- Lines 227-248: `surveyStepSchema` - flat schema, needs conversion to discriminated union

**Migration Strategy**:
1. Keep existing field names where possible (`scaleMin`, `scaleMax`, `placeholder`)
2. Replace flat schema with discriminated union for type safety
3. Add new `yes_no` step type to enum
4. Rename `surveyStepIds` to `stepsOrder` in config

---

## Open Questions

None. All technical decisions are resolved and ready for Phase 1 (Design & Contracts).

