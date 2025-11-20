# Quickstart: Survey Experience Implementation

**Date**: 2025-11-20  
**Feature**: Survey Experience Type  
**Target Audience**: Developers implementing this feature

---

## 📋 Overview

This guide provides a quick reference for implementing the Survey Experience feature. For detailed specifications, see:
- [spec.md](./spec.md) - Feature requirements
- [data-model.md](./data-model.md) - Data structures
- [research.md](./research.md) - Technical decisions
- [contracts/server-actions.md](./contracts/server-actions.md) - API contracts

---

## 🎯 Key Concepts

**Survey Experience**: An experience of type "survey" that collects structured feedback through configurable question steps.

**Survey Steps**: Individual questions stored in `/events/{eventId}/steps/{stepId}` subcollection. Step ordering managed by `SurveyExperience.config.stepsOrder` array.

**Step Types**: 7 supported types (multiple-choice, yes-no, opinion-scale, short-text, long-text, email, statement)

**Architecture**:
- **Writes**: Server Actions with Firebase Admin SDK
- **Reads**: Client SDK with real-time subscriptions (`onSnapshot`)
- **Validation**: Zod schemas at client + server (defense in depth)

---

## 🗂️ File Structure

```
web/src/features/experiences/
├── lib/
│   ├── schemas.ts                             # 1. START HERE: Update existing survey schemas
│   ├── repository.ts                          # 2. Extend with survey step operations
│   └── constants.ts                           # Existing constants
├── actions/
│   └── survey-steps.ts                        # 3. NEW: Server Actions for survey steps
├── hooks/
│   ├── useSurveySteps.ts                      # 4. NEW: Real-time subscription hook
│   └── useSurveyStepMutations.ts              # 5. NEW: Mutation hook (wraps actions)
└── components/survey/                         # 6. NEW: Survey-specific components
    ├── SurveyExperienceEditor.tsx             # Main editor container
    ├── SurveyStepList.tsx                     # Draggable list (@dnd-kit)
    ├── SurveyStepEditor.tsx                   # Step configuration form
    ├── SurveyStepPreview.tsx                  # Real-time preview
    └── step-types/                            # Type-specific editors
        ├── MultipleChoiceEditor.tsx
        ├── YesNoEditor.tsx
        ├── OpinionScaleEditor.tsx
        ├── TextEditor.tsx
        ├── EmailEditor.tsx
        └── StatementEditor.tsx
```

---

## ⚡ Quick Implementation Steps

### Step 1: Update Existing Schemas (`features/experiences/lib/schemas.ts`)

**Current State**: Lines 99-103, 215-289 have basic survey schemas
**Goal**: Convert to discriminated union pattern for type safety

```typescript
// UPDATE surveyConfigSchema (lines 99-103)
const surveyConfigSchema = z.object({
  stepsOrder: z.array(z.string()).max(10), // RENAMED from surveyStepIds
  required: z.boolean(),
  showProgressBar: z.boolean(),
});

// UPDATE surveyStepTypeSchema (lines 218-225) - add yes_no
export const surveyStepTypeSchema = z.enum([
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",        // NEW
  "opinion_scale",
  "email",
  "statement",
]);

// REPLACE flat surveyStepSchema (lines 227-248) with discriminated union:

// Base schema (common fields)
const stepBaseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  required: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Type-specific schemas
const multipleChoiceStepSchema = stepBaseSchema.extend({
  type: z.literal('multiple_choice'),
  config: z.object({
    options: z.array(z.string().max(100)).min(1).max(10),
    allowMultiple: z.boolean().default(false),
  }),
});

const yesNoStepSchema = stepBaseSchema.extend({
  type: z.literal('yes_no'),
  config: z.object({
    yesLabel: z.string().max(50).optional(),
    noLabel: z.string().max(50).optional(),
  }).optional(),
});

// ... other step types (see data-model.md)

// Discriminated union (REPLACES current surveyStepSchema)
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

---

### Step 2: Extend Repository (`features/experiences/lib/repository.ts`)

**Current State**: Repository has functions for photo/gif experiences
**Goal**: Add survey step operations to existing repository

```typescript
import { db } from '@/lib/firebase/admin';
import { surveyStepSchema, type SurveyStep, type CreateStepInput } from './schemas';

// ADD these functions to existing repository.ts file:

