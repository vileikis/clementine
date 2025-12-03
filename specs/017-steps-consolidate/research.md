# Research: Steps Consolidation (Experience-Scoped Steps)

**Feature**: `017-steps-consolidate`
**Date**: 2025-12-03

## Overview

This document captures research findings for the Steps Consolidation feature, resolving all "NEEDS CLARIFICATION" items from the Technical Context and documenting best practices and patterns.

---

## Research Topic 1: AI Transform Step Configuration Schema

### Decision
The `ai-transform` step type will use a configuration schema with: model identifier, prompt template, input variables array, and output type. This aligns with the existing AI Presets (`aiPhotoConfig`) structure but scoped to individual steps.

### Rationale
- Consistency with existing `aiPhotoConfig` pattern from AI Presets feature
- Allows per-step AI configuration (different prompts/models at different points in flow)
- Variables support template interpolation from previous step inputs
- Output type determines result handling (image vs video vs gif)

### Schema Design
```typescript
interface AiTransformConfig {
  model: string | null;              // e.g., "gemini-2.5-flash-image", "flux"
  prompt: string | null;             // Max 1000 chars, supports {{variable}} placeholders
  variables: AiTransformVariable[];  // Maps prompt variables to step inputs
  outputType: "image" | "video" | "gif"; // Determines result format
  aspectRatio?: string;              // "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | etc.
  referenceImageUrls?: string[];     // Up to 5 reference images
}

interface AiTransformVariable {
  key: string;                       // Variable name in prompt (without {{}} syntax)
  sourceType: "capture" | "input" | "static"; // Where value comes from
  sourceStepId?: string;             // Step ID if sourceType is "capture" or "input"
  staticValue?: string;              // Value if sourceType is "static"
}
```

### Alternatives Considered
1. **Reuse aiPhotoConfig directly** - Rejected because aiPhotoConfig is tightly coupled to AI Presets and includes capture configuration not relevant to steps
2. **Inline prompt only (no variables)** - Rejected because variable interpolation is needed for dynamic prompts using guest inputs
3. **Reference AI Preset by ID** - Rejected because it creates unnecessary indirection and doesn't support per-step customization

---

## Research Topic 2: Step Type Union Updates

### Decision
The `StepType` union will:
- Add `"ai-transform"` as a new step type
- Keep `"experience-picker"` in the type but mark as deprecated (not remove)
- Keep all other existing step types

### Rationale
- Adding `ai-transform` enables AI-powered photo transformation at any point in the flow
- Keeping `experience-picker` (deprecated) maintains backward compatibility with existing data
- The `STEP_TYPE_META` constant already has a `deprecated` flag for UI filtering

### Current Step Types (11)
```typescript
type StepType =
  | "info"
  | "experience-picker"  // deprecated: true in STEP_TYPE_META
  | "capture"            // deprecated: true in STEP_TYPE_META
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward";
```

### Updated Step Types (12)
```typescript
type StepType =
  | "info"
  | "experience-picker"  // deprecated: true, hidden from step picker
  | "capture"            // deprecated: true, hidden from step picker
  | "ai-transform"       // NEW: AI transformation step
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward";
```

### Alternatives Considered
1. **Remove experience-picker entirely** - Rejected because existing production data may reference this type; graceful deprecation is safer
2. **Add ai-transform as a category, not type** - Rejected because steps are identified by type field; categories are UI-only concepts

---

## Research Topic 3: Collection Path Migration Strategy

### Decision
Steps will be stored at `/experiences/{experienceId}/steps/{stepId}` with `experienceId` as a required field. The journey-based path (`/events/{eventId}/steps/{stepId}`) will be preserved in parallel for the journeys module (legacy).

### Rationale
- Clean separation between experience-scoped steps (new) and journey-scoped steps (legacy)
- No data migration required - both paths coexist
- The journeys module will be deprecated in Phase 2 (separate feature)
- Sessions module will be updated to read from experiences (FR-010)

