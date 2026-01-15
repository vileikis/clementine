# Research: Step List Naming

**Feature**: 031-step-list-naming
**Date**: 2026-01-15

## Overview

This document captures research findings for implementing custom step title display in the StepListItem component.

## Key Findings

### 1. Step Config Title Availability

**Decision**: Access title via `step.config.title` with type guard for safety

**Rationale**:
- Step configs use a discriminated union based on `step.type`
- Most step types have a `title` field (info, input.scale, input.yesNo, input.multiSelect, input.shortText, input.longText)
- Some step types do NOT have a title field (capture.photo, transform.pipeline)
- Must check if `title` property exists before accessing

**Alternatives considered**:
- Adding title to all step configs: Rejected - would require schema changes and migration
- Adding separate step-level title field: Rejected - duplicates existing config title

### 2. Step Types with Title Field

| Step Type | Has Title | Default Label |
|-----------|-----------|---------------|
| info | Yes | "Information" |
| input.scale | Yes | "Opinion Scale" |
| input.yesNo | Yes | "Yes/No" |
| input.multiSelect | Yes | "Multiple Choice" |
| input.shortText | Yes | "Short Answer" |
| input.longText | Yes | "Long Answer" |
| capture.photo | No | "Photo Capture" |
| transform.pipeline | No | "AI Transform" |

### 3. Display Logic Implementation

**Decision**: Use helper function to get display label

**Implementation approach**:
```typescript
function getStepDisplayLabel(step: Step, definition: StepDefinition): string {
  // Check if config has title property and it's non-empty after trim
  if ('title' in step.config && typeof step.config.title === 'string') {
    const trimmedTitle = step.config.title.trim()
    if (trimmedTitle) {
      return trimmedTitle
    }
  }
  // Fallback to default label from registry
  return definition.label
}
```

**Rationale**:
- Type-safe access using `'title' in step.config`
- Handles whitespace-only titles by trimming
- Falls back to registry default label
- Single responsibility - can be unit tested

**Alternatives considered**:
- Inline conditional in JSX: Rejected - harder to test, less readable
- Type assertion: Rejected - not type-safe

### 4. Existing Patterns

**Current implementation** (StepListItem.tsx:124):
```tsx
<span className="truncate">{definition.label}</span>
```

**New implementation**:
```tsx
<span className="truncate">{getStepDisplayLabel(step, definition)}</span>
```

The change is minimal and maintains existing styling (truncation with ellipsis).

### 5. Testing Strategy

**Unit tests needed**:
1. Returns custom title when present and non-empty
2. Returns default label when title is empty string
3. Returns default label when title is whitespace-only
4. Returns default label when step type has no title field

**No integration tests needed** - pure display logic with no side effects.

## Dependencies

None - uses existing step registry and type system.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Title truncation looks bad | Low | Low | Existing CSS truncation handles this |
| Performance impact | Very Low | Very Low | Simple string check, negligible |
| Type errors | Low | Medium | Using type guards, not assertions |

## Conclusion

The implementation is straightforward:
1. Add a helper function `getStepDisplayLabel` in step-utils.ts
2. Update StepListItem to use the helper
3. Add unit tests for the helper function
