# Research: Experience Engine

**Feature Branch**: `020-experience-engine`
**Date**: 2025-12-05

## Summary

This document captures research findings for building the Experience Engine - a unified runtime for executing Clementine experiences. The engine will consolidate existing preview/playback patterns into a single component usable by both Admin Preview and Guest Flow.

---

## Research Area 1: Step Renderer Architecture

### Question
How should step renderers be organized for the Experience Engine?

### Decision
**Reuse existing step preview components with a unified renderer registry**

### Rationale
The codebase already has well-structured step preview components at `web/src/features/steps/components/preview/steps/`. These components:
- Follow a consistent prop interface (step config, interactive mode, callbacks)
- Use shared primitives (`StepLayout`, `ActionButton`)
- Handle both read-only and interactive modes

The Experience Engine should:
1. Import existing step components rather than duplicating them
2. Use a registry pattern (step type → component mapping) for the dispatcher
3. Add new renderers only for engine-specific behavior (e.g., `AiTransformRenderer` with job trigger)

### Alternatives Considered
- **Create all-new renderers**: Rejected - would duplicate ~500 LOC of existing, tested UI
- **Embed in existing steps feature**: Rejected - violates feature module boundaries (experience-engine is a separate domain)

### Reference Files
- `web/src/features/steps/components/preview/PreviewRuntime.tsx` - Current switch-based dispatcher
- `web/src/features/steps/components/preview/steps/` - Individual step components

---

## Research Area 2: Session State Management

### Question
How should the engine manage session state for ephemeral vs persisted modes?

### Decision
**Evolve existing `features/sessions/` module with dual-mode support**

### Rationale
The engine needs to support two session modes:
1. **Ephemeral** (Admin Preview): All state in-memory, no Firestore calls
2. **Persisted** (Guest Flow): State syncs to Firestore for transformation tracking

**Key architectural decision**: Session types, actions, and real-time hooks live in `features/sessions/` (the domain owner), not in `features/experience-engine/`. The engine consumes sessions but doesn't own the session domain.

Implementation approach:
- Extend `features/sessions/types/sessions.types.ts` with `EngineSession`, `TransformationStatus`
- Add session CRUD and transform actions to `features/sessions/actions/sessions.actions.ts`
- Add `useTransformationStatus` hook to `features/sessions/hooks/`
- Engine's `useEngineSession` hook is a thin adapter that delegates to sessions module

### Existing Patterns
- `useMockSession`: In-memory session with `inputs` map and reset capability
- Session types: `SessionState` enum, `SessionData` interface, `StepInputValue` union
- Real-time subscription: `onSnapshot` pattern in `useExperience`, `useSteps` hooks

### Alternatives Considered
- **Keep session types in experience-engine**: Rejected - duplicates session concepts, creates ambiguity about which module owns sessions
- **Separate hooks per mode**: Rejected - would complicate engine component logic
- **Always persist with local cache**: Rejected - unnecessary overhead for preview mode

### Reference Files
- `web/src/features/steps/hooks/useMockSession.ts` - Ephemeral pattern
- `web/src/features/sessions/types/sessions.types.ts` - Session schema (to be extended)
- `web/src/features/experiences/hooks/useExperience.ts` - Real-time subscription pattern

---

## Research Area 3: AI Transformation Flow

### Question
How does the AI transformation flow work across steps (ai-transform → processing → reward)?

### Decision
**Session-based status tracking with real-time subscription**

### Rationale
The AI transformation spans three steps with clear separation:

1. **ai-transform step**:
   - Triggers background job via Server Action
   - Updates session: `transformStatus: "pending"`
   - Auto-advances immediately (does NOT wait)

2. **processing step**:
   - Subscribes to session updates via `onSnapshot`
   - Displays rotating loading messages
   - Auto-advances when `transformStatus: "complete"` detected

3. **reward step**:
   - Displays result from `session.resultImagePath`
   - Shows loading skeleton if result not yet ready (edge case)
   - Updates when result arrives via subscription

**Session fields for transformation**:
```typescript
interface TransformationStatus {
  status: "idle" | "pending" | "processing" | "complete" | "error";
  resultUrl?: string;
  errorMessage?: string;
}
```

### Implementation Notes
- Server Action for job trigger: `triggerTransformAction({ sessionId, config })`
- Processing step uses `useTransformationStatus(sessionId)` hook
- Auto-advance implemented via `onComplete` callback pattern (already used in playback)

### Alternatives Considered
- **Polling for status**: Rejected - wasteful, real-time subscription is more efficient
- **Transform step waits**: Rejected - blocks user, spec requires immediate advance

---

## Research Area 4: Navigation Debouncing

### Question
How should navigation actions be debounced to prevent race conditions?

### Decision
**Use existing debounce pattern with 150ms delay**

### Rationale
The existing `useExperiencePlayback` hook implements navigation debouncing:
- `lastNavTimeRef` tracks last navigation timestamp
- `canNavigate()` returns false if within 150ms of last nav
- Prevents double-click issues and state races

This pattern should be preserved in `useEngine` hook.

### Reference Files
- `web/src/features/steps/hooks/useExperiencePlayback.ts` lines 51-65

---

## Research Area 5: Variable Interpolation

