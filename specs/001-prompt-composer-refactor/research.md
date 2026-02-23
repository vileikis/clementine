# Research: PromptComposer Refactor

**Feature Branch**: `001-prompt-composer-refactor`
**Date**: 2026-02-23

## R-001: Context vs Zustand for Modality State

**Decision**: Use React Context (not Zustand)

**Rationale**:
- Modality configuration is **component-tree-scoped**, not global. Each PromptComposer instance has its own modality — two instances on the same page (e.g., AIVideoConfigForm renders both video PromptComposer and FrameGenerationSection PromptComposer) must have independent state.
- Zustand is mandated for **global UI state** (sidebar, theme preferences). The constitution and `state-management.md` standard say to use Context for "deeply nested state" — which is exactly what 3 levels of prop drilling represents.
- The codebase has an established Context pattern: `createContext<T | null>(null)` + Provider component + `useXxx()` hook with error throw. Examples: `ThemeContext`, `GuestContext`, `AuthContext`.

**Alternatives considered**:
- **Zustand store per instance**: Would require store factory + cleanup. Overengineered for tree-scoped state that doesn't persist.
- **Keep props**: Doesn't solve the scalability problem (adding modality = more props).

---

## R-002: Modality Definition Shape

**Decision**: Static configuration object per modality, with consumers able to spread+override for task-specific variants.

**Rationale**:
- The PRD proposes a `ModalityDefinition` with `type`, `supports*` booleans, and `limits`. This maps cleanly to the current boolean flags (`hideAspectRatio`, `hideRefMedia`) and options (`durationOptions`, `modelOptions`).
- Static objects are simple, type-safe, and testable. No runtime computation needed.
- Consumers can create variants via spread: `{ ...VIDEO_MODALITY, durationOptions: REMIX_ONLY }` — this handles FR-009 (override mechanism for video remix task locking duration to 8s, or hiding ref media for image-to-video).

**Alternatives considered**:
- **Function-based definitions** (modality factory): More flexible but violates YAGNI — current needs are fully served by static objects + spread.
- **Overrides prop on PromptComposer**: Adds complexity. Consumer-side spread is simpler and more explicit.
- **Class-based definitions**: Not idiomatic React/TypeScript. Functions or plain objects preferred.

---

## R-003: Prop Reduction Strategy

**Decision**: Three-pronged approach: (1) modality replaces boolean/option props, (2) group related props into config objects, (3) child components read from context.

**Rationale**:

Current 19 props → Target ≤9:

| Current Props | Refactored To | Count |
|---------------|---------------|-------|
| `prompt`, `onPromptChange` | Keep as-is (core controlled values) | 2 |
| `model`, `onModelChange` | Keep as-is (core controlled values) | 2 |
| `modelOptions`, `hideAspectRatio`, `hideRefMedia`, `durationOptions` | Absorbed into `modality` | 1 |
| `aspectRatio`, `onAspectRatioChange`, `duration`, `onDurationChange` | Grouped into optional `controls` | 1 |
| `refMedia`, `onRefMediaRemove`, `uploadingFiles`, `onFilesSelected`, `canAddMore`, `isUploading` | Grouped into optional `refMedia` | 1 |
| `steps` | Keep as-is | 1 |
| `disabled`, `error` | Keep as-is (utility props) | 0-2 |

**Total**: 8 required props + 2 optional = 10 max, 8 typical. Meets ≥50% reduction target.

**Why keep prompt/model as individual props**: They're the two values every consumer always provides. Wrapping them in a `ControlledValue<string>` adds indirection without benefit — violates "Clean Code & Simplicity" principle.

**Alternatives considered**:
- **Single `config` object prop**: Only 1 prop but loses type safety benefits of required vs optional and makes the API opaque.
- **Compound component pattern** (children-based): PRD suggested `<ModalityConfig type="video" />` as children. This would be a larger API change and harder to migrate. The context-based approach achieves the same goal with less disruption.

---

## R-004: Migration Path

**Decision**: In-place refactor with backward-compatible intermediate step.

**Rationale**:
- Only 3 consumers exist (AIImageConfigForm, AIVideoConfigForm, FrameGenerationSection). All are in the same domain (`experience/create`).
- The refactor can be done in one pass: update PromptComposer + ControlRow + ReferenceMediaStrip, then update all 3 consumers.
- No need for a deprecation period or adapter layer — the change is internal to one domain.

**Approach**:
1. Create ModalityDefinition type + predefined modalities (IMAGE_MODALITY, VIDEO_MODALITY)
2. Create PromptComposerContext + Provider + hook
3. Refactor PromptComposer to accept new props, create context, render children
4. Refactor ControlRow and ReferenceMediaStrip to read from context
5. Update all 3 consumers to use new API
6. Remove old props/types

**Alternatives considered**:
- **New component alongside old**: Maintain two components during migration. Unnecessary given only 3 consumers in one domain.
- **Feature flag**: Overkill for an internal refactor with no user-facing changes.

---

## R-005: Existing Pattern Compliance

**Decision**: Follow established codebase patterns for all new code.

**Findings**:

| Pattern | Existing Example | Will Follow |
|---------|-----------------|-------------|
| Context definition | `ThemeContext.tsx`, `GuestContext.tsx` | `PromptComposerContext.tsx` |
| Provider component | `ThemeProvider.tsx`, `GuestProvider` | Provider inside PromptComposer |
| Context hook | `useTheme()`, `useGuestContext()`, `useAuth()` | `usePromptComposerContext()` |
| Type files | `theme.types.ts`, `lexical/utils/types.ts` | Co-located with context |
| Constants/config | `lib/model-options.ts` | `lib/modality-definitions.ts` |
| Barrel exports | `PromptComposer/index.ts` | Updated with new exports |

No new patterns introduced. All additions follow existing conventions.
