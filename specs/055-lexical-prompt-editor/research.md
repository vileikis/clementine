# Research: Lexical Prompt Editor with Mentions

**Feature**: 055-lexical-prompt-editor
**Date**: 2026-02-01

## Research Questions

### Q1: Can we reuse the existing Lexical implementation from ai-presets?

**Decision**: Yes, copy and adapt (not share) the existing implementation.

**Rationale**:
- The `ai-presets/lexical/` subdomain provides battle-tested nodes, plugins, and serialization
- Domain-specific modifications needed (step mentions vs variable mentions)
- The ai-presets domain is deprecated; copying prevents coupling to deprecated code
- Allows independent evolution of both implementations

**Alternatives considered**:
1. **Shared module** - Rejected: Would couple experience domain to deprecated ai-presets
2. **Build from scratch** - Rejected: Reinventing working patterns unnecessarily
3. **Extract to shared package** - Rejected: Over-engineering for current scope

### Q2: What is the serialization format for mentions?

**Decision**: Use human-readable names for both steps and media: `@{step:stepName}` and `@{ref:displayName}`.

**Rationale**:
- Debuggability wins at this stage - prompts in Firestore are immediately understandable
- Rename risk is manageable - validation plugin shows invalid mentions, authors can fix
- Consistent pattern for both mention types
- Simpler backend resolution (direct lookup by name)

**Storage format examples**:
```text
Create a portrait of @{step:Pet Choice} with @{ref:summer background.jpeg} style.
```

**Display format** (same as storage, shown as pills):
```text
Create a portrait of @Pet Choice with @summer background.jpeg style.
```

**Trade-off acknowledged**: If a step or media is renamed, existing references become invalid and show error state. This is visible to authors who can update the prompt.

**Backend prerequisite**: Session schema needs `stepName` field for resolution. See `future-session-schema-refactor.md`.

### Q3: What step types should be available for mention?

**Decision**: All step types except `info` steps.

**Rationale**:
- Input steps (`input.*`) have user-provided values → useful for prompt personalization
- Capture steps (`capture.photo`) have media assets → useful for subject photos
- Info steps have no runtime value → not useful for AI prompts

**Step categories**:
| Step Type | Include | Resolved Value |
|-----------|---------|----------------|
| input.scale | ✅ | Numeric value |
| input.yesNo | ✅ | Boolean/label |
| input.multiSelect | ✅ | Selected options |
| input.shortText | ✅ | User text |
| input.longText | ✅ | User text |
| capture.photo | ✅ | mediaAssetId |
| info | ❌ | No runtime value |

### Q4: How should the autocomplete menu organize steps and media?

**Decision**: Single menu with sections - Steps first, then Media.

**Rationale**:
- Matches existing `MentionsPlugin` pattern in ai-presets
- Users typically reference steps more than static media
- Clear visual separation with section headers

**Menu structure**:
```text
┌─────────────────────────┐
│ Steps                   │
│ ├─ 📝 Pet Choice        │
│ ├─ 📷 Photo             │
│ └─ 📝 Favorite Color    │
│ Media                   │
│ ├─ 🖼️ Summer Background │
│ └─ 🖼️ Vintage Filter    │
└─────────────────────────┘
```

### Q5: How should invalid mentions be handled?

**Decision**: Display with error styling (red, strikethrough) but preserve in storage.

**Rationale**:
- Matches existing `MentionValidationPlugin` pattern
- Allows users to see which mentions need attention
- Non-destructive: user can fix by re-adding valid mention
- Storage preserves invalid references for debugging

**Error states**:
- Step deleted/renamed: `@{step:Old Name}` → Shows as red strikethrough pill (name no longer matches)
- Media deleted/renamed: `@{ref:old name.jpeg}` → Shows as red strikethrough pill
- Reference resolves at load time by name matching; validation runs on step/media changes

## Existing Codebase Analysis

### Source: ai-presets/lexical/

**Files to copy/adapt**:

| File | Action | Changes Needed |
|------|--------|----------------|
| `nodes/VariableMentionNode.tsx` | ADAPT → `StepMentionNode.tsx` | Rename variable→step, store name instead of ID |
| `nodes/MediaMentionNode.tsx` | ADAPT | Store displayName instead of mediaAssetId |
| `plugins/MentionsPlugin.tsx` | ADAPT | Accept steps array, show step type icons |
| `plugins/SmartPastePlugin.tsx` | ADAPT | Parse `@{step:name}` format |
| `plugins/MentionValidationPlugin.tsx` | ADAPT | Validate by name matching against steps + refMedia |
| `utils/serialization.ts` | ADAPT | New format: `@{step:name}` and `@{ref:name}` |
| `utils/types.ts` | ADAPT | Add StepOption type |

