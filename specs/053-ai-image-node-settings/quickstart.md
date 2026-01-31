# Quickstart: AI Image Node Settings

**Feature**: 053-ai-image-node-settings
**Date**: 2026-01-31

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Firebase project configured (local emulators or remote)

## Setup

```bash
# From monorepo root
cd apps/clementine-app

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Accessing the Feature

1. Navigate to an Experience in the designer
2. Go to the "Generate" tab
3. Add an AI Image node (or expand an existing one)
4. The PromptComposer appears in the expanded node settings

## File Locations

### New Components (to create)

```
apps/clementine-app/src/domains/experience/generate/components/
├── PromptComposer/
│   ├── PromptComposer.tsx        # Main container (drop zone)
│   ├── PromptInput.tsx           # Multiline textarea
│   ├── ControlRow.tsx            # Bottom row with selects + button
│   ├── ReferenceMediaStrip.tsx   # Thumbnail strip (includes uploading items)
│   ├── ReferenceMediaItem.tsx    # Single thumbnail with remove
│   ├── AddMediaButton.tsx        # Plus button with native file input
│   └── index.ts                  # Barrel export
```

### Existing Files to Modify

```
apps/clementine-app/src/domains/experience/generate/
├── components/
│   ├── NodeListItem/
│   │   └── AIImageNode.tsx       # Wire PromptComposer into settings
│   └── index.ts                  # Export PromptComposer
└── lib/
    └── transform-operations.ts   # Add refMedia helper functions
```

### Reusable Hooks & Components

```
apps/clementine-app/src/
├── domains/media-library/
│   └── hooks/
│       └── useUploadMediaAsset.ts   # File upload hook
└── ui-kit/components/               # shadcn/ui components
```

## Component Props Reference

### PromptComposer

```typescript
interface PromptComposerProps {
  node: AIImageNode
  transform: TransformConfig
  onUpdate: (transform: TransformConfig) => void
  disabled?: boolean
}
```

### Usage in AIImageNodeSettings

```typescript
import { PromptComposer } from '../PromptComposer'

export function AIImageNodeSettings({ node, transform, onUpdate }: Props) {
  return (
    <PromptComposer
      node={node}
      transform={transform}
      onUpdate={onUpdate}
    />
  )
}
```

## Testing the Feature

### Manual Testing Checklist

1. **Prompt Editing**
   - [ ] Enter text in prompt field
   - [ ] Verify prompt saves (check devtools network tab)
   - [ ] Clear prompt → see "Prompt is required" error

2. **Model Selection**
   - [ ] Open model dropdown
   - [ ] Select different model
   - [ ] Verify selection persists after refresh

3. **Aspect Ratio Selection**
   - [ ] Open aspect ratio dropdown
   - [ ] Select different ratio
   - [ ] Verify selection persists after refresh

4. **Reference Media - File Picker (Multi-Select)**
   - [ ] Click plus button → file picker opens
   - [ ] Select single image → verify upload and thumbnail
   - [ ] Select multiple images → verify all upload and appear
   - [ ] Click remove (✕) → verify removal

5. **Reference Media - Drag & Drop (Multi-File)**
   - [ ] Drag single image over composer → verify highlight
   - [ ] Drop single image → verify upload and thumbnail
   - [ ] Drag multiple images → drop → verify all upload
   - [ ] Drag non-image file → verify rejection (no upload)

6. **Edge Cases**
   - [ ] Add 10 references → verify can't add more
   - [ ] Try adding duplicate → verify no duplicate
   - [ ] Empty refMedia → verify strip hidden

## Validation

```bash
# Run all checks before committing
pnpm app:check

# Individual checks
pnpm app:lint
pnpm app:type-check
pnpm app:format

# Run tests
pnpm app:test
```

## Standards Review

Before marking complete, review against:
- `standards/frontend/design-system.md` - Theme tokens, colors
- `standards/frontend/component-libraries.md` - shadcn/ui usage
- `standards/frontend/accessibility.md` - Keyboard nav, ARIA

## Debugging Tips

### Transform Updates Not Saving

1. Check devtools Network tab for Firestore requests
2. Verify `useUpdateTransformConfig` mutation is called
3. Check Sentry for error captures

### File Upload Not Working

1. Check `useUploadMediaAsset` hook is imported from media-library
2. Verify workspaceId and userId are available
3. Check Network tab for Storage upload requests
4. Look for Sentry errors on upload failure

### Drag-Drop Not Working

1. Check browser console for drag events
2. Verify event handlers attached (ondragover, ondrop)
3. Test in different browsers (Safari has quirks)

## Related Documentation

- [Spec](./spec.md) - Feature requirements
- [Plan](./plan.md) - Implementation approach
- [Data Model](./data-model.md) - Schema details
- [Contracts](./contracts/firestore-updates.md) - Mutation contracts
