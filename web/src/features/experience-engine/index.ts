// ============================================================================
// Experience Engine - Public API
// ============================================================================
// Unified runtime engine for executing Clementine experiences.
// Used by both Admin Preview (ephemeral mode) and Guest Flow (persisted mode).

// ============================================================================
// Components - UI building blocks
// ============================================================================
export { ExperienceEngine } from "./components";
export { StepRenderer } from "./components";

// ============================================================================
// Hooks - State management
// ============================================================================
export { useEngine } from "./hooks";
export { useEngineSession } from "./hooks";

// ============================================================================
// Types - Compile-time only
// ============================================================================
export type {
  EngineConfig,
  EngineState,
  EngineStatus,
  EngineActions,
  EngineCallbacks,
  EngineError,
  EngineErrorCode,
  StepChangeInfo,
} from "./types";

export type { StepRendererProps, RendererRegistry } from "./types";

// ============================================================================
// Lib - Utilities (internal, but exported for testing)
// ============================================================================
export { interpolateVariables } from "./lib";
export { getStepComponent, STEP_REGISTRY } from "./lib";