### Question
How should `{{variable}}` placeholders in AI prompts be resolved?

### Decision
**Simple string replacement utility with graceful fallback**

### Rationale
AI transform prompts can contain `{{step_id}}` placeholders that should be replaced with values from session data.

Implementation:
```typescript
function interpolateVariables(
  prompt: string,
  sessionData: SessionData,
  variables: AiTransformVariable[]
): string {
  let result = prompt;
  for (const variable of variables) {
    const placeholder = `{{${variable.key}}}`;
    let value = "";

    if (variable.sourceType === "static") {
      value = variable.staticValue ?? "";
    } else {
      const input = sessionData[variable.sourceStepId ?? ""];
      value = extractValueAsString(input);
    }

    result = result.replaceAll(placeholder, value);
  }
  return result;
}
```

Graceful degradation: Missing variables replaced with empty string (per spec FR-019).

### Reference Files
- `web/src/features/steps/types/step.types.ts` - `AiTransformVariable` interface

---

## Research Area 6: Engine Configuration Schema

### Question
What should the engine configuration interface look like?

### Decision
**Comprehensive config with optional fields for flexibility**

### Rationale
Based on spec requirements (FR-001), the engine needs:

```typescript
interface EngineConfig {
  // Required
  experienceId: string;
  steps: Step[];
  stepsOrder: string[];
  flowName: string;

  // Persistence
  persistSession: boolean;
  existingSessionId?: string;

  // Navigation
  allowBack: boolean;
  allowSkip: boolean;

  // Integration
  debugMode: boolean;
  theme?: ProjectTheme;

  // Context (for persisted mode)
  projectId?: string;
  eventId?: string;

  // Callbacks
  onStart?: (session: EngineSession) => void;
  onStepChange?: (index: number, step: Step, direction: "forward" | "backward") => void;
  onDataUpdate?: (data: SessionData) => void;
  onComplete?: (session: EngineSession) => void;
  onError?: (error: EngineError) => void;
}
```

Zod schema will validate this at runtime for type safety.

---

## Research Area 7: Existing Component Reuse

### Question
Which existing components can be reused vs need new implementations?

### Decision
**Reuse most step components; create new engine-specific wrappers**

### Analysis

| Step Type | Existing Component | Reuse? | Notes |
|-----------|-------------------|--------|-------|
| info | `InfoStep.tsx` | ✅ Yes | Direct reuse |
| capture | `CaptureStep.tsx` | ⚠️ Partial | Need real camera for guest mode |
| ai-transform | N/A (placeholder) | ❌ No | New: trigger job, update session |
| short_text | `ShortTextStep.tsx` | ✅ Yes | Direct reuse |
| long_text | `LongTextStep.tsx` | ✅ Yes | Direct reuse |
| multiple_choice | `MultipleChoiceStep.tsx` | ✅ Yes | Direct reuse |
| yes_no | `YesNoStep.tsx` | ✅ Yes | Direct reuse |
| opinion_scale | `OpinionScaleStep.tsx` | ✅ Yes | Direct reuse |
| email | `EmailStep.tsx` | ✅ Yes | Direct reuse |
| processing | `ProcessingStep.tsx` | ⚠️ Partial | Need real-time subscription |
| reward | `RewardStep.tsx` | ⚠️ Partial | Need real result display |

**New components needed**:
1. `AiTransformRenderer` - Job trigger + brief confirmation UI
2. `ProcessingRenderer` - Real-time status subscription wrapper
3. `RewardRenderer` - Real result display wrapper
4. `CaptureRenderer` - Real camera integration (for guest mode)

---

## Research Area 8: Error Handling Strategy

### Question
How should engine errors be handled and surfaced?

### Decision
**Error boundary + callback pattern**

### Rationale
Three categories of errors:

1. **Render errors** (step component crashes):
   - Handled by React error boundary
   - Display friendly message, fire `onError` callback
   - Allow restart or skip (if allowed)

2. **Action errors** (Server Action failures):
   - Return `{ success: false, error }` from actions
   - Display recoverable error state with retry
   - Fire `onError` callback

3. **Subscription errors** (real-time sync failures):
   - Show recoverable error state
   - Preserve local data
   - Allow retry of sync

### Reference Files
- `web/src/features/steps/components/preview/StepErrorBoundary.tsx` - Existing error boundary

---

## Key Decisions Summary

| Area | Decision |
|------|----------|
| Step Component Naming | `*Step.tsx` suffix (matches existing preview components) |
| Step Component Location | `features/experience-engine/components/steps/` |
| Session Domain | Evolve `features/sessions/` module (domain owner) |
| Session Types Location | `features/sessions/types/sessions.types.ts` (extended) |
| Session Actions Location | `features/sessions/actions/sessions.actions.ts` |
| Transform Status Hook | `features/sessions/hooks/useTransformationStatus.ts` |
| AI Flow | Session-based status with real-time subscription |
| Navigation | 150ms debounce, existing pattern |
| Variable Interpolation | Simple string replacement with graceful fallback |
| Error Handling | Error boundary + callback pattern |

---

## Next Steps

1. Create `data-model.md` with entity schemas
2. Create `contracts/` with Server Action signatures
3. Create `quickstart.md` with integration examples
