# **📄 PRD — Phase 3: Steps Consolidation (Experience-Scoped Steps)**

**Status:** Draft
**Goal:** Refactor the `steps` feature module to be fully experience-scoped, removing all journey coupling, and consolidate duplicated step logic into a single source of truth.

---

# **1. Purpose**

Phase 3 consolidates the steps architecture:

- Refactor `features/steps/` to operate on `/experiences/{experienceId}/steps` instead of legacy `/events/{eventId}/steps`.
- Remove all journey references and coupling from the steps module.
- Eliminate duplicated step actions (currently in both `steps/` and `experiences/actions/steps.ts`).
- Add the new `ai-transform` step type for AI processing workflows.
- Remove the deprecated `experience-picker` step type.

This phase ensures the steps module becomes the single source of truth for all step operations, with experiences as the parent entity.

**Affected feature modules:**

- `src/features/steps` (primary - refactored)
- `src/features/experiences` (consumer - updated imports)
- `src/features/sessions` (consumer - updated imports)
- `src/features/journeys` (legacy - deleted post-merge)

---

# **2. Scope (In-Scope)**

## **2.1 Steps Module Refactor: Journey → Experience**

### **Repository changes**

Update `steps/repositories/steps.repository.ts`:

- Change collection path from `/events/{eventId}/steps` to `/experiences/{experienceId}/steps`
- Replace all `eventId` + `journeyId` parameters with single `experienceId` parameter
- Update step order operations to use `experience.stepsOrder` instead of `journey.stepOrder`
- Remove imports from `features/journeys/`

### **Actions changes**

Update `steps/actions/steps.ts`:

- Replace `eventId` + `journeyId` parameters with `experienceId`
- Update validation to check experience existence (not journey)
- Update revalidation paths to experience routes
- Remove all journey-related imports and logic

### **Schema changes**

Update `steps/schemas/`:

- Remove `journeyId` field from step schema
- Ensure `experienceId` is required field
- Update input schemas (`createStepInputSchema`, etc.) to use `experienceId`

### **Type changes**

Update `steps/types/`:

- Remove `journeyId` from `Step` interface
- Add `experienceId` to `Step` interface
- Remove any journey-related types

---

## **2.2 Consolidate Duplicated Step Actions**

### **Current state (duplication)**

Two parallel implementations exist:

1. `features/steps/actions/steps.ts` — targets `/events/{eventId}/steps` (journey-coupled)
2. `features/experiences/actions/steps.ts` — targets `/experiences/{experienceId}/steps` (experience-coupled)

### **Target state (single source of truth)**

- `features/steps/actions/steps.ts` — single implementation targeting `/experiences/{experienceId}/steps`
- `features/experiences/actions/steps.ts` — **deleted**

### **Consumer updates**

Update `features/experiences/hooks/useStepMutations.ts`:

- Change imports from `../actions/steps` to `@/features/steps/actions`
- No logic changes required (function signatures remain compatible)

---

## **2.3 Add `ai-transform` Step Type**

### **New step type definition**

Add `ai-transform` to step types:

```ts
type StepType =
  | "info"
  | "capture"
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward"
  | "ai-transform"; // NEW
```

### **Step config schema**

```ts
interface AiTransformConfig {
  model: string; // AI model identifier
  prompt: string; // Generation prompt with variable placeholders
  variables: AiTransformVariable[]; // Input variables mapping
  outputType: "image" | "video" | "gif";
  // Advanced options (future expansion)
}

interface AiTransformVariable {
  key: string; // Variable name in prompt (e.g., "photo")
  source: "capture" | "input" | "static"; // Where value comes from
  sourceStepId?: string; // Reference to source step if applicable
}
```

### **Defaults**

Add defaults for `ai-transform` step in `steps/constants.ts`:

- Default title: "AI Transform"
- Default CTA: "Generate"
- Default config with empty prompt and variables

---

## **2.4 Remove `experience-picker` Step Type**

### **Removal scope**

- Remove `experience-picker` from `StepType` union
- Remove from `STEP_DEFAULTS` constant
- Remove editor component for experience-picker (if exists)
- Remove preview/renderer component for experience-picker (if exists)

### **Migration note**

Any existing steps with `type: "experience-picker"` in production data should be:

- Flagged during migration
- Manually reviewed and removed or converted

---

## **2.5 Update Sessions Module**

### **Current state**

`sessions/actions/sessions.actions.ts` imports from journeys:

```ts
import { getJourney } from "@/features/journeys/repositories/journeys.repository";
import type { Journey } from "@/features/journeys";
```

### **Target state**

Update to use experiences:

```ts
import { getExperience } from "@/features/experiences/repositories";
import type { Experience } from "@/features/experiences";
```

### **Logic updates**

- Replace `getJourney()` calls with `getExperience()`
- Update any `Journey` type references to `Experience`
- Adjust field access as needed (`stepOrder` → `stepsOrder`, etc.)

---

# **3. Out of Scope**

