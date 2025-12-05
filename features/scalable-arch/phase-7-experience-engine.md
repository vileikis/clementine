# Phase 7: Experience Engine

> **Status**: Not Started
> **Priority**: Critical (Required for December pilots)
> **Dependencies**: Phase 3 (Steps Consolidation) - Complete, Phase 6 (Event Experiences) - Complete

## Overview

Build a unified runtime engine that executes interactive Clementine experiences through modular step components, working identically in both Guest mode and Admin Preview. This is the foundation required for December pilots to ensure "what you see is what guests get."

## Problem / Opportunity

- Current guest flow and admin preview use different logic, causing inconsistencies and duplicated work.
- We lack a single, reusable engine to orchestrate step-by-step experiences.
- Real-time updates (e.g., AI transformation ready) must trigger UI transitions without reload.
- December pilots require a stable, predictable flow that can be tested internally before going live.
- AI transformation is a long-running async operation that needs background job handling.

## Goals (In Scope)

- Create a unified **Experience Engine** capable of executing a sequence of steps.
- Support **Guest** and **Admin Preview** flows with configurable behavior differences.
- Support real-time session updates via Firebase for AI transform progress.
- Provide lifecycle callbacks (`onStart`, `onStepChange`, `onDataUpdate`, `onComplete`) for analytics and logic hooks.
- Allow Admin Preview to use the *same* engine components as Guest mode.
- Move step components from `features/steps/` to `features/experience-engine/`.

## Success Metrics

| Metric | Target |
|--------|--------|
| Engine initialization time | < 100ms |
| Step transition time | < 200ms (no page reload) |
| Real-time session updates | < 1 second latency |
| Admin Preview / Guest parity | 1:1 behavior match |
| AI transform background job | Updates session state on completion |

---

## Functional Requirements

### 1. Engine Initialization

The engine must:
- Accept an experience configuration (steps, step order, theme)
- Accept behavioral configuration flags (persistence, skip, back navigation, debug)
- Initialize or resume a session based on configuration
- Support a `name` identifier for the flow type (e.g., `"guest-flow"`, `"admin-preview"`)

### 2. Step Execution

The engine must:
- Render the current step using the appropriate step component
- Collect and store user inputs per step
- Support forward navigation (next step)
- Support backward navigation (previous step) when enabled
- Support step skipping when enabled
- Handle auto-advancing steps (capture, processing, yes_no, ai-transform)

### 3. Session Management

The engine must:
- Use the existing `features/sessions` module for session types and persistence
- Support two session modes:
  - **Persisted**: Firestore storage with real-time sync (for guest flows)
  - **Ephemeral**: In-memory only (for admin preview)
- Store all step inputs indexed by step ID
- Track current step index
- Track AI transform job status and results

### 4. AI Transform Handling

For `ai-transform` steps, the engine must:
- Trigger a background job via server action
- Update session status to indicate pending/processing state
- Subscribe to real-time session updates for job completion
- Display rotating loading messages during processing
- Show result with comparison view on completion
- Provide retry capability on error
- Auto-advance to next step on successful completion

### 5. Lifecycle Callbacks

The engine must emit callbacks at key moments:

| Callback | When Fired | Payload |
|----------|------------|---------|
| `onStart` | Engine begins execution | Session object |
| `onStepChange` | Navigation to new step | Step index, step, direction |
| `onDataUpdate` | Session data changes | Updated session data |
| `onComplete` | All steps finished | Final session object |
| `onError` | Unrecoverable error | Error details |

### 6. Error Handling

The engine must:
- Display recoverable error states with retry options
- Handle network failures gracefully
- Preserve session data on errors
- Provide clear error messages to users

---

## Engine Configuration

The engine accepts a configuration object that controls its behavior:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Flow identifier (e.g., `"guest-flow"`, `"admin-preview"`) |
| `experienceId` | `string` | Experience being executed |
| `steps` | `Step[]` | Step definitions |
| `stepOrder` | `string[]` | Ordered step IDs |
| `persistSession` | `boolean` | Whether to persist to Firestore |
| `allowSkip` | `boolean` | Allow skipping steps |
| `allowBack` | `boolean` | Allow back navigation |
| `debugMode` | `boolean` | Show debug panel |
| `theme` | `EventTheme` | Optional theme for styling |
| `projectId` | `string?` | Project context (guest flows) |
| `eventId` | `string?` | Event context (guest flows) |
| `existingSessionId` | `string?` | Resume existing session |

