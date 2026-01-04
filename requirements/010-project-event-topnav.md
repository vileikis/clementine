# PRD: Project & Event Top Navigation Bar

## Goal

Provide contextual top navigation bars for project and event detail pages, enabling users to understand their current location in the hierarchy and access key actions.

---

## Scope

This PRD covers:

- A shared top navigation bar component for project and event routes
- Project-level navigation with breadcrumb and share action
- Event-level navigation with extended breadcrumb and event-specific actions
- Placeholder functionality for actions (toast notifications)

Out of scope:

- Actual share functionality implementation
- Actual publish/play functionality implementation
- Deep linking or URL copy logic
- Backend API changes

---

## Users

- **Workspace Admin** (authenticated and authorized for the project's workspace)

---

## Routes

- **Project Details:** `/workspace/[workspaceSlug]/projects/[projectId]`
- **Event Details:** `/workspace/[workspaceSlug]/projects/[projectId]/events/[eventId]`

---

## Design Overview

Both routes share a common top navigation bar component with two main sections:

| Section               | Project Route              | Event Route                             |
| --------------------- | -------------------------- | --------------------------------------- |
| **Left (Breadcrumb)** | Folder Icon + Project Name | Folder Icon + Project Name / Event Name |
| **Right (Actions)**   | Share button               | Play button + Publish button            |

The top navigation bar sits **above** any existing content (tab navigation, page content, etc.).

---

## Functional Requirements

### 1. Shared Top Navigation Bar Component

**Structure**

- The component should be reusable across project and event routes.
- It accepts configuration props for:
  - Breadcrumb items (array of labels with optional links)
  - Action buttons (array of actions with icons and handlers)

**Layout**

- Horizontal bar spanning the full width of the content area.
- Left side: Breadcrumb display
- Right side: Action buttons
- Vertically centered content
- Consistent padding and spacing

**Responsive Behavior**

- On mobile: Breadcrumb text may truncate; action buttons remain visible.
- Icons should maintain minimum touch target size (44x44px on mobile).

---

### 2. Project Top Navigation

**Route:** `/workspace/[workspaceSlug]/projects/[projectId]`

**Left Section (Breadcrumb)**

| Element      | Description                                           |
| ------------ | ----------------------------------------------------- |
| Folder Icon  | Standard folder icon (e.g., `FolderOpen` from Lucide) |
| Project Name | Display the project's `name` field                    |

- The folder icon and project name are displayed inline.
- Project name should be fetched from route loader data.
- Project name may truncate on narrow screens with ellipsis.

**Right Section (Actions)**

| Button | Icon       | Label                            | Behavior                  |
| ------ | ---------- | -------------------------------- | ------------------------- |
| Share  | Share icon | "Share" (or icon-only on mobile) | Show toast: "Coming soon" |

**Action Behavior**

- Share button triggers a toast notification with message: **"Coming soon"**
- No actual share functionality is implemented.

---

### 3. Event Top Navigation

**Route:** `/workspace/[workspaceSlug]/projects/[projectId]/events/[eventId]`

**Left Section (Breadcrumb)**

| Element      | Description                             |
| ------------ | --------------------------------------- |
| Folder Icon  | Standard folder icon                    |
| Project Name | Display the project's `name` field      |
| Separator    | Visual separator (e.g., `/` or chevron) |
| Event Name   | Display the event's `name` field        |

- Clicking the project name in the breadcrumb navigates back to the project details page.
- Event name is not clickable (current page).
- Text may truncate on narrow screens.

**Right Section (Actions)**

| Button  | Icon                | Label                              | Behavior                  |
| ------- | ------------------- | ---------------------------------- | ------------------------- |
| Play    | Play icon           | "Preview" (or icon-only on mobile) | Show toast: "Coming soon" |
| Publish | Upload/Publish icon | "Publish"                          | Show toast: "Coming soon" |

**Action Behavior**

- Play button triggers a toast notification with message: **"Coming soon"**
- Publish button triggers a toast notification with message: **"Coming soon"**
- No actual play/publish functionality is implemented.

---

### 4. Data Requirements

**Project Route**

- Project name from route loader (`project.name`)

**Event Route**

- Project name from parent route loader (`project.name`)
- Event name from route loader (`event.name`)

Both routes already load this data via their existing loaders. No additional data fetching is required.

---

### 5. Toast Notifications

- Use the existing toast component/system (shadcn/ui `sonner` or similar).
- Toast message: **"Coming soon"**
- Toast should auto-dismiss after standard duration.

---

## Component Architecture

### Suggested Component Structure

```
domains/navigation/components/
├── TopNavBar.tsx           # Shared top navigation container
├── TopNavBreadcrumb.tsx    # Breadcrumb display component
├── TopNavActions.tsx       # Action buttons container
└── index.ts                # Barrel export (update existing)
```

**Alternative: Single Component with Props**

A single `TopNavBar` component with props for breadcrumb items and actions may be simpler for this use case.

### Props Interface (Conceptual)

```tsx
interface BreadcrumbItem {
  label: string;
  href?: string; // If provided, item is a link
  icon?: LucideIcon; // Only for first item
}

interface ActionButton {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
}

interface TopNavBarProps {
  breadcrumbs: BreadcrumbItem[];
  actions: ActionButton[];
}
```

---

## UI/UX Specifications

### Styling

- Background: Same as page background or subtle contrast
- Border: Optional bottom border for visual separation
- Height: ~48-56px
- Padding: Consistent with sidebar and content area

### Icons

- Use Lucide React icons (already in project):
  - `FolderOpen` – Folder icon for breadcrumb
  - `Share2` – Share button
  - `Play` – Play/Preview button
  - `Upload` or `Globe` – Publish button

### Typography

- Project/Event names: Medium weight, standard text size
- Truncate long names with ellipsis
- Breadcrumb separator: Lighter color or subtle

### Buttons

- Use existing shadcn/ui Button component
- Consistent sizing with other UI elements
- Icon + text on desktop, icon-only on mobile (optional)

---

## Integration Points

### Project Layout Route

**File:** `$projectId.tsx`

- Render `TopNavBar` at the top of the layout before `<Outlet />`
- Pass project name from loader data
- Pass share action with toast handler

### Event Layout Route

**File:** `$eventId.tsx`

- Render `TopNavBar` at the top of the layout before existing content
- Pass project name (from parent loader) and event name
- Pass play and publish actions with toast handlers

---

## Non-Goals

- Implementing actual share, preview, or publish functionality
- Persistent breadcrumb trail beyond project/event context
- Mobile-specific navigation patterns (beyond responsive adjustments)
- Animation or transitions

---

## Acceptance Criteria

### Project Route

- [ ] Top navigation bar displays at the top of the project details page
- [ ] Folder icon and project name are visible on the left
- [ ] Share button is visible on the right
- [ ] Clicking Share button shows "Coming soon" toast
- [ ] Long project names truncate appropriately

### Event Route

- [ ] Top navigation bar displays at the top of the event page (above tab navigation)
- [ ] Folder icon, project name, separator, and event name are visible on the left
- [ ] Project name in breadcrumb links back to project details page
- [ ] Play button and Publish button are visible on the right
- [ ] Clicking Play button shows "Coming soon" toast
- [ ] Clicking Publish button shows "Coming soon" toast
- [ ] Long names truncate appropriately

### General

- [ ] Component is reusable between both routes
- [ ] Responsive layout maintains usability on mobile
- [ ] Consistent styling with existing UI components

---

## Future Considerations

When implementing actual functionality, these placeholders should be replaced:

- **Share:** Copy link, QR code generation, or share dialog
- **Play/Preview:** Launch preview mode or guest view
- **Publish:** Event publishing workflow with status changes

---
