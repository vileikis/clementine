# Data Model: Experience Engine

**Feature Branch**: `020-experience-engine`
**Date**: 2025-12-05

## Overview

The Experience Engine introduces new types for engine configuration, state management, and renderer interfaces. It extends existing types from `features/sessions/` and `features/steps/` rather than duplicating them.

---

## Core Entities

### EngineConfig

Input configuration for initializing the Experience Engine.

```typescript
/**
 * Configuration for initializing the Experience Engine.
 * Passed as props to ExperienceEngine component.
 */
interface EngineConfig {
  // === Required ===

  /** Experience ID being executed */
  experienceId: string;

  /** Array of step configurations */
  steps: Step[];

  /** Ordered array of step IDs defining execution sequence */
  stepsOrder: string[];

  /** Human-readable flow name (for logging/analytics) */
  flowName: string;

  // === Session Mode ===

  /**
   * Session persistence mode:
   * - true: Syncs to Firestore (Guest Flow)
   * - false: In-memory only (Admin Preview)
   */
  persistSession: boolean;

  /** Existing session ID to resume (persisted mode only) */
  existingSessionId?: string;

  // === Navigation Flags ===

  /** Allow backward navigation */
  allowBack: boolean;

  /** Allow skipping steps */
  allowSkip: boolean;

  // === Integration ===

  /** Enable debug logging and dev tools */
  debugMode: boolean;

  /** Theme for step rendering */
  theme?: ProjectTheme;

  // === Context (persisted mode) ===

  /** Project ID for session creation */
  projectId?: string;

  /** Event ID for session creation */
  eventId?: string;

  /** Company ID for session creation */
  companyId?: string;

  // === Lifecycle Callbacks ===

  /** Fired when engine starts execution */
  onStart?: (session: EngineSession) => void;

  /** Fired on step navigation */
  onStepChange?: (info: StepChangeInfo) => void;

  /** Fired when session data changes */
  onDataUpdate?: (data: SessionData) => void;

  /** Fired when experience completes */
  onComplete?: (session: EngineSession) => void;

  /** Fired on unrecoverable error */
  onError?: (error: EngineError) => void;
}
```

**Zod Schema**: `engineConfigSchema` in `features/experience-engine/schemas/engine.schemas.ts`

---

### EngineState

Runtime state managed by the engine hook.

```typescript
/**
 * Runtime state of the Experience Engine.
 * Managed by useEngine hook.
 */
interface EngineState {
  /** Current execution status */
  status: EngineStatus;

  /** Index of currently displayed step (0-based) */
  currentStepIndex: number;

  /** Current step configuration (derived from index) */
  currentStep: Step | null;

  /** Session data containing collected inputs */
  sessionData: SessionData;

  /** Transformation status for AI operations */
  transformStatus: TransformationStatus;

  // === Navigation Availability ===

  /** Can navigate backward */
  canGoBack: boolean;

  /** Can navigate forward */
  canGoNext: boolean;

  /** Can skip current step */
  canSkip: boolean;

  /** Auto-advance in progress (blocks manual nav) */
  isAutoAdvancing: boolean;
}

/**
 * Engine execution status
 */
type EngineStatus =
  | "idle"        // Not started
  | "loading"     // Initializing/resuming session
  | "running"     // Actively executing steps
  | "completed"   // Reached end of experience
  | "error";      // Unrecoverable error occurred
```

---

### EngineSession

Extended session type for engine use, including transformation tracking. **Lives in `features/sessions/types/sessions.types.ts`**.

```typescript
/**
 * Engine session extends base Session with transformation fields.
 * Used for both ephemeral and persisted modes.
 *
 * Location: features/sessions/types/sessions.types.ts
 */
interface EngineSession {
  /** Session ID (generated or provided) */
  id: string;

  /** Experience being executed */
  experienceId: string;

  /** Current step index */
  currentStepIndex: number;

  /** Collected step inputs */
  data: SessionData;

  /** Transformation status */
  transformStatus: TransformationStatus;

  /** Timestamps */
  createdAt: number;
  updatedAt: number;

  // === Persisted mode only ===

  /** Event ID (for persisted sessions) */
  eventId?: string;

  /** Project ID (for persisted sessions) */
  projectId?: string;

  /** Company ID (for persisted sessions) */
  companyId?: string;
}
```

---

### TransformationStatus

Tracks AI transformation progress. **Lives in `features/sessions/types/sessions.types.ts`**.

```typescript
/**
 * Status of AI transformation operation.
 * Updated by ai-transform step, monitored by processing step.
 *
 * Location: features/sessions/types/sessions.types.ts
 */
interface TransformationStatus {
  /** Current transformation state */
  status: TransformStatus;

  /** URL of transformed result (when complete) */
  resultUrl?: string;

  /** Error message (when failed) */
  errorMessage?: string;

  /** Job ID for tracking (optional) */
  jobId?: string;

  /** Timestamp of last status change */
  updatedAt?: number;
}

type TransformStatus =
  | "idle"        // No transformation triggered
  | "pending"     // Job queued, awaiting processing
  | "processing"  // AI model actively generating
  | "complete"    // Result ready
  | "error";      // Transformation failed
```

---

### StepChangeInfo

Payload for step change callbacks.