### Collection Structure
```
Firestore:
├── /experiences/{experienceId}
│   ├── stepsOrder: string[]         # Array of step IDs in display order
│   └── /steps/{stepId}
│       ├── experienceId: string     # Required parent reference
│       ├── type: StepType
│       ├── title: string | null
│       ├── description: string | null
│       ├── mediaUrl: string | null
│       ├── mediaType: MediaType | null
│       ├── ctaLabel: string | null
│       ├── config: StepConfig       # Type-specific config
│       ├── createdAt: number
│       └── updatedAt: number
```

### Alternatives Considered
1. **Single steps collection with parent reference** - Rejected because subcollections provide better query isolation and security rules
2. **Migrate all existing steps** - Rejected because journeys module still active; migration happens in Phase 2 when journeys are fully deprecated

---

## Research Topic 4: Consolidation Strategy for Duplicate Actions

### Decision
Delete `features/experiences/actions/steps.ts` and update all consumers to import from `@/features/steps/actions`. The steps module actions will be updated to accept `experienceId` instead of `eventId` + `journeyId`.

### Rationale
- Single source of truth for step CRUD operations (FR-007)
- Eliminates maintenance burden of keeping two files in sync
- The experience-scoped actions already use better patterns (batch writes)
- Clear module boundaries: steps module owns all step logic

### Files to Modify
1. **Delete**: `web/src/features/experiences/actions/steps.ts` (FR-013)
2. **Update**: `web/src/features/experiences/actions/index.ts` - Remove steps exports
3. **Update**: `web/src/features/experiences/hooks/useStepMutations.ts` - Import from `@/features/steps/actions`
4. **Update**: `web/src/features/steps/actions/steps.ts` - Accept `experienceId` parameter
5. **Update**: `web/src/features/steps/repositories/steps.repository.ts` - Use experience collection path

### Import Path Changes
```typescript
// Before (in useStepMutations.ts)
import { createStepAction, updateStepAction, ... } from "../actions/steps";

// After
import { createStepAction, updateStepAction, ... } from "@/features/steps/actions";
```

### Alternatives Considered
1. **Keep both files, add deprecation warnings** - Rejected because this increases maintenance burden and doesn't resolve the duplication
2. **Merge into experiences module** - Rejected because steps module has more comprehensive implementation (11 editors, utilities, hooks)

---

## Research Topic 5: Session Module Updates for Experience Integration

### Decision
The sessions module will be updated to load experience data from `@/features/experiences/repositories` instead of journeys. Session documents will reference `experienceId` instead of `journeyId`.

### Rationale
- Aligns with Phase 3 architecture (experiences replace journeys)
- Sessions track guest progress through experiences
- The `stepsOrder` field lives on Experience documents

### Current Session Fields (Journey-Based)
```typescript
interface Session {
  journeyId?: string;        // Reference to journey
  currentStepIndex?: number; // Position in journey.stepOrder
}
```

### Updated Session Fields (Experience-Based)
```typescript
interface Session {
  experienceId?: string;     // Reference to experience (FR-010)
  currentStepIndex?: number; // Position in experience.stepsOrder
}
```

### Implementation Notes
- Sessions for journey-based flows will continue to work (backward compatible)
- New sessions will use `experienceId` field
- `getJourneyForGuestAction` will be deprecated in favor of experience loading

### Alternatives Considered
1. **Keep journeyId, add experienceId** - Rejected because it creates confusion about which reference is authoritative
2. **Full session rewrite** - Rejected because it's out of scope; sessions will be fully rewritten in Phase 7 (Experience Engine)

---

## Research Topic 6: AI Transform Default Configuration

### Decision
Default values for new ai-transform steps will be:
- Title: "AI Transform"
- CTA Label: "Generate"
- Prompt: `null` (empty)
- Model: `null` (empty)
- Variables: `[]` (empty array)
- Output Type: `"image"`
- Aspect Ratio: `"1:1"`
- Reference Images: `[]` (empty array)

