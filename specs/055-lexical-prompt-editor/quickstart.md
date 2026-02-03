# Quickstart: Lexical Prompt Editor with Mentions

**Feature**: 055-lexical-prompt-editor
**Date**: 2026-02-01

## Overview

This guide helps developers get started with implementing the Lexical prompt editor feature. The implementation replaces a plain textarea with a rich text editor that supports "@" mentions for experience steps and media references.

## Prerequisites

- Node.js 20+
- pnpm 10.x
- Lexical dependencies (already installed)
- Understanding of Lexical editor concepts (nodes, plugins, serialization)

## Quick Reference

### Key Files to Create

```text
apps/clementine-app/src/domains/experience/generate/
└── lexical/
    ├── index.ts
    ├── nodes/
    │   ├── index.ts
    │   ├── StepMentionNode.tsx
    │   └── MediaMentionNode.tsx
    ├── plugins/
    │   ├── index.ts
    │   ├── MentionsPlugin.tsx
    │   ├── SmartPastePlugin.tsx
    │   └── MentionValidationPlugin.tsx
    └── utils/
        ├── index.ts
        ├── types.ts
        └── serialization.ts
```

### Key Files to Modify

```text
apps/clementine-app/src/domains/experience/generate/components/PromptComposer/
├── PromptComposer.tsx        # Pass steps to LexicalPromptInput
├── LexicalPromptInput.tsx    # NEW: Replace PromptInput
└── index.ts                  # Update exports
```

## Implementation Steps

### Step 1: Copy Base Infrastructure

Copy these files from `domains/ai-presets/lexical/` to `domains/experience/generate/lexical/`:

```bash
# From project root
cp apps/clementine-app/src/domains/ai-presets/lexical/nodes/MediaMentionNode.tsx \
   apps/clementine-app/src/domains/experience/generate/lexical/nodes/

cp apps/clementine-app/src/domains/ai-presets/lexical/plugins/SmartPastePlugin.tsx \
   apps/clementine-app/src/domains/experience/generate/lexical/plugins/
```

### Step 2: Create StepMentionNode

Adapt `VariableMentionNode.tsx` → `StepMentionNode.tsx`:

```typescript
// Key changes from VariableMentionNode:
// 1. Rename variable → step
// 2. Store stepName (used for both display AND storage - human-readable)
// 3. Store stepType for icon selection
// 4. Blue pill styling for all step types
// 5. Export $createStepMentionNode, $isStepMentionNode

export class StepMentionNode extends TextNode {
  __stepName: string              // Used for storage: @{step:stepName}
  __stepType: ExperienceStepType  // For icon display
  __isInvalid: boolean            // True if name no longer matches any step

  // ... implementation
}
```

### Step 3: Adapt MentionsPlugin

Key changes from ai-presets version:

```typescript
interface MentionsPluginProps {
  steps: StepOption[]     // Instead of variables
  media: MediaOption[]    // Same as before
}

// Show step type icons in autocomplete:
// 📝 for input steps
// 📷 for capture steps
```

### Step 4: Implement Serialization

```typescript
// serialization.ts

// Serialize: EditorState → @{step:name} format (human-readable)
export function serializeToPlainText(editorState: EditorState): string {
  return editorState.read(() => {
    const root = $getRoot()
    let text = ''

    root.getChildren().forEach((node) => {
      if (!$isParagraphNode(node)) return

      node.getChildren().forEach((child) => {
        if ($isStepMentionNode(child)) {
          // Use step name (human-readable) for storage
          text += `@{step:${child.getStepName()}}`
        } else if ($isMediaMentionNode(child)) {
          // Use display name (human-readable) for storage
          text += `@{ref:${child.getMediaName()}}`
        } else if ($isTextNode(child)) {
          text += child.getTextContent()
        }
      })
      text += '\n'
    })

    return text.trim()
  })
}

// Deserialize: @{step:name} format → EditorState
export function deserializeFromPlainText(
  editor: LexicalEditor,
  text: string,
  steps: StepOption[],
  media: MediaOption[]
): void {
  // Parse @{step:name} patterns - match by step name
  // Parse @{ref:name} patterns - match by display name
  // Create nodes if names match; mark as invalid if no match
}
```

### Step 5: Create LexicalPromptInput

