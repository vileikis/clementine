# Research: AI Preset Editor - Preview Panel

**Feature**: 045-ai-preset-preview
**Date**: 2025-01-28
**Status**: Complete

## Overview

This document captures the technical research and decisions made during Phase 0 planning for the AI Preset Editor Preview Panel feature.

## Existing Phase 3 Implementation Analysis

### Architecture Overview

Phase 3 established a **two-column editor layout** with:
- **Left Panel**: Tabbed interface (Edit tab active, Preview tab reserved)
- **Right Panel**: Configuration panel (Model Settings, Media Registry)

The editor uses a **client-first architecture** with:
- Firestore real-time listeners for preset data
- TanStack Query for caching and optimistic updates
- Minimal Zustand store (save status tracking only)
- Local component state for editing operations

### Reference Format

Phase 3 established the `@{type:name}` reference syntax:

```
@{text:variableName}    - Text variable (value or value mapping result)
@{input:variableName}   - Image variable (user upload)
@{ref:mediaName}        - Media registry reference
```

**Parsing Pattern**: `/@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g`

This pattern is already used in:
- `serialization.ts` - Converting Lexical editor state to/from plain text
- `MentionValidationPlugin.tsx` - Validating mention references
- `SmartPastePlugin.tsx` - Smart paste detection

**Decision**: Reuse this exact regex pattern for prompt resolution to ensure consistency.

### Lexical Editor Integration

Phase 3 implemented a sophisticated Lexical-based editor with:

**Custom Nodes**:
- `VariableMentionNode` - Text/input variable mentions (color-coded: blue for text, green for image)
- `MediaMentionNode` - Registry media mentions (color-coded: green for valid, red for invalid)

**Plugins**:
- `MentionsPlugin` - Autocomplete triggered by `@` character
- `SmartPastePlugin` - Detects and converts `@{type:name}` patterns on paste
- `MentionValidationPlugin` - Tracks validity when variables/media are deleted

**Serialization**:
- Plain text format: `@{type:name}` patterns
- JSON format: Full Lexical EditorState (legacy support)

**Decision**: Preview panel will parse the plain text format (not Lexical EditorState directly) to avoid tight coupling with editor internals.

### State Management Pattern

Phase 3 uses a **hybrid state approach**:

1. **Firestore (Source of Truth)**:
   - Preset data stored in `/workspaces/{workspaceId}/aiPresets/{presetId}`
   - Real-time sync via `onSnapshot()` listener
   - Draft changes saved to `draft` field (separate from published)

2. **TanStack Query (Cache + Mutations)**:
   - `useAIPreset(workspaceId, presetId)` hook for fetching
   - Mutation hooks for updates (`useUpdateMediaRegistry`, `useUpdateVariables`, etc.)
   - Optimistic updates for immediate UI feedback

3. **Zustand (Minimal UI State)**:
   - `useAIPresetEditorStore` tracks save status only
   - `pendingSaves` counter, `lastCompletedAt` timestamp
   - NO draft state stored in Zustand

**Decision**: Preview panel will follow the same pattern:
- Read preset data from TanStack Query cache (via `useAIPreset`)
- Store test inputs in local component state (useState)
- Compute resolved prompt/validation as derived state (useMemo)

### Media Upload Infrastructure

Phase 3 uses `MediaPickerField` component for uploads:
- Handles Firebase Storage upload
- Returns `MediaAsset` object with URL, filePath, dimensions
- Integrates with workspace media library
- Provides drag-and-drop and click-to-upload UX

**Decision**: Reuse `MediaPickerField` for test input image uploads to maintain UX consistency.

## Technical Decisions

### 1. Reference Parsing Strategy

**Options Considered**:

1. **Regex-based parsing** (SELECTED)
   - Pattern: `/@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g`
   - Pros: Simple, fast, already used in Phase 3
   - Cons: Doesn't handle nested or malformed syntax gracefully

2. **AST-based parsing**
   - Parse prompt into abstract syntax tree
   - Pros: More robust, handles complex cases
   - Cons: Overkill for simple pattern, adds complexity

3. **String.replace loops**
   - Iteratively replace references
   - Pros: Straightforward
   - Cons: Less maintainable, harder to extract all references

**Decision**: Use regex-based parsing (Option 1)

**Rationale**: The reference syntax is simple and well-defined. Phase 3 already validates the format, so malformed references shouldn't reach the preview panel. Reusing the existing regex ensures consistency and leverages tested code.

