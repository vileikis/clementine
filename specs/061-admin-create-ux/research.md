# Research: Admin Create Tab UX

**Feature**: 061-admin-create-ux
**Date**: 2026-02-05

## Overview

This document consolidates research findings for implementing the Admin Create Tab UX feature. All technical decisions are based on analysis of the existing codebase.

**Note**: This implementation renames "create outcome" to simply "outcome" for clarity. Schema/type names reflect this change.

---

## 1. Existing Component Reusability

### Decision: Leverage existing Lexical and PromptComposer infrastructure

**Rationale**: The create domain already contains a fully functional Lexical prompt editor with @mention support, reference media upload, and serialization. Reusing these components reduces implementation time and ensures consistency.

**Alternatives Considered**:
- Build new prompt editor from scratch → Rejected (duplicates existing work)
- Use a simpler textarea without mentions → Rejected (spec requires @mention support)

### Reusable Components (No Changes Needed)

| Component | Path | Notes |
|-----------|------|-------|
| `LexicalPromptInput` | `components/PromptComposer/LexicalPromptInput.tsx` | Rich text editor with @mention |
| `ReferenceMediaStrip` | `components/PromptComposer/ReferenceMediaStrip.tsx` | Thumbnail strip for uploaded media |
| `ReferenceMediaItem` | `components/PromptComposer/ReferenceMediaItem.tsx` | Individual media thumbnail |
| `AddMediaButton` | `components/PromptComposer/AddMediaButton.tsx` | File picker trigger |
| `StepMentionNode` | `lexical/nodes/StepMentionNode.tsx` | Blue pill for step mentions |
| `MediaMentionNode` | `lexical/nodes/MediaMentionNode.tsx` | Green pill for media mentions |
| `MentionsPlugin` | `lexical/plugins/MentionsPlugin.tsx` | Autocomplete trigger and menu |
| `InitializePlugin` | `lexical/plugins/InitializePlugin.tsx` | Initial value deserialization |
| Serialization utils | `lexical/utils/serialization.ts` | `@{step:x}` / `@{ref:x}` format |

### Components Requiring Refactoring

| Component | Change Required | Reason |
|-----------|----------------|--------|
| `PromptComposer` | Decouple from `AIImageNode` type | Currently expects node-based props |
| `ControlRow` | Accept model/aspect options via props | Currently imports hardcoded options |
| `useRefMediaUpload` | Work with `outcome.imageGeneration.refMedia` | Currently updates transformNodes array |

---

## 2. Data Model Analysis

### Decision: Use existing schema with rename to `Outcome`

**Rationale**: The schema in `packages/shared` already defines all required fields with appropriate defaults and validation. We rename for clarity.

**Schema Structure** (after rename to `outcome.schema.ts`):

```typescript
interface Outcome {
  type: 'image' | 'gif' | 'video' | null    // Outcome type (null = not configured)
  captureStepId: string | null               // Source capture step ID
  aiEnabled: boolean                         // AI toggle (default: true)
  imageGeneration: {
    prompt: string                           // With @{step:x} @{ref:x} syntax
    refMedia: MediaReference[]               // Reference images
    model: AIImageModel                      // Default: 'gemini-2.5-flash-image'
    aspectRatio: AIImageAspectRatio          // Default: '1:1'
  }
  options: OutcomeOptions | null             // Type-specific options
}
```

**Available Enums**:
- `outcomeTypeSchema`: `['image', 'gif', 'video']`
- `aiImageModelSchema`: `['gemini-2.5-flash-image', 'gemini-3-pro-image-preview']`
- `aiImageAspectRatioSchema`: `['1:1', '3:2', '2:3', '9:16', '16:9']`

---

## 3. Step Type Filtering

### Decision: Filter by `type` property to identify capture steps

**Rationale**: The `ExperienceStepType` enum clearly distinguishes step types. Capture steps have type `'capture.photo'`.

**Step Types** (from `step.schema.ts`):

```typescript
enum ExperienceStepType {
  'info'              // Display only (exclude from mentions)
  'input.scale'       // Scale input
  'input.yesNo'       // Yes/No
  'input.multiSelect' // Multiple choice
  'input.shortText'   // Single line text
  'input.longText'    // Multi-line text
  'capture.photo'     // Camera capture ← Source image option
}
```

**Filtering Logic**:
- **Source Image Dropdown**: `steps.filter(s => s.type === 'capture.photo')`
- **Prompt @mentions**: `steps.filter(s => s.type !== 'info')` (all except info)

---

## 4. Form State Management

### Decision: Local React state with debounced mutations

**Rationale**: Existing pattern in `PromptComposer` uses local state for immediate UI updates with debounced Firestore saves. This provides responsive UX while minimizing write operations.

**Pattern**:
```typescript
const [localPrompt, setLocalPrompt] = useState(config.prompt)
const debouncedPrompt = useDebounce(localPrompt, 2000)

useEffect(() => {
  if (debouncedPrompt !== config.prompt) {
    updateMutation.mutate({ prompt: debouncedPrompt })
  }
}, [debouncedPrompt])
```

**Sync Strategy**:
- Local state for immediate UI feedback
- 2-second debounce on prompt changes
- Immediate saves for discrete selections (model, aspect ratio, outcome type)
- Query invalidation on mutation success

---

## 5. Validation Strategy

### Decision: Publish-time validation with inline error display

**Rationale**: The spec defines validation as a gate before publishing, not real-time validation during editing. Inline errors provide clear feedback on what needs to be fixed.

**Validation Rules** (from spec):

