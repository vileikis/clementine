# Quickstart: Fix Event Rename Dialog Stale Name

**Feature**: 026-event-rename
**Date**: 2026-01-15

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Access to the repository

## Setup

```bash
# Clone and checkout feature branch
git checkout 026-event-rename

# Install dependencies
pnpm install

# Start development server
pnpm app:dev
```

## File to Modify

```
apps/clementine-app/src/domains/project/events/components/RenameProjectEventDialog.tsx
```

## Implementation Steps

### Step 1: Add useEffect import

Update the React import to include `useEffect`:

```tsx
import { useState, useEffect } from 'react'
```

### Step 2: Add state synchronization effect

After the `useState` declaration, add:

```tsx
const [name, setName] = useState(initialName)
const renameProjectEvent = useRenameProjectEvent(projectId)

// Sync input state when dialog opens or initialName changes
useEffect(() => {
  if (open) {
    setName(initialName)
  }
}, [open, initialName])
```

### Step 3: Remove redundant reset

In `handleRename` success block, **remove** the line:

```tsx
// REMOVE THIS LINE:
setName(initialName)
```

The effect now handles resetting the state on next dialog open.

## Testing

### Manual Testing Steps

1. Navigate to a project's events list
2. Click the menu (⋮) on any event and select "Rename"
3. Change the name and click "Rename" to save
4. Close the dialog
5. Reopen the rename dialog for the same event
6. **Verify**: Input shows the NEW name (not the old name)

### Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| Rename → Close → Reopen | Shows new name |
| Rename multiple times | Each open shows current name |
| Cancel without saving | Next open shows unchanged name |
| Failed save attempt | Input retains typed value for retry |

## Validation

Before committing:

```bash
# Run format and lint fixes
pnpm app:check

# Type check
pnpm app:type-check

# Verify in browser
pnpm app:dev
```

## Success Criteria

- [ ] Rename dialog always shows current event name when opened
- [ ] Multiple consecutive renames work correctly
- [ ] Cancel behavior unchanged
- [ ] Error handling unchanged
- [ ] All validation gates pass