- 🚫 Test Panel for `ai-transform` step (deferred to future phase)
- 🚫 AI execution/integration (runtime handled in Phase 7 Experience Engine)
- 🚫 Step editor UI changes beyond adding `ai-transform` editor
- 🚫 Guest runtime changes (Phase 7)
- 🚫 Migration of existing production step data (separate migration task)
- 🚫 Changes to step preview/renderer components (they remain in `steps/components/`)

---

# **4. Technical Notes**

### **4.1 Import path changes**

Before:

```ts
// In experiences module
import { createStepAction } from "../actions/steps";
```

After:

```ts
// In experiences module
import { createStepAction } from "@/features/steps/actions";
```

### **4.2 Parameter signature changes**

Before (journey-coupled):

```ts
createStepAction({ eventId, journeyId, type, ... })
listStepsAction(eventId, journeyId)
updateStepAction(eventId, stepId, input)
deleteStepAction(eventId, stepId)
reorderStepsAction(eventId, journeyId, newOrder)
```

After (experience-scoped):

```ts
createStepAction({ experienceId, type, ... })
listStepsAction(experienceId)
updateStepAction(experienceId, stepId, input)
deleteStepAction(experienceId, stepId)
reorderStepsAction(experienceId, newOrder)
```

### **4.3 Firestore path changes**

Before:

```
/events/{eventId}/steps/{stepId}
```

After:

```
/experiences/{experienceId}/steps/{stepId}
```

### **4.4 Module responsibilities after Phase 3**

| Module | Responsibility |
|--------|---------------|
| `steps/` | **Owns** step types, schemas, actions, repository, editors, preview |
| `experiences/` | **Uses** steps via `@/features/steps/actions`, provides UI hooks |

---

# **5. Acceptance Criteria**

## **Steps Module Refactor**

- [ ] `steps/repositories/` uses `/experiences/{experienceId}/steps` collection path
- [ ] `steps/actions/` uses `experienceId` parameter (not `eventId`/`journeyId`)
- [ ] `steps/schemas/` has `experienceId` field, no `journeyId` field
- [ ] `steps/types/` has `experienceId` in Step interface, no `journeyId`
- [ ] Zero imports from `features/journeys/` in steps module
- [ ] Zero references to "journey" terminology in steps module code

## **Consolidation**

- [ ] `features/experiences/actions/steps.ts` is deleted
- [ ] `features/experiences/hooks/useStepMutations.ts` imports from `@/features/steps/actions`
- [ ] All step CRUD operations work through single `steps/actions/` implementation
- [ ] Experience editor functions correctly with consolidated actions

## **New Step Type**

- [ ] `ai-transform` added to `StepType` union
- [ ] `AiTransformConfig` schema defined
- [ ] Defaults for `ai-transform` in `STEP_DEFAULTS`
- [ ] `ai-transform` appears in step picker UI

## **Deprecated Step Type**

- [ ] `experience-picker` removed from `StepType` union
- [ ] `experience-picker` removed from `STEP_DEFAULTS`
- [ ] `experience-picker` editor/preview components removed (if exist)
- [ ] `experience-picker` does not appear in step picker UI

## **Sessions Module**

- [ ] `sessions/actions/sessions.actions.ts` imports from `@/features/experiences`
- [ ] No imports from `features/journeys/` in sessions module
- [ ] Session creation/validation works with experiences

## **Type Safety**

- [ ] `pnpm type-check` passes with zero errors
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds

---

# **6. Deliverables**

- Refactored `features/steps/` module (experience-scoped)
- Deleted `features/experiences/actions/steps.ts`
- Updated `features/experiences/hooks/useStepMutations.ts`
- Updated `features/sessions/actions/sessions.actions.ts`
- New `ai-transform` step type with schema and defaults
- Removed `experience-picker` step type
- Updated documentation in CLAUDE.md if needed

---

# **7. Post-Merge Cleanup**

After Phase 3 is merged and verified working:

## **Delete `features/journeys/` module**

The journeys module becomes fully obsolete after this phase. Delete:

```
src/features/journeys/
├── actions/
├── components/
├── hooks/
├── repositories/
├── schemas/
├── types/
├── constants.ts
└── index.ts
```

## **Delete legacy specs**

Remove outdated specification documents:

```
specs/005-journey-init/
specs/008-preview-runtime/
```

## **Remaining consumers (intentionally broken)**

The following modules still reference journeys but will be rewritten in Phase 7:

- `features/guest/hooks/useJourneyRuntime.ts` — Phase 7 Experience Engine
- `features/guest/components/JourneyGuestContainer.tsx` — Phase 7 Experience Engine

These can remain broken (or be stubbed out) until Phase 7 rewrites the guest runtime.

## **Verification**

After cleanup:

```bash
# Should find zero results (excluding guest module which is intentionally broken)
grep -r "features/journeys" web/src/ --include="*.ts" --include="*.tsx" | grep -v "features/guest"
```