---

## Step Components

### Component Structure

Step components are moved from `features/steps/components/preview/steps/` to `features/experience-engine/components/steps/`.

File naming follows existing pattern (no "Renderer" suffix):
- `InfoStep.tsx`
- `CaptureStep.tsx`
- `AiTransformStep.tsx` (NEW)
- `ShortTextStep.tsx`
- `LongTextStep.tsx`
- `MultipleChoiceStep.tsx`
- `YesNoStep.tsx`
- `OpinionScaleStep.tsx`
- `EmailStep.tsx`
- `ProcessingStep.tsx`
- `RewardStep.tsx`

### Common Step Props

All step components receive consistent props:
- Step configuration
- Session data (for reading previous inputs)
- Current input value
- Input change handler
- CTA click handler
- Step complete handler (for auto-advance)
- Skip handler
- Interactive mode flag
- Loading state flag

### Auto-Advance Behavior

| Step Type | Auto-Advance | Trigger |
|-----------|--------------|---------|
| `capture` | Yes | Photo captured |
| `ai-transform` | Yes | Transform completed |
| `processing` | Yes | Timer completed |
| `yes_no` | Yes | Selection made |
| `multiple_choice` | No | CTA click required |
| All others | No | CTA click required |

---

## Module Structure

```
web/src/features/experience-engine/
├── index.ts                    # Public exports
├── types/
│   └── engine.types.ts         # Engine configuration and state types
├── components/
│   ├── ExperienceEngine.tsx    # Main orchestrator component
│   ├── StepRouter.tsx          # Routes to correct step component
│   └── steps/                  # Step components (moved from steps module)
│       ├── InfoStep.tsx
│       ├── CaptureStep.tsx
│       ├── AiTransformStep.tsx
│       ├── ShortTextStep.tsx
│       ├── LongTextStep.tsx
│       ├── MultipleChoiceStep.tsx
│       ├── YesNoStep.tsx
│       ├── OpinionScaleStep.tsx
│       ├── EmailStep.tsx
│       ├── ProcessingStep.tsx
│       └── RewardStep.tsx
├── hooks/
│   ├── useExperienceEngine.ts  # Main engine controller
│   ├── useStepNavigation.ts    # Navigation logic
│   ├── useSessionSync.ts       # Firebase realtime sync
│   └── useAiTransformJob.ts    # Background AI job handling
├── actions/
│   └── ai-transform.actions.ts # Server action for AI transform
├── context/
│   └── EngineContext.tsx       # Engine context provider
└── utils/
    └── variable-interpolation.ts # Prompt variable substitution
```

### Session Module Integration

The engine uses the existing `features/sessions` module:
- Session types from `sessions/types/sessions.types.ts`
- Session repository from `sessions/repositories/`
- Session actions from `sessions/actions/`

The sessions module schema will be extended to support:
- Step inputs storage (`data.inputs: Record<string, StepInputValue>`)
- AI job tracking (`aiJobId`, `aiJobStatus`)
- Experience context (`experienceId` replaces legacy `journeyId`)

---

## Integration Points

### Admin Preview (Future PRD)

The Admin Preview will use the engine with:
- `name: "admin-preview"`
- `persistSession: false` (ephemeral)
- `allowSkip: true`
- `debugMode: true`

### Guest Flow (Future PRD)

The Guest Flow will use the engine with:
- `name: "guest-flow"`
- `persistSession: true` (Firestore)
- `allowSkip: false`
- `debugMode: false`

### Event Extras (Phase 6 Integration)

The Guest Flow orchestrator (separate from engine) will handle Event-level extras:
- **Pre-Entry Gate**: Run before main experience starts
- **Pre-Reward**: Run before showing reward step

These are Event-level concerns handled by the Guest Flow, not the engine itself. The engine executes a single experience; the orchestrator chains multiple engine instances for extras.

---

## Migration Plan

### Step 1: Create Module Structure
Create `experience-engine` feature module with directories.

