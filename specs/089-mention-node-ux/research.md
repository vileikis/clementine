# Research: Lexical Mention Node UX Improvements

**Feature Branch**: `089-mention-node-ux`
**Date**: 2026-03-06

## Research Questions

### RQ-1: Why does cursor navigation break around mention nodes?

**Decision**: The root cause is the `contenteditable="false"` attribute and `user-select: none` CSS applied in `createDOM()`, which conflict with Lexical's TextNode cursor model.

**Rationale**: Both `StepMentionNode` and `MediaMentionNode` extend `TextNode` and use `segmented` mode. Lexical's cursor engine expects to navigate character-by-character through TextNode content. However, the DOM element has `contenteditable="false"` and `user-select: none`, which tells the browser the element is not editable — creating a conflict. The browser cannot place a caret inside or adjacent to a `contenteditable="false"` span when it's the only content in a paragraph, because there's no editable text anchor point.

The Lexical playground's official MentionNode implementation uses the same TextNode extension pattern (`segmented` mode, `canInsertTextBefore/After = false`, `isTextEntity = true`) but does **NOT** set `contenteditable="false"` or `user-select: none`. These attributes are unnecessary because `canInsertTextBefore/After = false` already prevents text from being typed into the mention node — Lexical handles this at the editor state level, not the DOM level.

**Alternatives considered**:
- **Switch to DecoratorNode**: Would give full React rendering but causes worse cursor issues (selection becomes `null` over decorator nodes, known issue #3157 where cursor cannot be placed between consecutive decorator nodes). Rejected.
- **Add a cursor-management plugin**: A plugin intercepting arrow key commands could work around the issue, but it would be treating symptoms rather than fixing the root cause. Rejected in favor of fixing the DOM attributes.
- **Use `token` mode instead of `segmented`**: Token mode changes deletion behavior (entire node deleted on single backspace vs word-by-word). This is a separate concern from cursor navigation and doesn't fix the `contenteditable="false"` issue. Could be considered as an enhancement but not required for the cursor fix.

### RQ-2: What is the correct approach for hover-based deletion of TextNode mention nodes?

**Decision**: Use a plugin-based approach with `registerMutationListener` to inject a delete button into the mention DOM element, using CSS `:hover` for show/hide and a JS click handler for node removal.

**Rationale**: Three approaches were evaluated:

1. **DecoratorNode approach** — Provides full React rendering but requires rewriting both node classes, all plugins (validation, copy, paste, serialization), and introduces cursor/selection issues. Over-engineered for a simple X button.

2. **DOM manipulation in `createDOM()`** — Could inject the button structure, but attaching interactive event listeners in `createDOM()` is explicitly discouraged by Lexical maintainers. `editor.update()` is not available in `createDOM()` context.

3. **Plugin with mutation listener (chosen)** — Clean separation of concerns. The `registerMutationListener` API notifies when mention nodes are created/updated in the DOM. The plugin injects an absolutely-positioned delete button, uses pure CSS `:hover` for visibility toggling, and attaches a click handler that calls `editor.update(() => node.remove())`. No changes needed to existing node classes.

**Alternatives considered**:
- **`NodeEventPlugin` from `@lexical/react`**: Available in the project's `@lexical/react@^0.39.0`. Useful for simple event delegation but requires separate instances for `mouseenter` and `mouseleave`, making hover management awkward. Better suited for single-event use cases.
- **Floating overlay component**: Using `@floating-ui/react` (already a dependency) to render a floating delete button near the hovered mention. Over-engineered — the mention pill is small, and an absolutely-positioned child element is simpler and more performant.

### RQ-3: How should node removal work programmatically?

**Decision**: Use `editor.update(() => { const node = $getNodeByKey(nodeKey); if (node) node.remove(); })` with `e.preventDefault()` and `e.stopPropagation()` on both `click` and `mousedown` events of the delete button.

**Rationale**: `node.remove()` must be called inside `editor.update()` to properly update the editor state. `$getNodeByKey()` retrieves the node by its Lexical key, which is stable for the lifetime of the node. Both `preventDefault` and `stopPropagation` on `mousedown` and `click` are needed to prevent:
1. The browser from moving focus/selection
2. Lexical's root click handler from processing the event
3. The click from being interpreted as a mention node click

### RQ-4: Will removing `contenteditable="false"` break mention text integrity?

**Decision**: No. `canInsertTextBefore()` and `canInsertTextAfter()` returning `false` already prevent typed text from being inserted into the mention node at the Lexical state level. The DOM attribute is redundant.

**Rationale**: Lexical manages text insertion through its own state model, not through DOM `contenteditable` attributes. When `canInsertTextBefore/After` return `false`, Lexical creates a new sibling TextNode for any typed characters, leaving the mention content intact. Removing the attribute restores the browser's ability to place a caret adjacent to the span element, fixing cursor navigation.

**Note**: `user-select: none` should also be removed. While it prevents visual text selection highlighting within the mention, it interferes with the browser's ability to compute caret positions. The `segmented` mode already handles selection behavior at the Lexical level (the entire node is selected as a unit when part of a selection range).

## Lexical Version & API Compatibility

- **Lexical version**: `^0.39.0` (both `lexical` and `@lexical/react`)
- **`registerMutationListener`**: Stable API, available since early versions
- **`$getNodeByKey`**: Stable API
- **`node.remove()`**: Stable API
- **`NodeEventPlugin`**: Available in `@lexical/react` but not required for chosen approach

## Summary of Changes

| File | Change Type | Description |
|------|------------|-------------|
| `StepMentionNode.tsx` | Modify | Remove `contenteditable="false"` and `user-select: none` from `createDOM()`. Add `position: relative` for delete button anchoring. |
| `MediaMentionNode.tsx` | Modify | Same changes as StepMentionNode. |
| `MentionDeletePlugin.tsx` | New file | Plugin using `registerMutationListener` to inject delete button and handle click-to-remove. |
| `plugins/index.ts` | Modify | Add barrel export for `MentionDeletePlugin`. |
| `LexicalPromptInput.tsx` | Modify | Register `MentionDeletePlugin` in the plugin stack. |