```typescript
// LexicalPromptInput.tsx

interface LexicalPromptInputProps {
  value: string
  onChange: (value: string) => void
  steps: StepOption[]
  media: MediaOption[]
  disabled?: boolean
}

export function LexicalPromptInput({
  value,
  onChange,
  steps,
  media,
  disabled,
}: LexicalPromptInputProps) {
  const initialConfig: InitialConfigType = {
    namespace: 'PromptEditor',
    nodes: [StepMentionNode, MediaMentionNode],
    onError: console.error,
    editable: !disabled,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={handleChange} />
      <MentionsPlugin steps={steps} media={media} />
      <SmartPastePlugin steps={steps} media={media} />
      <MentionValidationPlugin steps={steps} media={media} />
      <InitializePlugin value={value} steps={steps} media={media} />
    </LexicalComposer>
  )
}
```

### Step 6: Update PromptComposer

```typescript
// PromptComposer.tsx

interface PromptComposerProps {
  node: AIImageNode
  transformNodes: TransformNode[]
  steps: ExperienceStep[]  // NEW: Add steps prop
  workspaceId: string
  onUpdate: (nodes: TransformNode[]) => void
  disabled?: boolean
}

export function PromptComposer({
  node,
  transformNodes,
  steps,
  // ...
}: PromptComposerProps) {
  // Convert steps to StepOption format (exclude info steps)
  const stepOptions = useMemo(() =>
    steps
      .filter(s => s.type !== 'info')
      .map(toStepOption),
    [steps]
  )

  // Convert refMedia to MediaOption format
  const mediaOptions = useMemo(() =>
    config.refMedia.map(toMediaOption),
    [config.refMedia]
  )

  return (
    <div>
      <LexicalPromptInput
        value={localPrompt}
        onChange={setLocalPrompt}
        steps={stepOptions}
        media={mediaOptions}
        disabled={disabled}
      />
      {/* ... rest of component */}
    </div>
  )
}
```

## Testing the Feature

### Manual Testing

1. **Trigger autocomplete**: Type "@" in the prompt editor
2. **Navigate**: Use arrow keys to move between options
3. **Select**: Press Enter or click to insert mention
4. **Filter**: Type "@pet" to filter options
5. **Delete**: Backspace to remove mention as atomic unit
6. **Load**: Reload page to verify deserialization

### Unit Tests

```typescript
// serialization.test.ts

describe('serializeToPlainText', () => {
  it('converts step mentions to @{step:name} format', () => {
    // Test: StepMentionNode with name "Pet Choice" → "@{step:Pet Choice}"
  })

  it('converts media mentions to @{ref:name} format', () => {
    // Test: MediaMentionNode with name "cat.jpeg" → "@{ref:cat.jpeg}"
  })
})

describe('deserializeFromPlainText', () => {
  it('parses @{step:name} and creates StepMentionNode', () => {
    // Test: "@{step:Pet Choice}" with matching step → valid StepMentionNode
  })

  it('marks unmatched step names as invalid', () => {
    // Test: "@{step:Deleted Step}" with no match → invalid StepMentionNode
  })

  it('handles step renames gracefully', () => {
    // Test: Old name in storage, step renamed → shows invalid state
  })
})
```

## Common Issues

### Issue: Autocomplete doesn't appear

**Cause**: MentionsPlugin not registered or trigger character not detected

**Solution**: Verify plugin is included in LexicalComposer and `@` is the trigger

### Issue: Mentions not serializing correctly

**Cause**: Node not returning correct type in exportJSON

**Solution**: Check `type` field in `exportJSON()` matches registered node type

### Issue: Cursor trapped in mention

**Cause**: Missing space after mention at end of paragraph

**Solution**: Add trailing space in deserialization when mention is at paragraph end

### Issue: Steps not appearing in autocomplete

**Cause**: Steps not filtered from info type or not converted to StepOption

**Solution**: Verify `steps.filter(s => s.type !== 'info')` and `toStepOption` adapter

## Reference Links

- [Lexical Documentation](https://lexical.dev/docs/intro)
- [Existing ai-presets/lexical implementation](../../apps/clementine-app/src/domains/ai-presets/lexical/)
- [Feature Specification](./spec.md)
- [Research Document](./research.md)
- [Data Model](./data-model.md)
- [Future Session Schema Refactor](./future-session-schema-refactor.md) - Required for backend prompt resolution
