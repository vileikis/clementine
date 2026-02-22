# Project UX & Actions

## Problem

Project management UX lags behind the experience domain in several ways:

1. **No inline rename** — Projects can only be renamed from the project list context menu. Inside the project designer, the name is static text in the breadcrumb. Experiences already have a clickable `ExperienceIdentityBadge` in the TopNavBar that opens `ExperienceDetailsDialog` for renaming and media editing.

2. **No duplicate** — Projects cannot be duplicated. Experiences already support duplication via the library context menu (`useDuplicateExperience`). Projects have no equivalent.

3. **Inconsistent list items** — `ProjectListItem` and `ExperienceListItem` both only make the content area (name/badges) clickable via a `<Link>`. The surrounding card area is dead space. Neither card reacts to hover, making them feel unresponsive. `ProjectListItem` also builds its own dropdown menu inline instead of using the shared `ContextDropdownMenu` component.

## Goal

Bring project UX to parity with experiences and improve list item interactivity across both domains.

## Changes

### 1. Project rename in designer layout

**Location:** `domains/project/layout/containers/ProjectLayout.tsx`

Add a clickable name badge in the TopNavBar breadcrumb (similar to `ExperienceIdentityBadge`) that opens a rename dialog on click.

**Key differences from experience pattern:**
- Projects have no cover image — the dialog is **name-only** (like `RenameProjectDialog`, not like `ExperienceDetailsDialog`)
- The badge shows the project name + a pencil icon on hover, without a thumbnail

**Implementation approach:**
- Create a `ProjectIdentityBadge` component in `domains/project/layout/components/` that renders a clickable name with hover pencil icon
- Reuse the existing `RenameProjectDialog` from `domains/workspace/projects/components/` (it already handles rename with validation, mutation, and toasts)
- Replace the static `project.name` breadcrumb label with the `ProjectIdentityBadge`
- Wire the badge's `onClick` to open `RenameProjectDialog`

**Props needed:** `project` (for name display), `onClick` (to open dialog)

### 2. Project duplicate in list context menu

**Location:** `domains/workspace/projects/components/ProjectListItem.tsx`

Add a "Duplicate" action to the project list item context menu and migrate to `ContextDropdownMenu`.

**Backend:**
- Create `useDuplicateProject` hook in `domains/workspace/projects/hooks/` following the same pattern as `useDuplicateExperience`
- The mutation should call a Firestore operation that copies the project document (including draft config) with name `"Copy of {originalName}"`
- Invalidate the projects query cache on success

**Frontend:**
- Replace the inline `DropdownMenu` in `ProjectListItem` with `ContextDropdownMenu` (shared component)
- Move menu action construction to the parent (`ProjectsPage`) following the experience pattern — pass `menuSections` prop to `ProjectListItem`
- Menu sections:
  - Section 1: Rename, Duplicate
  - Section 2: Delete (destructive)
- Toast on duplicate success: `Duplicated as "{newName}"`
- Disable duplicate action while mutation is pending

### 3. Fully clickable & hoverable list items

**Location:** `ProjectListItem` and `ExperienceListItem`

Make the entire card clickable and add hover feedback.

**Pattern:**
- Wrap the card content in a navigation-aware clickable area (the full card should navigate on click)
- Keep the context menu button outside the clickable area to prevent navigation when clicking the menu
- Add hover styles to the card: subtle background shift or border highlight (e.g., `hover:bg-accent/50` or `hover:border-foreground/20`)
- Ensure keyboard accessibility — the card should be focusable and activatable via Enter/Space

**Implementation approach:**
- Use the `<Link>` component as the card wrapper (or use `asChild` pattern) so the entire card is a single navigation target
- Position the context menu button with `position: relative` / `z-index` so it intercepts clicks before the card link
- Use `e.preventDefault()` / `e.stopPropagation()` on the menu trigger if needed to prevent double navigation

**Apply consistently to both:**
- `domains/workspace/projects/components/ProjectListItem.tsx`
- `domains/experience/library/components/ExperienceListItem.tsx`

## Non-goals

- Project cover image or media editing (projects are name-only)
- Changing the project list page layout (grid vs list)
- Project archiving or status changes
- Search or filtering improvements

## Tasks Breakdown

1. **`ProjectIdentityBadge` component** — clickable name badge with hover pencil icon
2. **Wire rename in `ProjectLayout`** — integrate badge + `RenameProjectDialog` in TopNavBar breadcrumb
3. **`useDuplicateProject` hook** — mutation hook for project duplication
4. **Migrate `ProjectListItem` to `ContextDropdownMenu`** — replace inline dropdown, add duplicate action, lift menu config to parent
5. **Hoverable/clickable `ProjectListItem`** — full-card click target with hover styles
6. **Hoverable/clickable `ExperienceListItem`** — same treatment for experience cards
