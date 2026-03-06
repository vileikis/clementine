# Quickstart: Lexical Mention Node UX Improvements

**Feature Branch**: `089-mention-node-ux`
**Date**: 2026-03-06

## Prerequisites

- Node.js and pnpm installed
- Repository cloned and dependencies installed (`pnpm install` from root)

## Setup

```bash
# From repo root
git checkout 089-mention-node-ux
pnpm install
pnpm app:dev
```

## Relevant Files

All files are within `apps/clementine-app/src/domains/experience/create/`:

### Files to Modify

| File | Purpose |
|------|---------|
| `lexical/nodes/StepMentionNode.tsx` | Remove `contenteditable="false"` and `user-select: none`; add `position: relative` |
| `lexical/nodes/MediaMentionNode.tsx` | Same DOM attribute changes as StepMentionNode |
| `lexical/plugins/index.ts` | Add barrel export for new plugin |
| `components/PromptComposer/LexicalPromptInput.tsx` | Register new plugin |

### Files to Create

| File | Purpose |
|------|---------|
| `lexical/plugins/MentionDeletePlugin.tsx` | Hover-to-delete plugin using mutation listener |

### Files for Reference (Do Not Modify)

| File | Purpose |
|------|---------|
| `lexical/plugins/MentionsPlugin.tsx` | Existing typeahead — shows plugin pattern |
| `lexical/plugins/MentionValidationPlugin.tsx` | Existing mutation-based plugin — shows `registerMutationListener` pattern |
| `lexical/utils/serialization.ts` | Serialization (unchanged, but verify after changes) |

## Manual Testing

1. Navigate to any experience editor that uses the prompt composer
2. Create an experience with at least one step and one media reference
3. Open the prompt editor and insert mentions via `@` trigger

### Test: Cursor Navigation (Isolated)
- Insert a mention node on an empty line (no other text)
- Click before the mention — cursor should appear
- Click after the mention — cursor should appear
- Use arrow keys to navigate to/from the mention line

### Test: Cursor Navigation (Inline)
- Type text, insert a mention, type more text
- Click at the left/right boundary of the mention — cursor should appear correctly
- Use arrow keys to traverse past the mention — cursor should not disappear

### Test: Hover Delete
- Hover over any mention node — close icon should appear at the start
- Move mouse away — close icon should disappear
- Click the close icon — mention should be removed
- Verify the mention is gone from serialized output (check onChange callback)

### Test: Disabled State
- Set the editor to disabled mode
- Hover over a mention — no close icon should appear

## Key APIs

```typescript
// Remove a node inside editor.update()
editor.update(() => {
  const node = $getNodeByKey(nodeKey)
  if (node) node.remove()
})

// Listen for node DOM mutations
editor.registerMutationListener(StepMentionNode, (mutations) => {
  for (const [key, mutation] of mutations) {
    if (mutation === 'created') {
      const element = editor.getElementByKey(key)
      // Inject delete button into element
    }
  }
})
```

## Validation

```bash
pnpm app:type-check   # TypeScript
pnpm app:lint         # ESLint
pnpm app:format       # Prettier
pnpm app:test         # Tests
```