### Rationale
- Title/CTA provide sensible starting text (FR-011)
- Empty prompt forces creator to configure before use
- Image output is the most common use case
- 1:1 aspect ratio is the default for photo booths

### STEP_DEFAULTS Entry
```typescript
"ai-transform": {
  title: "AI Transform",
  ctaLabel: "Generate",
  config: {
    model: null,
    prompt: null,
    variables: [],
    outputType: "image",
    aspectRatio: "1:1",
    referenceImageUrls: [],
  },
},
```

### STEP_TYPE_META Entry
```typescript
"ai-transform": {
  label: "AI Transform",
  description: "Transform photos with AI models",
  icon: "wand-2",  // lucide-react icon
  category: "capture",  // Or "completion"?
  deprecated: false,
},
```

### Alternatives Considered
1. **Default model to Gemini** - Rejected because model availability varies by environment
2. **Default output type to match session** - Rejected because explicit configuration is clearer

---

## Research Topic 7: Mobile-First AI Transform Editor Design

### Decision
The AI Transform step editor will follow the same pattern as existing step editors (e.g., RewardEditor, ProcessingEditor) with mobile-first layout.

### Design Patterns from Existing Editors
1. **Form layout**: Single column on mobile, optional two columns on desktop
2. **Section grouping**: Related fields grouped with labels
3. **Responsive spacing**: `space-y-4` for mobile, `space-y-6` for desktop
4. **Touch targets**: All buttons/inputs meet 44px minimum

### Editor Sections
1. **Model Selection** - Dropdown or input for model name
2. **Prompt Configuration** - Textarea with variable highlighting
3. **Variables Mapping** - List of variable-to-source mappings
4. **Output Settings** - Output type, aspect ratio selection
5. **Reference Images** - Image upload grid (max 5)

### Component Reuse
- `StepMediaUpload` for reference images
- `Select` from shadcn/ui for dropdowns
- `Textarea` from shadcn/ui for prompt
- `Button` from shadcn/ui for actions

### Alternatives Considered
1. **Wizard-style configuration** - Rejected because it increases complexity; inline form is simpler
2. **Separate page for AI config** - Rejected because inline editing matches other step types

---

## Research Topic 8: Best Practices for Atomic Step Operations

### Decision
Step operations that affect multiple documents (e.g., reorder, delete) will use Firestore batch writes for atomicity.

### Rationale
- Prevents partial updates if one write fails
- Already implemented in `experiences/actions/steps.ts` - adopt this pattern
- Critical for reordering where both step document and experience.stepsOrder must update

### Implementation Pattern
```typescript
const batch = adminDb.batch();

// Update step document
batch.update(stepRef, { ... });

// Update experience.stepsOrder
batch.update(experienceRef, { stepsOrder: newOrder });

// Commit atomically
await batch.commit();
```

### Operations Requiring Batch Writes
1. **Create step**: Add document + update experience.stepsOrder
2. **Delete step**: Remove document + update experience.stepsOrder
3. **Reorder steps**: Update experience.stepsOrder (single document)
4. **Duplicate step**: Add document + update experience.stepsOrder

### Alternatives Considered
1. **Sequential writes** - Rejected because partial failures can leave data inconsistent
2. **Transactions** - Not needed since we're updating known documents, not reading then writing

---

## Summary

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| AI Transform Config Schema | New schema with model, prompt, variables, outputType | Aligns with aiPhotoConfig but step-scoped |
| Step Type Updates | Add ai-transform, keep deprecated types | Backward compatibility |
| Collection Path | `/experiences/{experienceId}/steps/{stepId}` | Clean separation from journeys |
| Action Consolidation | Delete experiences/actions/steps.ts | Single source of truth |
| Session Updates | experienceId replaces journeyId | Align with architecture |
| AI Transform Defaults | Empty prompt, "image" output, "1:1" aspect | Force explicit configuration |
| Editor Design | Mobile-first, reuse existing patterns | Consistency with other editors |
| Atomic Operations | Firestore batch writes | Prevent partial failures |