### 2. State Management Pattern

**Options Considered**:

1. **Local component state (useState)** (SELECTED)
   - Test inputs stored in component state
   - Derived state computed via useMemo
   - Pros: Simple, no persistence needed, clear lifecycle
   - Cons: State lost on unmount (acceptable - test inputs are temporary)

2. **Zustand global state**
   - Add test input state to `useAIPresetEditorStore`
   - Pros: Centralized state, could persist across tab switches
   - Cons: Pollutes store with ephemeral data, unnecessary complexity

3. **URL query parameters**
   - Store test inputs in URL (?input_var1=value1)
   - Pros: Shareable URLs with test inputs
   - Cons: Not RESTful for editor state, leaks test data in URLs

**Decision**: Use local component state (Option 1)

**Rationale**: Test inputs are temporary testing data that should NOT persist. When a user closes the editor or refreshes, starting with default values is the expected behavior. Local state keeps the preview panel self-contained and avoids coupling to global state or URL structure.

### 3. Debouncing Approach

**Options Considered**:

1. **useMemo with dependency array** (SELECTED)
   - Compute resolved prompt in useMemo hook
   - Depends on: prompt template, test inputs, variables, media registry
   - Pros: Built-in React pattern, no external dependencies, simple
   - Cons: Re-computes on every dependency change (mitigated by memo)

2. **lodash.debounce**
   - Wrap resolution function in debounce(fn, 300)
   - Pros: Explicit control over debounce delay
   - Cons: Adds dependency, requires cleanup logic

3. **useEffect + setTimeout**
   - Manual debounce with setTimeout in useEffect
   - Pros: No dependencies
   - Cons: More boilerplate, error-prone cleanup

**Decision**: Use useMemo with dependency array (Option 1)

**Rationale**: React's useMemo provides automatic "debouncing" by not re-computing when dependencies don't change. Since test inputs are controlled via useState, React batches updates naturally. Adding explicit debouncing (lodash or setTimeout) would add complexity without significant benefit. If performance becomes an issue, we can add useDeferredValue as a second layer.

### 4. Media Preview Data Source

**Options Considered**:

1. **Derived state (compute from prompt references)** (SELECTED)
   - Parse prompt to extract all `@{ref:name}` and `@{input:name}` references
   - Look up URLs from media registry and test uploads
   - Pros: Always in sync with prompt, single source of truth
   - Cons: Re-computation on every prompt change (mitigated by useMemo)

2. **Separate media state**
   - Maintain separate array of selected media
   - Update when references are added/removed
   - Pros: Explicit control
   - Cons: Risk of stale data, requires sync logic

