# Implementation Plan: Lexical Mention Node UX Improvements

**Branch**: `089-mention-node-ux` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/089-mention-node-ux/spec.md`

## Summary

Fix cursor hijacking bugs in Lexical mention nodes caused by redundant `contenteditable="false"` and `user-select: none` DOM attributes that conflict with Lexical's TextNode cursor model. Add a hover-activated close icon for mouse-based mention deletion using a new plugin with `registerMutationListener` and CSS `:hover`.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Lexical ^0.39.0, @lexical/react ^0.39.0, React 19, Lucide React (icons)
**Storage**: N/A (no data persistence changes)
**Testing**: Vitest (unit tests), manual testing for cursor behavior
**Target Platform**: Web (desktop browsers; touch devices unaffected by hover feature)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Close icon visible within 150ms of hover, zero layout shift
**Constraints**: Must not break existing mention serialization/deserialization, must work with PlainTextPlugin
**Scale/Scope**: 5 files modified/created in the Lexical editor domain

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Hover delete is desktop-only; touch users retain keyboard deletion. No mobile regression. |
| II. Clean Code & Simplicity | PASS | Minimal changes: remove redundant DOM attributes (cursor fix), add one small plugin (delete). No new abstractions. |
| III. Type-Safe Development | PASS | All new code in TypeScript strict mode. No `any` types. |
| IV. Minimal Testing Strategy | PASS | Manual testing for cursor UX. Unit test for delete plugin node removal logic. |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` before completion. Standards compliance review for frontend/design-system. |
| VI. Frontend Architecture | PASS | Client-only changes within the Lexical editor domain. No server code. |
| VII. Backend & Firebase | N/A | No backend changes. |
| VIII. Project Structure | PASS | New plugin follows existing pattern in `lexical/plugins/`. Barrel exports maintained. |

**Post-Design Re-Check**: All gates still pass. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/089-mention-node-ux/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model (no changes)
├── quickstart.md        # Phase 1 quickstart guide
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/experience/create/
├── lexical/
│   ├── nodes/
│   │   ├── StepMentionNode.tsx          # MODIFY: Remove contenteditable="false", user-select: none; add position: relative
│   │   └── MediaMentionNode.tsx         # MODIFY: Same changes as StepMentionNode
│   ├── plugins/
│   │   ├── MentionDeletePlugin.tsx      # NEW: Hover close icon + click-to-remove plugin
│   │   └── index.ts                     # MODIFY: Add MentionDeletePlugin export
│   └── utils/
│       └── serialization.ts             # NO CHANGE: Verify serialization still works
└── components/
    └── PromptComposer/
        └── LexicalPromptInput.tsx       # MODIFY: Register MentionDeletePlugin
