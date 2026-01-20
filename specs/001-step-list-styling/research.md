# Research: Step List Styling Updates

**Feature**: 001-step-list-styling
**Date**: 2026-01-20

## Research Topics

### 1. dnd-kit Full Element Dragging (No Dedicated Handle)

**Question**: How to enable drag-to-reorder from the entire step item instead of a dedicated drag handle?

**Decision**: Attach `listeners` and `attributes` from `useSortable` directly to the parent container element instead of a separate drag handle button.

**Rationale**: The dnd-kit documentation explicitly supports this pattern. By default, when `listeners` and `attributes` are attached to the same element as `setNodeRef`, the entire element becomes draggable. The current implementation separates these onto a dedicated drag handle button - we simply need to move them to the parent container.

**Alternatives Considered**:
- Keep the drag handle but make it invisible → Rejected: Adds unnecessary complexity, handle would still intercept clicks
- Use CSS to expand the drag handle to full width → Rejected: Hacky, accessibility issues

**Implementation Pattern**:
```tsx
// BEFORE: listeners/attributes on separate drag handle
<div ref={setNodeRef} style={style}>
  <button {...attributes} {...listeners}>
    <GripVertical />
  </button>
  <button onClick={onClick}>Content</button>
</div>

// AFTER: listeners/attributes on parent container
<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
  {/* Content - entire element is now draggable */}
</div>
```

**Sources**:
- [useSortable | @dnd-kit Documentation](https://docs.dndkit.com/presets/sortable/usesortable)
- [Sortable | @dnd-kit Documentation](https://docs.dndkit.com/presets/sortable)

---

### 2. Category-to-Color Token Mapping

**Question**: Which design system tokens to use for each step category?

**Decision**: Use existing semantic color tokens with opacity modifiers for subtle backgrounds.

| Category  | Background Class       | Icon/Foreground Class   |
|-----------|------------------------|-------------------------|
| info      | `bg-muted`             | `text-muted-foreground` |
| input     | `bg-info/10`           | `text-info`             |
| capture   | `bg-success/10`        | `text-success`          |
| transform | `bg-destructive/10`    | `text-destructive`      |

**Rationale**:
- `muted` is already a subtle grey, no opacity needed
- For colored categories, using `/10` opacity creates a subtle background that doesn't overpower the UI while maintaining visual distinction
- Using the semantic color for the foreground (icon) ensures proper contrast and meaning

**Alternatives Considered**:
- Full saturation backgrounds (e.g., `bg-info`) → Rejected: Too vibrant, distracting in a list
- `/20` opacity → Considered: May be used if `/10` is too subtle; test both
- Custom tokens for step categories → Rejected: Violates simplicity principle, existing tokens are sufficient

**Design System Compliance**:
- ✅ Uses only existing design tokens from `styles.css`
- ✅ Uses opacity modifiers per `frontend/design-system.md` Rule 5
- ✅ No hard-coded colors
- ✅ Works with dark mode (tokens have dark variants)

---

### 3. Icon Wrapper Styling

**Question**: What styling should the rounded colored icon wrapper have?

**Decision**: Use a small rounded square with subtle background color containing the icon.

```tsx
<div className={cn(
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
  categoryColorClasses.wrapper
)}>
  <Icon className={cn("h-4 w-4", categoryColorClasses.icon)} />
</div>
```

**Rationale**:
- `h-6 w-6` (24x24px) provides enough space for the icon with padding
- `rounded-md` creates a subtle rounded square (not fully circular)
- Centered icon with `items-center justify-center`
- `shrink-0` prevents wrapper from being squished in flex layouts

**Alternatives Considered**:
- Fully circular (`rounded-full`) → Could work, matter of preference
- Larger wrapper (`h-8 w-8`) → May be too prominent in the list

---

### 4. Cursor Behavior

**Question**: What cursor states should be shown for the step items?

**Decision**:
- Default (hover): `cursor-pointer` - indicates the item is clickable
- During drag: `cursor-grabbing` - indicates active drag operation
- Disabled: `cursor-default` - no special cursor

**Rationale**: Pointer cursor on hover provides clear affordance that the element is interactive. The grabbing cursor during drag is the standard UX pattern for drag operations.

**Implementation**:
```tsx
className={cn(
  'cursor-pointer', // Default hover state
  isDragging && 'cursor-grabbing',
  disabled && 'cursor-default',
)}
```

---

### 5. Utility Function Design

**Question**: Should we create a shared utility for category-to-color mapping?

**Decision**: Yes, add `getCategoryColorClasses()` function to `step-utils.ts`.

```tsx
interface CategoryColorClasses {
  wrapper: string  // Background class for icon wrapper
  icon: string     // Foreground class for icon
}

export function getCategoryColorClasses(category: StepCategory): CategoryColorClasses {
  const colorMap: Record<StepCategory, CategoryColorClasses> = {
    info: { wrapper: 'bg-muted', icon: 'text-muted-foreground' },
    input: { wrapper: 'bg-info/10', icon: 'text-info' },
    capture: { wrapper: 'bg-success/10', icon: 'text-success' },
    transform: { wrapper: 'bg-destructive/10', icon: 'text-destructive' },
  }
  return colorMap[category]
}
```

**Rationale**:
- Centralizes color mapping logic for reuse in StepListItem and AddStepDialog
- Single source of truth - easy to update colors in one place
- Type-safe with proper return type
- Follows DRY principle without over-abstraction (only 2 consumers)

**Alternatives Considered**:
- Inline mapping in each component → Rejected: Duplicates logic, harder to maintain
- CSS classes with data attributes → Rejected: More complex, harder to type-check

---

## Summary

All research questions have been resolved. No "NEEDS CLARIFICATION" items remain.

| Topic | Decision | Confidence |
|-------|----------|------------|
| Full element dragging | Attach listeners/attributes to parent | High |
| Category colors | muted/info/success/destructive with opacity | High |
| Icon wrapper | 24x24 rounded-md container | Medium (may need visual tuning) |
| Cursor behavior | pointer → grabbing during drag | High |
| Utility function | getCategoryColorClasses in step-utils.ts | High |