export async function createSurveyStep(
  eventId: string,
  experienceId: string,
  input: CreateStepInput
): Promise<string> {
  const stepRef = db.collection('events').doc(eventId).collection('steps').doc();
  
  const stepData = {
    ...input,
    id: stepRef.id,
    eventId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Validate before write
  surveyStepSchema.parse(stepData);
  
  // Transaction: create step + update stepsOrder
  await db.runTransaction(async (txn) => {
    const experienceRef = db
      .collection('events')
      .doc(eventId)
      .collection('experiences')
      .doc(experienceId);
    
    const experienceDoc = await txn.get(experienceRef);
    const currentOrder = experienceDoc.data()?.config?.stepsOrder || [];
    
    if (currentOrder.length >= 10) {
      throw new Error('MAX_STEPS_EXCEEDED');
    }
    
    txn.set(stepRef, stepData);
    txn.update(experienceRef, {
      'config.stepsOrder': [...currentOrder, stepRef.id],
      updatedAt: Date.now(),
    });
  });
  
  return stepRef.id;
}

export async function updateSurveyStep(
  eventId: string,
  stepId: string,
  input: Partial<SurveyStep>
): Promise<SurveyStep> {
  const stepRef = db.collection('events').doc(eventId).collection('steps').doc(stepId);
  
  await stepRef.update({
    ...input,
    updatedAt: Date.now(),
  });
  
  const updatedDoc = await stepRef.get();
  return surveyStepSchema.parse({ id: stepId, eventId, ...updatedDoc.data() });
}

// ... similar for delete, reorder (see contracts/server-actions.md)
```

---

### Step 3: Create Server Actions (`features/experiences/actions/survey-steps.ts`)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as repository from '../lib/repository';
import { createStepInputSchema } from '../lib/schemas';

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function createSurveyStepAction(
  eventId: string,
  experienceId: string,
  input: unknown
): Promise<ActionResponse<{ stepId: string }>> {
  try {
    const validated = createStepInputSchema.parse(input);
    const stepId = await repository.createSurveyStep(eventId, experienceId, validated);
    
    revalidatePath(`/events/${eventId}`);
    return { success: true, data: { stepId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      };
    }
    
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create step' },
    };
  }
}

// ... similar for update, delete, reorder
```

---

### Step 4: Create Real-Time Hook (`features/experiences/hooks/useSurveySteps.ts`)

```typescript
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { SurveyStep } from '../lib/schemas';

export function useSurveySteps(eventId: string, stepsOrder: string[]) {
  const [steps, setSteps] = useState<SurveyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const stepsRef = collection(db, `events/${eventId}/steps`);
    
    const unsubscribe = onSnapshot(
      stepsRef,
      (snapshot) => {
        const stepsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SurveyStep[];
        
        // Sort by stepsOrder array
        const sortedSteps = stepsOrder
          .map(id => stepsData.find(s => s.id === id))
          .filter(Boolean) as SurveyStep[];
        
        setSteps(sortedSteps);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe:', err);
        setError('Failed to load steps');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId, stepsOrder]);

  return { steps, loading, error };
}
```

---

### Step 5: Create Mutation Hook (`features/experiences/hooks/useSurveyStepMutations.ts`)

```typescript
import { useState } from 'react';
import { createSurveyStepAction, updateSurveyStepAction, deleteSurveyStepAction } from '../actions/survey-steps';
import type { CreateStepInput, UpdateStepInput } from '../lib/schemas';

export function useSurveyStepMutations(eventId: string, experienceId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStep = async (input: CreateStepInput) => {
    setLoading(true);
    setError(null);
    
    const result = await createSurveyStepAction(eventId, experienceId, input);
    
    setLoading(false);
    if (result.success) {
      return result.data.stepId;
    } else {
      setError(result.error.message);
      return null;
    }
  };

  const updateStep = async (stepId: string, input: UpdateStepInput) => {
    setLoading(true);
    setError(null);
    
    const result = await updateSurveyStepAction(eventId, stepId, input);
    
    setLoading(false);
    if (result.success) {
      return result.data.step;
    } else {
      setError(result.error.message);
      return null;
    }
  };

  const deleteStep = async (stepId: string) => {
    setLoading(true);
    setError(null);
    
    const result = await deleteSurveyStepAction(eventId, experienceId, stepId);
    
    setLoading(false);
    if (result.success) {
      return true;
    } else {
      setError(result.error.message);
      return false;
    }
  };

  return { createStep, updateStep, deleteStep, loading, error };
}
```

---

### Step 6: Create Main Editor Component (`components/survey/SurveyExperienceEditor.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useSurveySteps } from '../../hooks/useSurveySteps';
import { useSurveyStepMutations } from '../../hooks/useSurveyStepMutations';
import { SurveyStepList } from './SurveyStepList';
import { SurveyStepEditor } from './SurveyStepEditor';
import { SurveyStepPreview } from './SurveyStepPreview';

interface SurveyExperienceEditorProps {
  eventId: string;
  experienceId: string;
  stepsOrder: string[];
}

export function SurveyExperienceEditor({
  eventId,
  experienceId,
  stepsOrder,
}: SurveyExperienceEditorProps) {
  const { steps, loading } = useSurveySteps(eventId, stepsOrder);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    steps[0]?.id || null
  );

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Step List */}
      <aside className="w-full lg:w-64">
        <SurveyStepList
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />
      </aside>

      {/* Center: Step Editor */}
      <main className="flex-1">
        {selectedStep && (
          <SurveyStepEditor
            eventId={eventId}
            experienceId={experienceId}
            step={selectedStep}
          />
        )}
      </main>

      {/* Right: Preview */}
      <aside className="w-full lg:w-80">
        {selectedStep && <SurveyStepPreview step={selectedStep} />}
      </aside>
    </div>
  );
}
```

---

### Step 7: Create Draggable List (`components/survey/SurveyStepList.tsx`)

```typescript
'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { reorderSurveyStepsAction } from '../../actions/survey-steps';
import type { SurveyStep } from '@/lib/schemas/survey';