```

**Structure Decision**: All changes stay within the existing `lexical/` module under the `experience/create` domain. One new plugin file follows the established plugin pattern. No new directories needed.

## Design Decisions

### D1: Cursor Fix — Remove Redundant DOM Attributes

**Problem**: `StepMentionNode.createDOM()` and `MediaMentionNode.createDOM()` set `contenteditable="false"` (line 126 / line 102) and `user-select: none` (CSS). These browser-level attributes conflict with Lexical's TextNode cursor model, preventing the browser from computing caret positions adjacent to mention spans.

**Solution**: Remove both attributes from `createDOM()` in both node classes. Lexical already prevents text insertion via `canInsertTextBefore/After() = false` at the editor state level. The DOM attributes are redundant.

**Evidence**: The official Lexical playground MentionNode uses the same TextNode extension with `segmented` mode and `canInsertTextBefore/After = false` but does NOT set `contenteditable="false"` or `user-select: none`.

**Risk**: Low. The `canInsertTextBefore/After` guard is the authoritative mechanism for text insertion prevention. The DOM attributes were defense-in-depth but caused the cursor bug.

### D2: Hover Delete — Plugin with Mutation Listener + CSS :hover

**Problem**: Users need a mouse-based way to delete mention nodes.

**Solution**: New `MentionDeletePlugin` that:
1. Uses `editor.registerMutationListener()` for both `StepMentionNode` and `MediaMentionNode`
2. On node creation, injects an absolutely-positioned `<span>` delete button as the first child of the mention DOM element
3. Uses CSS `:hover` pseudo-class on the parent `.step-mention` / `.media-mention` class to show/hide the delete button (no JavaScript hover tracking)
4. Attaches `mousedown` + `click` handlers on the delete button with `preventDefault()` + `stopPropagation()` to prevent cursor interference
5. On click, calls `editor.update(() => { $getNodeByKey(key)?.remove() })`
6. Checks `editor.isEditable()` before injecting delete buttons; skips injection for read-only editors

**Why CSS :hover instead of JS events**: Pure CSS is more performant (no event listener overhead for hover in/out), simpler (no state management), and automatically handles edge cases like rapid mouse movements.

**Why mutation listener instead of DOM-in-createDOM**: Lexical maintainers explicitly discourage attaching interactive event listeners in `createDOM()`. The mutation listener pattern is the canonical approach for adding DOM-level interactivity to Lexical nodes.

### D3: Position: Relative on Mention Nodes

**Why**: The delete button needs `position: absolute` to avoid layout shift. Its containing block must be the mention span, which requires `position: relative` on the parent.

**Where**: Added to the `createDOM()` inline styles in both node classes (alongside the cursor fix changes).

### D4: Delete Button Styling

**Appearance**:
- Small X icon (Lucide `X` icon rendered as inline SVG, or a simple `×` text character for simplicity since this is DOM manipulation, not React)
- Positioned at the left edge of the mention, vertically centered
- Semi-transparent background circle for visibility against the mention's background color
- Size: ~14×14px to stay within the mention pill height

**Behavior**:
- Hidden by default (`display: none`)
- Shown on parent hover via CSS rule (`.step-mention:hover .mention-delete-btn, .media-mention:hover .mention-delete-btn`)
- `cursor: pointer` on the button
- `pointer-events: auto` on the button (ensure clickability)

### D5: CSS Injection Strategy

The hover show/hide requires a CSS rule targeting `.step-mention:hover .mention-delete-btn`. Since the mention nodes use inline styles and class names (not Tailwind), the plugin will inject a `<style>` element into the editor's container on mount (once), containing the minimal CSS rules for the delete button hover behavior. This avoids polluting global styles and keeps the CSS scoped to the editor context.

## File Change Details

### 1. `StepMentionNode.tsx` — Remove cursor-breaking attributes, add relative positioning

**Lines affected**: `createDOM()` method (lines 94–134)

**Changes**:
- Remove `user-select: none;` from `dom.style.cssText` (line 119)
- Add `position: relative;` to `dom.style.cssText`
- Remove `dom.setAttribute('contenteditable', 'false')` (line 126)

### 2. `MediaMentionNode.tsx` — Same changes as StepMentionNode

**Lines affected**: `createDOM()` method (lines 81–110)

**Changes**:
- Remove `user-select: none;` from `dom.style.cssText` (line 96)
- Add `position: relative;` to `dom.style.cssText`
- Remove `dom.setAttribute('contenteditable', 'false')` (line 102)

### 3. `MentionDeletePlugin.tsx` — New plugin (create)

**Location**: `lexical/plugins/MentionDeletePlugin.tsx`

**Structure**:
```
MentionDeletePlugin(props: { disabled?: boolean }): null
├── useLexicalComposerContext() → editor
├── useEffect → inject <style> for .mention-delete-btn hover rules
├── useEffect → registerMutationListener(StepMentionNode, callback)
├── useEffect → registerMutationListener(MediaMentionNode, callback)
└── callback: for each 'created' mutation:
    ├── Check editor.isEditable()
    ├── Get DOM element via editor.getElementByKey(key)
    ├── Create delete button <span> with inline styles
    ├── Attach mousedown handler (preventDefault + stopPropagation)
    └── Attach click handler (editor.update → node.remove())
```

**CSS rules injected**:
```css
.step-mention .mention-delete-btn,
.media-mention .mention-delete-btn {
  display: none;
}
.step-mention:hover .mention-delete-btn,
.media-mention:hover .mention-delete-btn {
  display: flex;
}
```

### 4. `plugins/index.ts` — Add export

Add: `export * from './MentionDeletePlugin'`

### 5. `LexicalPromptInput.tsx` — Register plugin

Add `<MentionDeletePlugin />` to the plugin stack, passing the `disabled` prop to suppress delete buttons in read-only mode.

## Complexity Tracking

No complexity violations. All changes follow existing patterns:
- Node class modifications are minimal (2 lines removed, 1 line added per class)
- New plugin follows the same pattern as existing `MentionValidationPlugin` (mutation listener)
- No new dependencies, abstractions, or architectural changes
