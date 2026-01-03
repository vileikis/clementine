# Research: Project & Event Top Navigation Bar

**Feature**: 010-project-event-topnav
**Date**: 2026-01-03
**Status**: ✅ Complete (No research required)

## Summary

This feature requires **no research phase** because all technical decisions are already established by the existing codebase and technology stack. The implementation uses existing patterns, components, and libraries with no unknowns to resolve.

## Technical Decisions

### Decision 1: Component Library
**Decision**: Use existing shadcn/ui Button component
**Rationale**: Already integrated and used throughout the codebase
**Alternatives Considered**: None - reusing existing UI components is a project requirement

### Decision 2: Icon Library
**Decision**: Use Lucide React icons
**Rationale**: Already used extensively in navigation components (Menu, FolderOpen, Settings, etc.)
**Alternatives Considered**: None - existing standard

### Decision 3: Toast Notifications
**Decision**: Use existing Sonner toast system
**Rationale**: Already configured in root layout with custom icons and styling
**Alternatives Considered**: None - existing toast system is sufficient

### Decision 4: Navigation Library
**Decision**: Use TanStack Router `<Link>` component
**Rationale**: Project uses TanStack Router for all routing, existing `NavigationLink` component demonstrates pattern
**Alternatives Considered**: None - framework standard

### Decision 5: Styling Approach
**Decision**: Tailwind CSS 4 with theme tokens
**Rationale**: Project standard, constitution requires using theme tokens (no hard-coded colors)
**Alternatives Considered**: None - constitution requirement

### Decision 6: Component Structure
**Decision**: Three-component architecture (TopNavBar, TopNavBreadcrumb, TopNavActions)
**Rationale**: Separates concerns, follows existing navigation component patterns (Sidebar, AdminNav), enables reusability
**Alternatives Considered**:
- Single component with conditional rendering - Rejected: Less maintainable, harder to test independently
- More granular components (BreadcrumbItem, ActionButton) - Rejected: Over-engineering for simple requirements

### Decision 7: Data Flow
**Decision**: Props-based configuration (breadcrumbs array, actions array)
**Rationale**: Makes component reusable across routes, clear data flow, easy to test
**Alternatives Considered**:
- Context-based - Rejected: Unnecessary complexity for simple prop drilling
- Hook-based - Rejected: Props are clearer and more testable

### Decision 8: Responsive Strategy
**Decision**: CSS truncation with ellipsis + minimum touch targets
**Rationale**: Simple, performant, meets mobile-first requirements
**Alternatives Considered**:
- Horizontal scroll - Rejected: Poor UX on mobile
- Dropdown menus - Rejected: Over-engineering, not in requirements

## Implementation Patterns

### Pattern 1: Navigation Domain Structure
**Source**: Existing `domains/navigation/components/` structure
**Application**: Add TopNavBar components to navigation domain alongside Sidebar, AdminNav, WorkspaceNav
**Reference Files**:
- `NavigationLink.tsx` - Shows icon + text pattern
- `Sidebar.tsx` - Shows responsive layout pattern
- `index.ts` - Shows barrel export pattern

### Pattern 2: Route Integration
**Source**: Existing route layout components
**Application**: Integrate TopNavBar in `$projectId.tsx` and `$eventId.tsx` layout components
**Reference Files**:
- `$eventId.tsx` - Shows layout component pattern with child routes
- Route loaders - Already provide project/event data

### Pattern 3: Toast Notifications
**Source**: Existing `ui-kit/components/sonner.tsx` integration
**Application**: Import `toast` from 'sonner', call `toast.success("Coming soon")` on button clicks
**Reference Files**:
- `sonner.tsx` - Toast configuration
- `__root.tsx` - Shows `<Toaster />` integration

## No Research Needed

The following areas typically require research but are already resolved:

- ✅ **Component library**: shadcn/ui (existing)
- ✅ **Icon library**: Lucide React (existing)
- ✅ **Toast system**: Sonner (existing)
- ✅ **Routing**: TanStack Router (existing)
- ✅ **Styling**: Tailwind CSS 4 (existing)
- ✅ **Type system**: TypeScript 5.7 strict (existing)
- ✅ **Testing**: Vitest (existing)
- ✅ **Data loading**: Route loaders (existing)

## Conclusion

All technical decisions are dictated by existing codebase standards and patterns. No research phase is required - proceed directly to Phase 1 (Design & Contracts).