| Condition | Error Message |
|-----------|---------------|
| No outcome type | "Select an outcome type" |
| AI disabled + no source | "Passthrough mode requires a source image" |
| AI enabled + empty prompt | "Prompt is required" |
| Invalid captureStepId | "Selected source step no longer exists" |
| Duplicate displayName | "Reference images must have unique names" |
| GIF/Video selected | "GIF/Video coming soon" |

**Implementation Approach**:
- `useOutcomeValidation()` hook returns validation errors
- Errors displayed inline next to fields + summary at top
- Publish button disabled when errors exist
- Real-time validation for some fields (duplicate displayName on blur)

---

## 6. Mutation Hook Pattern

### Decision: Follow existing `useUpdateTransformNodes` pattern

**Rationale**: The codebase has an established pattern for mutations using TanStack Query with tracked save status. The new hook will follow this pattern.

**Existing Pattern** (from `useUpdateTransformNodes.ts`):

```typescript
export function useUpdateTransformNodes(workspaceId, experienceId) {
  const queryClient = useQueryClient()
  const store = useExperienceDesignerStore()

  const mutation = useMutation({
    mutationFn: async ({ transformNodes }) => {
      await updateExperienceConfigField(workspaceId, experienceId, {
        transformNodes,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'experience/create', action: 'update-transform-nodes' },
      })
    },
  })

  return useTrackedMutation(mutation, store)
}
```

**New Hook** (`useUpdateOutcome`):
- Same structure, updates `config.outcome` instead of `config.transformNodes`
- Uses existing `updateExperienceConfigField()` function
- Sentry tracking with `domain: 'experience/create'`

---

## 7. Component Architecture

### Decision: Composition pattern for PromptComposer refactoring

**Rationale**: The PRD specifies a "composition over configuration" approach to make PromptComposer reusable for future generation types (video, text).

**New Props Interface** (from PRD):

```typescript
interface PromptComposerProps {
  // Core prompt
  prompt: string
  onPromptChange: (prompt: string) => void

  // Reference media
  refMedia: MediaReference[]
  onRefMediaAdd: (media: MediaReference) => void
  onRefMediaRemove: (mediaAssetId: string) => void

  // Model - options passed by parent
  model: string
  onModelChange: (model: string) => void
  modelOptions: SelectOption[]

  // Aspect ratio - optional
  aspectRatio?: string
  onAspectRatioChange?: (ratio: string) => void
  aspectRatioOptions?: SelectOption[]

  // Context
  steps: ExperienceStep[]
  workspaceId: string
  disabled?: boolean
}
```

**Benefits**:
- Type-agnostic: parent passes appropriate options
- Extensible: video/text can omit aspect ratio
- Testable: props-based instead of internal state

---

## 8. UI Component Patterns

### Decision: Use shadcn/ui components with existing design patterns

**Rationale**: The codebase uses shadcn/ui consistently. Following existing patterns ensures visual consistency.

**Components to Use**:

| UI Element | shadcn/ui Component |
|------------|---------------------|
| Outcome type selector | `ToggleGroup` (segmented control style) |
| Source image dropdown | `Select` with `SelectContent`, `SelectItem` |
| AI toggle | `Checkbox` with label |
| Model dropdown | `Select` |
| Aspect ratio selector | `ToggleGroup` or button group |
| Validation errors | Custom inline text with `text-destructive` |

**Styling Notes** (from existing patterns):
- Selects inside forms: `className="border-0 bg-transparent shadow-none"`
- Minimum touch target: 44px
- Icons from `lucide-react`

---

## 9. File Cleanup

### Decision: Delete node-based components and operations

**Rationale**: The spec explicitly requires hiding all node-based UI. Keeping dead code violates Clean Code & Simplicity principle.

**Files to Delete**:

```
components/
├── NodeListItem/
│   ├── NodeListItem.tsx
│   ├── AIImageNode.tsx
│   ├── NodeHeader.tsx
│   └── NodeSettings.tsx
├── EmptyState.tsx (if node-specific)
├── AddNodeButton.tsx
├── DeleteNodeDialog.tsx
└── NodeEditorPanel.tsx

containers/
└── TransformPipelineEditor.tsx

lib/
└── transform-operations.ts

hooks/
└── useUpdateTransformNodes.ts
```

---

## 10. Testing Strategy

### Decision: Focus on integration tests for critical flows

**Rationale**: Constitution principle IV (Minimal Testing Strategy) emphasizes testing behavior over implementation. The Create tab has clear user flows to test.

**Critical Paths to Test**:

1. **Form save flow**: Change field → debounce → mutation → query invalidation
2. **Validation flow**: Invalid state → errors displayed → fix → errors cleared
3. **Mention autocomplete**: Type `@` → menu appears → select → mention inserted
4. **AI toggle flow**: Toggle off → composer hides → toggle on → values preserved

**Test Files to Create**:
- `CreateTabForm.test.tsx` - Integration tests for form behavior
- `useOutcomeValidation.test.ts` - Unit tests for validation logic

---

## Summary

All technical unknowns have been resolved. The implementation will:

1. **Rename** "create outcome" to "outcome" throughout schemas and code
2. **Reuse** existing Lexical editor, mention system, and media upload infrastructure
3. **Refactor** PromptComposer and ControlRow for composition-based props
4. **Create** new components for outcome selection, source image, AI toggle, and validation
5. **Delete** all node-based components and operations
6. **Follow** established patterns for mutations, state management, and UI components

No external research or clarification needed - all decisions are based on existing codebase patterns and the detailed PRD.