```typescript
/**
 * Information passed to onStepChange callback.
 */
interface StepChangeInfo {
  /** New step index (0-based) */
  index: number;

  /** Step configuration */
  step: Step;

  /** Navigation direction */
  direction: "forward" | "backward" | "skip" | "restart";

  /** Previous step index */
  previousIndex: number;
}
```

---

### EngineError

Structured error type for engine operations.

```typescript
/**
 * Structured error for engine operations.
 */
interface EngineError {
  /** Error code for programmatic handling */
  code: EngineErrorCode;

  /** Human-readable message */
  message: string;

  /** Step ID where error occurred (if applicable) */
  stepId?: string;

  /** Original error (for debugging) */
  cause?: Error;
}

type EngineErrorCode =
  | "INIT_FAILED"        // Engine initialization failed
  | "SESSION_LOAD_FAILED" // Could not load/resume session
  | "SESSION_SYNC_FAILED" // Real-time sync failed
  | "TRANSFORM_FAILED"    // AI transformation failed
  | "RENDERER_ERROR"      // Step renderer crashed
  | "NAV_BLOCKED"         // Navigation not allowed
  | "UNKNOWN";            // Unexpected error
```

---

## Renderer Types

### StepRendererProps

Common props interface for all step renderers.

```typescript
/**
 * Common props for all step renderer components.
 */
interface StepRendererProps<T extends Step = Step> {
  /** Step configuration */
  step: T;

  /** Current session data */
  sessionData: SessionData;

  /** Current transformation status */
  transformStatus: TransformationStatus;

  /** Current input value for this step */
  currentValue?: StepInputValue;

  // === Handlers ===

  /** Called when step input changes */
  onChange: (value: StepInputValue) => void;

  /** Called when CTA button is clicked */
  onCtaClick: () => void;

  /** Called to trigger auto-advance */
  onComplete: () => void;

  /** Called to skip step (if allowed) */
  onSkip: () => void;

  // === Flags ===

  /** Whether step is interactive (accepts input) */
  isInteractive: boolean;

  /** Whether step is currently loading */
  isLoading: boolean;
}
```

---

### RendererRegistry

Type-safe mapping from step types to renderer components.

```typescript
/**
 * Registry mapping step types to renderer components.
 */
type RendererRegistry = {
  [K in StepType]: React.ComponentType<StepRendererProps<Extract<Step, { type: K }>>>;
};
```

---

## Existing Types (Extended/Reused)

These types already exist and are imported, not redefined:

| Type | Location | Usage |
|------|----------|-------|
| `Step` | `features/steps/types/step.types.ts` | Step discriminated union |
| `StepType` | `features/steps/types/step.types.ts` | Step type literals |
| `StepInputValue` | `features/sessions/types/sessions.types.ts` | Input value union |
| `SessionData` | `features/sessions/types/sessions.types.ts` | Input storage map |
| `SessionState` | `features/sessions/types/sessions.types.ts` | Legacy state enum |
| `ProjectTheme` | `features/projects/types/` | Theme configuration |
| `AiTransformVariable` | `features/steps/types/step.types.ts` | Variable mapping |

---

## Firestore Schema

### Session Document (Persisted Mode)

**Collection**: `/sessions/{sessionId}`

```typescript
// Firestore document shape
{
  id: string;              // Document ID
  experienceId: string;
  eventId: string;
  projectId: string;
  companyId: string;
  currentStepIndex: number;

  // Serialized SessionData
  data: {
    [stepId: string]: StepInputValue | string;
  };

  // Transformation tracking
  transformStatus: {
    status: "idle" | "pending" | "processing" | "complete" | "error";
    resultUrl?: string;
    errorMessage?: string;
    jobId?: string;
    updatedAt?: number;
  };

  // Timestamps (Firestore ServerTimestamp)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Notes**:
- Sessions are root-level collection (not nested under events)
- Enables cross-event queries and cleanup
- Real-time subscription via `onSnapshot`

---

## State Transitions

### Engine Status Flow

```
idle → loading → running → completed
                    ↓
                  error
```

### Transformation Status Flow

```
idle → pending → processing → complete
                     ↓
                   error
```

---

## Validation Rules

### EngineConfig Validation

```typescript
// Zod schema excerpt
const engineConfigSchema = z.object({
  experienceId: z.string().min(1),
  steps: z.array(stepSchema).min(0),
  stepsOrder: z.array(z.string()),
  flowName: z.string().min(1).max(100),
  persistSession: z.boolean(),
  existingSessionId: z.string().optional(),
  allowBack: z.boolean(),
  allowSkip: z.boolean(),
  debugMode: z.boolean(),
  // ... callbacks validated at runtime
}).refine(
  (data) => data.steps.length === data.stepsOrder.length,
  "steps and stepsOrder must have matching lengths"
);
```

### Session Data Validation

Input values validated per step type using existing Zod schemas from `features/steps/schemas/`.

---

## Related Files

| Purpose | Path |
|---------|------|
| Engine types | `features/experience-engine/types/engine.types.ts` |
| Renderer types | `features/experience-engine/types/renderer.types.ts` |
| Engine schemas | `features/experience-engine/schemas/engine.schemas.ts` |
| Session types (extended) | `features/sessions/types/sessions.types.ts` |
| Session schemas (extended) | `features/sessions/schemas/sessions.schemas.ts` |
| Session actions | `features/sessions/actions/sessions.actions.ts` |
| Transform status hook | `features/sessions/hooks/useTransformationStatus.ts` |