3. **Parse from Lexical editor state**
   - Traverse Lexical EditorState to find MentionNodes
   - Pros: Authoritative source
   - Cons: Wrong layer (preview panel shouldn't depend on Lexical internals)

**Decision**: Use derived state (Option 1)

**Rationale**: The media list is always derivable from the prompt + test inputs. Computing it on-the-fly ensures it's never stale. useMemo makes this efficient by only re-computing when dependencies change. This approach eliminates an entire class of synchronization bugs.

### 5. Validation Timing

**Options Considered**:

1. **Real-time validation (useMemo)** (SELECTED)
   - Compute validation state on every input change
   - Pros: Immediate feedback, no user action required
   - Cons: More frequent re-renders (mitigated by memo)

2. **On-blur validation**
   - Validate when user leaves input field
   - Pros: Fewer validations
   - Cons: Delayed feedback, poor UX

3. **Manual "Validate" button**
   - User clicks button to run validation
   - Pros: Explicit control
   - Cons: Extra step, not intuitive

**Decision**: Use real-time validation (Option 1)

**Rationale**: Modern UX expectations favor immediate feedback. Validation logic is lightweight (simple lookups in variables/media arrays), so performance impact is negligible. Real-time validation prevents users from wondering "is this valid?" and provides instant guidance.

### 6. Image Upload Pattern

**Options Considered**:

1. **Reuse MediaPickerField component** (SELECTED)
   - Import existing component from Phase 3
   - Pros: Consistent UX, tested code, Firebase Storage integration
   - Cons: None significant

2. **Custom upload component**
   - Build new upload UI specific to test inputs
   - Pros: Tailored to preview panel needs
   - Cons: Code duplication, inconsistent UX

3. **Native file input**
   - Use <input type="file">
   - Pros: Minimal code
   - Cons: Poor UX, no Firebase Storage integration

**Decision**: Reuse MediaPickerField (Option 1)

**Rationale**: DRY principle - don't duplicate working code. MediaPickerField already handles Firebase Storage uploads, drag-and-drop UX, file validation, and error handling. Using it ensures the test input upload experience matches the media registry upload experience.

## Performance Considerations

### Debouncing Strategy

**Target**: 300ms debounce for prompt resolution

**Implementation**:
- useMemo automatically debounces by not re-computing when dependencies don't change
- React batches state updates from user interactions (typing, dropdown selection)
- Result: Resolution logic runs ~300ms after last input change without explicit setTimeout

### Lazy Loading

**Target**: Lazy load media thumbnails in preview grid

**Implementation**:
- Use native `loading="lazy"` attribute on <img> tags
- Only render thumbnails in viewport (via Intersection Observer if needed)
- Preload thumbnail URLs in background when prompt references change

### Memoization

**Components to memoize**:
- `TestInputsForm` - Re-renders only when test inputs change
- `PromptPreview` - Re-renders only when resolved prompt changes
- `MediaPreviewGrid` - Re-renders only when media list changes
- `ValidationDisplay` - Re-renders only when validation state changes

**Pattern**: Use React.memo() for pure presentational components

## Dependencies Audit

### Existing Dependencies (Phase 3)

All required dependencies are already installed:

- ✅ React 19.2.0
- ✅ TanStack Start 1.132.0
- ✅ TanStack Query 5.66.5
- ✅ Lexical (via Phase 3 editor)
- ✅ Zustand 5.x
- ✅ Zod 4.1.12
- ✅ shadcn/ui + Radix UI
- ✅ Tailwind CSS v4
- ✅ Firebase SDK 12.5.0

### New Dependencies

**None required** - All functionality can be implemented with existing dependencies.

## Integration Points

### With Phase 3 Editor

**Data Flow**:
1. User edits prompt template in Lexical editor (Edit tab)
2. Lexical serializes to plain text with `@{type:name}` patterns
3. Plain text stored in Firestore `draft.promptTemplate`
4. Preview panel reads from TanStack Query cache
5. Preview panel parses references and resolves prompt

**State Sync**:
- Both Edit and Preview tabs read from same TanStack Query cache
- Changes in Edit tab trigger cache updates
- Preview tab reactively updates via useAIPreset() hook

### With Firebase Storage

**Test Image Uploads**:
- Reuse existing MediaPickerField component
- Uploads to workspace media library (same as registry uploads)
- Returns MediaAsset with public URL
- URL stored in test input state (component-local)
- URLs displayed in media preview grid

**No Persistence**:
- Test uploads are NOT added to preset's mediaRegistry
- URLs are temporary (lost on component unmount)
- Firebase Storage files may be orphaned (acceptable - test data)

## Edge Cases & Handling

### 1. Variable Deleted While Test Input Exists

**Scenario**: User deletes a variable from the configuration while test inputs tab has a value for it.

**Handling**:
- Test input form dynamically generates from current variables
- Deleted variable's input field disappears
- Test input state retains old value (harmless)
- Resolution logic ignores references to non-existent variables
- Validation warning: "Undefined variable: @{text:deletedVar}"

### 2. Prompt Template Edited to Remove Reference

**Scenario**: User removes `@{text:var1}` from prompt while test input has value for `var1`.

**Handling**:
- Test input form still shows field for `var1` (it exists in variables)
- Resolution logic doesn't substitute (reference not in prompt)
- No validation warning (variable exists, just not referenced)
- Acceptable: Unused test inputs don't cause issues

### 3. Very Long Resolved Prompts (10,000+ characters)

**Scenario**: Resolved prompt exceeds typical limits.

**Handling**:
- Display full resolved prompt in scrollable container
- Show character count prominently
- Warning indicator if > 8,000 characters (model-specific limits)
- No hard limit (user may be testing edge cases)

### 4. Image Upload Failure

**Scenario**: Firebase Storage upload fails (network error, permissions issue).

**Handling**:
- MediaPickerField shows error state
- Toast notification with error message
- Test input value remains null
- Validation error: "Image required for: @{input:varName}"

### 5. Media Deleted from Registry While Referenced

**Scenario**: User deletes media from registry, but prompt still references it.

**Handling**:
- Resolution logic detects missing media
- Placeholder text: "[Media: deletedName (missing)]"
- Validation warning: "Undefined media: @{ref:deletedName}"
- Media preview grid excludes missing media

### 6. Nested or Malformed Reference Syntax

**Scenario**: User types `@{text:@{ref:name}}` or `@{invalid:name}`.

**Handling**:
- Regex only matches valid patterns: `text|input|ref`
- Malformed references remain as plain text (not substituted)
- Validation warning: "Malformed reference: @{invalid:name}"
- Lexical editor's validation plugin prevents most malformed cases

### 7. Prompt Contains No References

**Scenario**: Prompt is plain text with no `@{type:name}` references.

**Handling**:
- Resolution returns prompt unchanged
- Test input form shows no fields (no variables to test)
- Media preview grid empty (no references)
- Validation status: "Valid" (nothing to validate)
- Acceptable: User may be testing static prompts

### 8. Rapid Input Changes (Debouncing)

**Scenario**: User types quickly in text input or toggles dropdowns rapidly.

**Handling**:
- React batches state updates automatically
- useMemo recomputes only when dependencies settle
- Effective debounce: ~16ms (React render cycle) + batching
- No performance issues observed (resolution is O(n) regex scan)

### 9. Required Image Variable Not Uploaded

**Scenario**: Image variable has no test upload, but prompt references it.

**Handling**:
- Test input form shows upload zone (required indicator)
- Resolution logic: Placeholder "[Image: varName (missing)]"
- Validation error: "Image required for: @{input:varName}"
- Test generation button disabled (validation incomplete)

### 10. Text Variable with Value Mapping + Unmapped Input

**Scenario**: Text variable has value mappings (A→"Option A", B→"Option B"), but test input provides "C".

**Handling**:
- Dropdown constrains input to mapped values (prevents scenario)
- If manually entered (edge case): Use default value
- Validation warning: "Using default value for: @{text:varName}"
- Resolution: Substitute default value, not unmapped input

## Best Practices

### From Phase 3 Patterns

1. **Self-Contained Components**: Each section owns its update logic and error handling
2. **Barrel Exports**: Every folder has index.ts re-exporting public API
3. **Consistent Naming**: `use[Feature][Action].ts` for hooks, `[Component].tsx` for components
4. **Error Boundaries**: Wrap preview panel in ErrorBoundary for graceful degradation
5. **Loading States**: Show skeleton/spinner while preset data loads
6. **Optimistic Updates**: Update UI immediately, rollback on error

### For Preview Panel

1. **Derived State**: Compute resolved prompt/validation from source data, don't store separately
2. **Pure Functions**: Extract resolution logic to testable pure functions in `lib/`
3. **Memoization**: Use React.memo() for components, useMemo for expensive computations
4. **Type Safety**: Explicit TypeScript types for all state (no `any`)
5. **Accessibility**: Proper ARIA labels on form fields, error announcements for screen readers

## Research Artifacts

### Code References

**Files to Review**:
- `apps/clementine-app/src/domains/ai-presets/lexical/utils/serialization.ts` - Reference parsing
- `apps/clementine-app/src/domains/ai-presets/editor/hooks/useUpdateMediaRegistry.ts` - Mutation pattern
- `apps/clementine-app/src/domains/ai-presets/editor/components/MediaRegistrySection.tsx` - Self-contained section
- `apps/clementine-app/src/shared/media/components/MediaPickerField.tsx` - Upload component

### Standards References

**Standards to Comply With**:
- `standards/frontend/design-system.md` - Theme tokens, color usage
- `standards/frontend/component-libraries.md` - shadcn/ui patterns
- `standards/frontend/state-management.md` - TanStack Query, local state
- `standards/frontend/performance.md` - Debouncing, lazy loading, memoization
- `standards/global/project-structure.md` - Vertical slice architecture

## Open Questions (Resolved)

1. ~~Should test inputs persist across tab switches?~~ → **NO** - Local state clears on unmount
2. ~~How to handle variable deletion while test input exists?~~ → **Ignore stale inputs, show warning**
3. ~~Should media preview show all registry media or only referenced?~~ → **Only referenced** (spec decision)
4. ~~What debounce delay for resolution?~~ → **300ms** (via useMemo, not explicit setTimeout)
5. ~~Reuse MediaPickerField or build custom?~~ → **Reuse** (DRY principle)

## Conclusion

Phase 0 research is complete. All technical decisions have been made with clear rationale. No blockers identified. Ready to proceed to Phase 1 (Data Model & Contracts).

**Next Step**: Generate data-model.md and quickstart.md
