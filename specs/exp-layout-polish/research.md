# Research: Experience Layout Polish

**Feature**: Experience Layout Polish
**Date**: 2026-02-04

## Research Questions

### 1. Current Scroll Container Placement

**Question**: Where is `overflow-auto` currently applied and what are its effects?

**Finding**:
- `ThemedBackground` line 96 has `overflow-auto` on the inner position wrapper
- This causes the entire content including `RuntimeTopBar` to scroll together
- Background appears to scroll because it's inside the scroll container hierarchy

**Decision**: Move scroll handling out of `ThemedBackground` to consumers
**Rationale**: Each consumer knows best what should scroll; ThemedBackground should be a simple background + max-width wrapper
**Alternatives Considered**:
- Add `disableScroll` prop to ThemedBackground - Rejected: adds complexity, implicit behavior
- Use CSS `position: sticky` for TopBar - Rejected: more complex, browser inconsistencies

### 2. Flexbox Layout Strategy

**Question**: What flexbox pattern best achieves static TopBar with scrolling content?

**Finding**:
```
Container (flex-col, h-full)
├── TopBar (shrink-0) ← never compresses, never scrolls
└── Content (flex-1, overflow-y-auto) ← fills remaining space, scrolls
```

**Decision**: Use flex column with `shrink-0` on TopBar and `overflow-y-auto` on content wrapper
**Rationale**:
- `shrink-0` prevents TopBar from compressing when content overflows
- `flex-1` on content area fills remaining space
- `overflow-y-auto` creates scroll context only for content
- No height calculations needed - flexbox handles distribution naturally

**Alternatives Considered**:
- Fixed positioning for TopBar - Rejected: requires padding calculations, z-index management
- Grid layout - Rejected: more complex for simple two-row layout

### 3. WelcomeRenderer Background Handling

**Question**: Should WelcomeRenderer continue to embed ThemedBackground or should the container own it?

**Finding**:
- Current: WelcomeRenderer embeds ThemedBackground internally
- Other pages: Container owns ThemedBackground (ExperiencePage, SharePage, etc.)
- This inconsistency makes layout reasoning difficult

**Decision**: Container owns ThemedBackground; renderer is pure content
**Rationale**:
- Consistent pattern across all guest pages
- Renderer becomes simpler (no background responsibility)
- Container controls the full viewport layout

**Alternatives Considered**:
- Keep ThemedBackground in renderer, modify behavior - Rejected: maintains inconsistency

### 4. Share Renderers Scroll Strategy

**Question**: How should ShareLoadingRenderer and ShareReadyRenderer handle scrolling?

**Finding**:
- `ShareReadyRenderer` already has internal scroll wrapper (line 119): `overflow-y-auto`
- `ShareLoadingRenderer` has no scroll handling, relies on parent
- Both are used in contexts without TopBar (no fixed elements)

**Decision**: Both renderers handle their own scroll (self-contained pattern)
**Rationale**:
- Pages without fixed elements (TopBar) have renderers that are self-contained
- Pattern: renderer owns scroll = simpler container
- Consistency between Loading and Ready states

**Alternatives Considered**:
- Container creates scroll wrapper - Rejected: renderers already need to manage internal layout

### 5. Safe Area and Keyboard Handling

**Question**: Do the layout changes affect safe area insets or keyboard behavior?

**Finding**:
- Safe areas: `StepLayout` already handles with `pb-20` for bottom buttons
- Keyboard: Fixed bottom buttons use padding, not viewport units
- No changes needed - existing patterns work with new layout

**Decision**: Preserve existing safe area and keyboard patterns
**Rationale**: Current implementation is correct; layout refactor doesn't affect these concerns

### 6. Editor Preview Compatibility

**Question**: How do the changes affect editor preview modes (WelcomeEditorPage, ShareEditorPage)?

**Finding**:
- `PreviewShell` provides containment for editor previews
- After WelcomeRenderer changes, editor page needs to provide ThemedBackground
- ShareEditorPage already uses SharePage which owns ThemedBackground

**Decision**: WelcomeEditorPage wraps WelcomeRenderer with ThemedBackground
**Rationale**: Maintains consistency - editor preview should match runtime experience

## Technology Best Practices

### Tailwind CSS Flexbox Layout

**Best Practices Applied**:
1. Use `h-full` to inherit parent height (not `h-screen` in nested components)
2. Use `flex-1` for flex-grow + flex-shrink (not explicit values)
3. Use `shrink-0` to prevent compression of fixed-size elements
4. Use `overflow-y-auto` (not `overflow-scroll`) to only show scrollbar when needed

### React Component Composition

**Best Practices Applied**:
1. Container components own layout concerns
2. Renderer components focus on content
3. Avoid prop drilling for layout control
4. Use className props for customization, not behavior flags

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Scroll container location | Move from ThemedBackground to ExperienceRuntime | Single responsibility, consumer knows what scrolls |
| TopBar static behavior | Flex column + shrink-0 | Natural height distribution, no calculations |
| WelcomeRenderer background | Container owns ThemedBackground | Consistency with other guest pages |
| Share renderers scroll | Self-contained (own scroll) | Pages without fixed elements have self-contained renderers |
| Safe areas/keyboard | No changes | Existing patterns work correctly |
| Editor previews | WelcomeEditorPage adds ThemedBackground | Match runtime experience |
