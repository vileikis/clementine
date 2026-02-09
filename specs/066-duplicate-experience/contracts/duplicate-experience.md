# Contract: Duplicate Experience Mutation

**Feature**: 066-duplicate-experience
**Date**: 2026-02-09

## Hook: `useDuplicateExperience`

### Input

```typescript
interface DuplicateExperienceInput {
  workspaceId: string  // min 1 char
  experienceId: string // min 1 char — source experience ID
}
```

### Output (on success)

```typescript
interface DuplicateExperienceResult {
  workspaceId: string
  experienceId: string  // The NEW experience ID
  name: string          // The generated name
}
```

### Behavior

1. Validate input with `duplicateExperienceInputSchema`
2. Open Firestore transaction
3. Read source experience document — if not found or `status !== 'active'`, throw error
4. Generate duplicate name from source name
5. Create new document reference (auto-generated ID)
6. Deep-copy `draft` and `published` configs via `structuredClone()`
7. Write new document with field mapping from data-model.md
8. On success: invalidate `experienceKeys.lists()` for workspace, show success toast
9. On error: capture to Sentry, show error toast

### Error Cases

| Condition                  | Behavior                                   |
| -------------------------- | ------------------------------------------ |
| Source not found            | Throw error → toast "Couldn't duplicate experience" |
| Source is deleted           | Throw error → toast "Couldn't duplicate experience" |
| Network failure             | Throw error → toast "Couldn't duplicate experience" |
| Firestore permission denied | Throw error → toast "Couldn't duplicate experience" |

---

## Utility: `generateDuplicateName`

### Input

```typescript
function generateDuplicateName(name: string): string
```

### Behavior

1. If `name` ends with `" (Copy)"` → return `name` unchanged
2. Else → append `" (Copy)"` to name
3. If result length > 100 → truncate original name portion to fit within 100 chars

### Examples

| Input                      | Output                     |
| -------------------------- | -------------------------- |
| `"Photo Booth"`            | `"Photo Booth (Copy)"`     |
| `"Photo Booth (Copy)"`     | `"Photo Booth (Copy)"`     |
| `"My Event (Copy) Special"`| `"My Event (Copy) Special (Copy)"` |
| `"A".repeat(100)`          | `"A".repeat(93) + " (Copy)"` |

---

## UI Contract: Context Menu Actions

### ExperiencesPage provides actions to ExperienceListItem

```typescript
// Sections for ContextDropdownMenu
sections: [
  {
    items: [
      { key: 'rename', label: 'Rename', icon: Pencil, onClick: () => setRenameExperience(exp) },
      { key: 'duplicate', label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(exp), disabled: duplicateMutation.isPending },
    ]
  },
  {
    items: [
      { key: 'delete', label: 'Delete', icon: Trash2, onClick: () => setDeleteExperienceTarget(exp), destructive: true },
    ]
  },
]
```

### Toast Messages

| Event   | Message                                    |
| ------- | ------------------------------------------ |
| Success | `Duplicated as "{newName}"`                |
| Error   | `Couldn't duplicate experience`            |