interface SurveyStepListProps {
  steps: SurveyStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export function SurveyStepList({ steps, selectedStepId, onSelectStep }: SurveyStepListProps) {
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex(s => s.id === active.id);
    const newIndex = steps.findIndex(s => s.id === over.id);
    
    const newOrder = arrayMove(steps.map(s => s.id), oldIndex, newIndex);
    await reorderSurveyStepsAction(eventId, experienceId, newOrder);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <SortableStepItem
              key={step.id}
              step={step}
              index={index}
              isSelected={step.id === selectedStepId}
              onSelect={() => onSelectStep(step.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableStepItem({ step, index, isSelected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-lg cursor-pointer ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <button
          {...listeners}
          {...attributes}
          className="touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="text-sm font-medium">
            {index + 1}. {step.title}
          </div>
          <div className="text-xs text-muted-foreground">{step.type}</div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔑 Key Dependencies

Install these packages:

```bash
cd web
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add react-hook-form @hookform/resolvers
```

---

## ✅ Validation Checklist

Before starting implementation:
- [ ] Read [spec.md](./spec.md) - understand requirements
- [ ] Read [data-model.md](./data-model.md) - understand data structures
- [ ] Read [research.md](./research.md) - understand technical decisions
- [ ] Read [contracts/server-actions.md](./contracts/server-actions.md) - understand API contracts
- [ ] Review `standards/global/feature-modules.md` - understand feature organization
- [ ] Review `standards/backend/firebase.md` - understand Firebase patterns
- [ ] Review `standards/frontend/responsive.md` - understand mobile-first design

---

## 🧪 Testing Strategy

**Unit Tests** (Jest):
- Repository functions (mocked Firestore)
- Server Actions (mocked repository)
- Zod schema validation
- Utility functions

**Component Tests** (React Testing Library):
- Form submissions
- Drag-and-drop interactions
- Error states
- Loading states

**E2E Tests** (Playwright - future):
- Complete flow: create survey → add steps → reorder → preview
- Mobile responsiveness
- Touch interactions

---

## 📱 Mobile-First Checklist

- [ ] All touch targets ≥44x44px
- [ ] Typography ≥14px body text, ≥16px input fields
- [ ] Vertical stacking on mobile (editor + preview)
- [ ] Horizontal layout on desktop (list + editor + preview)
- [ ] Drag handles optimized for touch
- [ ] Forms use `touch-manipulation` CSS
- [ ] Test on real mobile devices

---

## 🚀 Performance Goals

- [ ] Survey editor loads in <2s on mobile
- [ ] Step config changes reflect in preview within 1s
- [ ] Drag-and-drop reordering succeeds 100% of the time
- [ ] Real-time subscriptions handle 10 concurrent steps efficiently
- [ ] No layout shift during step loading

---

## 🐛 Common Pitfalls

1. **Don't mutate stepsOrder directly** - Use Server Action to update atomically
2. **Don't forget to unsubscribe** - Always clean up `onSnapshot` in useEffect
3. **Don't skip validation** - Validate at both client and server
4. **Don't hardcode step IDs** - Use generated Firestore IDs
5. **Don't forget mobile testing** - Test drag-and-drop on touch devices

---

## 📚 Additional Resources

- [Firebase Client SDK Docs](https://firebase.google.com/docs/web/setup)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

---

## 🔄 Key Adjustments from Original Plan

This quickstart reflects important corrections based on the existing codebase:

1. **Schema Location**: Use existing `features/experiences/lib/schemas.ts` (not separate `lib/schemas/survey.ts`)
2. **Repository Location**: Extend existing `features/experiences/lib/repository.ts` (not separate file)
3. **Naming Convention**: Use `snake_case` for step types (`multiple_choice`, `short_text`) to match existing code
4. **Field Names**: Use `scaleMin`/`scaleMax` (matching existing `surveyStepSchema`)
5. **Config Field**: Use `stepsOrder` instead of `surveyStepIds` (rename existing field)

---

## 💬 Questions?

- Check [spec.md](./spec.md) for feature requirements
- Check [data-model.md](./data-model.md) for data structures (updated for existing codebase)
- Check [research.md](./research.md) for technical decisions
- Check [contracts/server-actions.md](./contracts/server-actions.md) for API contracts
- Review existing photo/gif experience implementation in `features/experiences/` for patterns

