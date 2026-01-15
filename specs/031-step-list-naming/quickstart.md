# Quickstart: Step List Naming

**Feature**: 031-step-list-naming
**Date**: 2026-01-15

## Overview

Display custom step titles in the step list sidebar when available, with fallback to default step type labels.

## What's Changing

### Files Modified

1. **`step-utils.ts`** - Add `getStepDisplayLabel` helper function
2. **`StepListItem.tsx`** - Use helper for display label

### No Changes To

- Step schemas (no data model changes)
- Step registry (labels remain as defaults)
- StepList.tsx (parent component)
- Any other components

## Implementation Steps

### Step 1: Add Helper Function

Add to `apps/clementine-app/src/domains/experience/steps/registry/step-utils.ts`:

```typescript
/**
 * Get the display label for a step
 * Returns custom title if present and non-empty, otherwise default label
 */
export function getStepDisplayLabel(step: Step, definition: StepDefinition): string {
  if ('title' in step.config && typeof step.config.title === 'string') {
    const trimmedTitle = step.config.title.trim()
    if (trimmedTitle) {
      return trimmedTitle
    }
  }
  return definition.label
}
```

### Step 2: Update StepListItem

In `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`:

```diff
- import { getStepDefinition } from '../../steps/registry/step-utils'
+ import { getStepDefinition, getStepDisplayLabel } from '../../steps/registry/step-utils'

// In the component:
- <span className="truncate">{definition.label}</span>
+ <span className="truncate">{getStepDisplayLabel(step, definition)}</span>
```

### Step 3: Add Tests

Create `apps/clementine-app/src/domains/experience/steps/registry/step-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getStepDisplayLabel } from './step-utils'
import { stepRegistry } from './step-registry'
import type { Step } from './step-registry'

describe('getStepDisplayLabel', () => {
  it('returns custom title when present and non-empty', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      config: { title: 'Welcome', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Welcome')
  })

  it('returns default label when title is empty string', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      config: { title: '', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Information')
  })

  it('returns default label when title is whitespace only', () => {
    const step: Step = {
      id: 'test-id',
      type: 'info',
      config: { title: '   ', description: '', media: null },
    }
    const definition = stepRegistry.info
    expect(getStepDisplayLabel(step, definition)).toBe('Information')
  })

  it('returns default label when step type has no title field', () => {
    const step: Step = {
      id: 'test-id',
      type: 'capture.photo',
      config: { aspectRatio: '1:1' },
    }
    const definition = stepRegistry['capture.photo']
    expect(getStepDisplayLabel(step, definition)).toBe('Photo Capture')
  })
})
```

## Verification

After implementation, verify:

1. **Custom title shown**: Create an info step, add a title like "Welcome Screen", verify it shows in step list
2. **Fallback works**: Create a step without setting title, verify default label shows
3. **Truncation works**: Add a very long title, verify it truncates with ellipsis
4. **No regressions**: Verify drag-drop, selection, and deletion still work

## Validation

```bash
# Run checks
pnpm app:check

# Run tests
pnpm app:test

# Type check
pnpm app:type-check
```