### Step 2: Evolve Sessions Module
Extend session schema to support:
- `data.inputs` for step input storage
- `aiJobId` and `aiJobStatus` for AI tracking
- Deprecate/remove `journeyId`

### Step 3: Move Step Components
Move from `steps/components/preview/steps/` to `experience-engine/components/steps/`:
- Keep existing file names (no Renderer suffix)
- Update imports
- Adapt to new common props interface

### Step 4: Implement AI Transform Step
Create `AiTransformStep.tsx` (not yet implemented):
- Loading state with rotating messages
- Result display with before/after comparison
- Error state with retry
- Real-time session sync for job status

### Step 5: Implement Core Hooks
- `useExperienceEngine` - Main controller
- `useStepNavigation` - Navigation logic (evolved from `useExperiencePlayback`)
- `useSessionSync` - Firebase realtime sync
- `useAiTransformJob` - Background job handling

### Step 6: Implement Server Action
Create `ai-transform.actions.ts`:
- Trigger AI transform job
- Update session status
- Handle success/failure

### Step 7: Create Main Components
- `ExperienceEngine.tsx` - Main orchestrator
- `StepRouter.tsx` - Step type routing
- `EngineContext.tsx` - Context provider

### Step 8: Clean Up Steps Module
After migration, remove from steps module:
- `components/preview/steps/*` (moved)
- `components/preview/PreviewRuntime.tsx` (replaced)
- `components/preview/PlaybackMode.tsx` (replaced)
- `hooks/useExperiencePlayback.ts` (replaced)
- `hooks/useMockSession.ts` (replaced)

Steps module retains:
- Type definitions
- Schemas
- Constants
- Editors (admin configuration)
- Repositories (CRUD)

---

## Out of Scope

- **Guest Flow Integration** - Separate PRD
- **Admin Preview Integration** - Separate PRD
- **Branching/Graph Workflows** - Linear only for now
- **Video/GIF Capture or Output** - Image only for MVP
- **Analytics Dashboard** - Future phase
- **Embeddable Runtime** - Future phase
- **Multi-experience Selection** - Handled at Event level, not Engine level
- **Event Extras Orchestration** - Guest Flow handles pre-gate/pre-reward logic

---

## Acceptance Criteria

### Functional
- [ ] Engine initializes with experience configuration
- [ ] All 11 step types render correctly
- [ ] Step navigation works (next, back, skip)
- [ ] Auto-advance triggers for appropriate step types
- [ ] Session data persists across navigation
- [ ] AI transform triggers background job
- [ ] AI transform updates UI via real-time sync
- [ ] Lifecycle callbacks fire at correct moments
- [ ] Error states are recoverable

### Session Integration
- [ ] Uses `features/sessions` module (not separate types)
- [ ] Ephemeral mode works without Firestore
- [ ] Persisted mode syncs to Firestore
- [ ] Session resume works with existing session ID

### Performance
- [ ] Engine initialization < 100ms
- [ ] Step transitions < 200ms
- [ ] Real-time updates < 1 second

### Code Quality
- [ ] Step components moved without duplication
- [ ] Clean separation between engine and integrations
- [ ] No circular dependencies between modules

---

## Future Considerations

### Event Extras Flow (Post-Phase 7)

When Guest Flow is implemented, it will orchestrate extras:

```
Guest Flow Orchestrator
├── Load Event (with extras configuration)
├── Check pre-entry gate
│   └── If enabled: Run ExperienceEngine with gate experience
├── Show experience picker (if multiple experiences)
├── Run main ExperienceEngine
├── Check pre-reward
│   └── If enabled: Run ExperienceEngine with pre-reward experience
└── Show final reward
```

### Additional Extra Slots (Future)
- `postReward` - After showing result
- `onError` - Error recovery flows
- `timeout` - Timeout handling flows

---

## Related Documentation

- `phase-3-steps-consolidate.md` - Step types and schemas
- `phase-6-event-experiences.md` - Event extras (pre-gate, pre-reward)
- `phase-ai-transform-playground.md` - AI testing implementation
- `new-data-model-v5.md` - Data model reference
- `web/src/features/steps/` - Current step module
- `web/src/features/sessions/` - Session module
- `web/src/lib/ai/` - AI client interface