### Source: experience/generate/components/PromptComposer/

**Files to modify**:

| File | Changes |
|------|---------|
| `PromptInput.tsx` | DELETE (replaced by LexicalPromptInput) |
| `PromptComposer.tsx` | Pass steps and refMedia to LexicalPromptInput |
| `index.ts` | Update exports |

### Data Flow

```text
AIImageNodeSettings
    ↓ passes node, transformNodes, workspaceId, onUpdate
PromptComposer
    ↓ extracts config.prompt, config.refMedia
    ↓ receives steps from parent context (experience.draft.steps)
LexicalPromptInput
    ↓ receives value, onChange, steps, refMedia
    ↓ initializes Lexical with deserializeFromPlainText()
    ↓ serializes on change with serializeToPlainText()
    ↓ calls onChange(serializedPrompt)
```

### Step Data Access

Steps are available from the experience context. The PromptComposer will need to receive steps from a parent component or context.

**Option 1: Props drilling** (simpler)
```tsx
interface PromptComposerProps {
  node: AIImageNode
  transformNodes: TransformNode[]
  steps: ExperienceStep[]  // NEW
  workspaceId: string
  onUpdate: (nodes: TransformNode[]) => void
}
```

**Option 2: Context** (if steps needed elsewhere)
```tsx
const { steps } = useExperienceDesigner()
```

**Decision**: Props drilling - simpler, explicit data flow, no new context needed.

## Type Definitions

### StepOption (for MentionsPlugin)

```typescript
interface StepOption {
  id: string           // Step UUID
  name: string         // Display name (e.g., "Pet Choice")
  type: ExperienceStepType  // Step type for icon selection
}
```

### MediaOption (existing)

```typescript
interface MediaOption {
  id: string           // mediaAssetId
  name: string         // displayName
}
```

### Serialization Patterns

**Parse regex**:
```typescript
const STEP_REGEX = /@\{step:([^}]+)\}/g
const MEDIA_REGEX = /@\{ref:([^}]+)\}/g
```

**Serialize function**:
```typescript
function serializeToPlainText(editorState: EditorState): string {
  // StepMentionNode → @{step:stepName}
  // MediaMentionNode → @{ref:displayName}
  // TextNode → plain text
}
```

**Deserialize function**:
```typescript
function deserializeFromPlainText(
  editor: LexicalEditor,
  text: string,
  steps: StepOption[],
  media: MediaOption[]
): void {
  // @{step:name} → StepMentionNode (if name matches a step)
  // @{ref:name} → MediaMentionNode (if name matches a media)
  // unmatched mentions → show as invalid (error styling)
  // other text → TextNode
}
```

## Performance Considerations

1. **Autocomplete filtering**: Use memoized filter with useMemo to avoid re-filtering on every render
2. **Debounced serialization**: Already implemented in PromptComposer (2000ms)
3. **Mention validation**: Use 100ms timeout to batch validation (existing pattern)
4. **Step/media lookups**: O(n) lookup acceptable for typical experience size (<20 steps)

## Accessibility Requirements

1. **Keyboard navigation**: Arrow keys, Enter, Escape (existing in MentionsPlugin)
2. **ARIA labels**: Menu has role="listbox", options have role="option"
3. **Focus management**: Focus returns to editor after selection
4. **Touch targets**: Minimum 44x44px for autocomplete items
5. **Screen reader**: Announce "X suggestions available" when menu opens

## Summary

The implementation leverages proven patterns from `ai-presets/lexical/` with minimal adaptation:

1. **Adapt** VariableMentionNode → StepMentionNode (store name, not ID)
2. **Adapt** MediaMentionNode (store displayName, not mediaAssetId)
3. **Adapt** MentionsPlugin (accept steps, show type icons)
4. **Adapt** serialization (human-readable `@{step:name}` and `@{ref:name}` format)
5. **Create** LexicalPromptInput component
6. **Update** PromptComposer to pass steps and use new component

**Key decision**: Using human-readable names for storage (not IDs) for debuggability. Trade-off is that renames invalidate references, but this is visible via validation plugin.

All NEEDS CLARIFICATION items resolved.
