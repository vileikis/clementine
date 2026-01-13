# Research: Horizontal Tabs Navigation in Top Bar

**Feature**: 023-top-bar-with-tabs
**Date**: 2026-01-13

## Overview

This document captures research findings and design decisions for implementing horizontal tabs in the TopNavBar component.

---

## Research Areas

### 1. Tab Component Strategy

**Question**: Should we use shadcn/ui Tabs, build custom, or use a different approach?

**Decision**: Build a custom **navigation tabs** component (not use shadcn/ui Tabs)

**Rationale**:
- shadcn/ui Tabs (based on Radix UI) are designed for **content switching within a panel** - they manage state internally and render different content
- Our use case is **route-based navigation** - tabs represent different routes/pages, not content panels
- TanStack Router already handles the "active state" via URL matching
- A custom `NavTabs` component using `Link` from TanStack Router is more appropriate

**Alternatives Considered**:
1. **shadcn/ui Tabs**: Rejected - designed for in-panel content switching, not route navigation
2. **Radix UI Tabs primitive**: Rejected - same reason, plus adds unnecessary complexity
3. **Custom NavTabs with Links**: Selected - matches the navigation pattern exactly

**Implementation Approach**:
- Create `NavTabs` and `NavTabItem` components in the navigation domain
- Use TanStack Router's `Link` component for navigation
- Use `useMatchRoute` hook for active state detection (already used in EventDesignerSidebar)
- Style using design tokens (bg-accent for active state)

---

### 2. TopNavBar Extension Pattern

**Question**: How should we extend TopNavBar to support tabs while maintaining backward compatibility?

**Decision**: Add optional `tabs` prop to TopNavBar that renders a second row when provided

**Rationale**:
- TopNavBar already supports composition via `left` and `right` props
- Adding a `tabs` prop maintains the same pattern
- When `tabs` is not provided, component renders exactly as before (backward compatible)
- Two-row layout (breadcrumbs + tabs) is a common navigation pattern

**Alternatives Considered**:
1. **Render tabs via `left` prop**: Rejected - tabs should be on a separate row below breadcrumbs
2. **Create new TopNavBarWithTabs component**: Rejected - code duplication, harder to maintain
3. **Add `tabs` prop with conditional second row**: Selected - clean, backward compatible

**Interface Design**:
```typescript
interface TabItem {
  id: string
  label: string
  to: string  // TanStack Router path
}

interface TopNavBarProps {
  breadcrumbs: BreadcrumbItem[]
  tabs?: TabItem[]  // NEW - optional tabs configuration
  left?: React.ReactNode
  right?: React.ReactNode
  className?: string
}
```

---

### 3. Active Tab Detection

**Question**: How should we detect which tab is active based on current route?

**Decision**: Use TanStack Router's `useMatchRoute` hook

**Rationale**:
- Already used successfully in `EventDesignerSidebar` component
- Works with parameterized routes (e.g., `/workspace/$workspaceSlug/...`)
- Built into TanStack Router, no external dependencies
- Handles exact vs fuzzy matching

**Implementation Pattern** (from existing code):
```typescript
const matchRoute = useMatchRoute()
const isActive = !!matchRoute({ to: tab.to })
```

---

### 4. Layout Changes for Editor Pages

**Question**: How should we implement the controls-left/preview-right swap for WelcomeEditorPage and ThemeEditorPage?

**Decision**: Simply swap the flex order of the two columns in each component

**Rationale**:
- Both pages already have a two-column flex layout
- CSS `flex` with `order` or simply reordering JSX elements achieves the goal
- No structural changes needed to the preview or controls components
- Minimal code change, minimal risk

**Current Layout** (both pages):
```tsx
<div className="flex h-full">
  {/* Left: Preview */}
  <div className="flex-1 min-w-0">
    <PreviewShell>...</PreviewShell>
  </div>
  {/* Right: Controls */}
  <aside className="w-80 shrink-0 border-l">...</aside>
</div>
```

**New Layout**:
```tsx
<div className="flex h-full">
  {/* Left: Controls */}
  <aside className="w-80 shrink-0 border-r">...</aside>
  {/* Right: Preview */}
  <div className="flex-1 min-w-0">
    <PreviewShell>...</PreviewShell>
  </div>
</div>
```

---

### 5. Centered Layout for Settings Page

**Question**: How should we center the content on EventSettingsPage?

**Decision**: Wrap content in a centered container with max-width constraint

**Rationale**:
- Standard pattern for settings/form pages
- Improves readability by limiting line length
- Easy to implement with Tailwind utilities

**Implementation**:
```tsx
<div className="flex justify-center">
  <div className="w-full max-w-3xl p-6 space-y-8">
    {/* Settings content */}
  </div>
</div>
```

---

### 6. Tab Styling

**Question**: How should active/inactive tabs be styled?

**Decision**: Use design system tokens with underline indicator for active state

**Rationale**:
- Underline indicator is a common pattern for horizontal navigation tabs
- Uses existing design tokens (bg-accent, text-accent-foreground)
- Consistent with application's visual language
- Accessible (color is not the only indicator)

**Styling Approach**:
```tsx
// Inactive tab
<Link className="text-muted-foreground hover:text-foreground px-3 py-2">

// Active tab
<Link className="text-foreground border-b-2 border-primary px-3 py-2">
```

---

## Technical Context Summary

Based on codebase analysis:

| Aspect | Value |
|--------|-------|
| **Language/Version** | TypeScript 5.7.2 (strict mode) |
| **Framework** | TanStack Start 1.132.0, React 19.2.0 |
| **Router** | TanStack Router 1.132.0 |
| **Styling** | Tailwind CSS v4, CSS variables |
| **Component Library** | shadcn/ui (no Tabs component installed) |
| **Testing** | Vitest |
| **Target Platform** | Web (desktop-first for admin, mobile-first for guest) |

---

## Files to Modify

### New Files
- `src/domains/navigation/components/NavTabs.tsx` - New navigation tabs component

### Modified Files
- `src/domains/navigation/components/TopNavBar.tsx` - Add tabs prop and second row
- `src/domains/event/designer/containers/EventDesignerPage.tsx` - Remove sidebar, pass tabs to layout
- `src/domains/event/designer/containers/EventDesignerLayout.tsx` - Accept and pass tabs to TopNavBar
- `src/domains/event/welcome/containers/WelcomeEditorPage.tsx` - Swap column order
- `src/domains/event/theme/containers/ThemeEditorPage.tsx` - Swap column order
- `src/domains/event/settings/containers/EventSettingsPage.tsx` - Center content layout

### Files to Consider Removing
- `src/domains/event/designer/components/EventDesignerSidebar.tsx` - May become unused (evaluate after implementation)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing TopNavBar usage | Add tabs as optional prop, maintain backward compatibility |
| Active state detection edge cases | Use same pattern proven in EventDesignerSidebar |
| Layout shift during navigation | Use consistent heights for tab bar |
| Mobile responsiveness | Test on mobile viewports, tabs should scroll horizontally if needed |

---

## Open Questions (Resolved)

All technical questions have been resolved through codebase analysis.
