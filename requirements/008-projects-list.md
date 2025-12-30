# PRD: Projects List & Basic Project Management

## Goal

Enable workspace admins to view, create, access, and soft-delete projects within a workspace.

---

## Scope

This PRD covers:

- Viewing a list of projects in a workspace
- Creating a new project
- Deleting a project (soft delete)
- Accessing a placeholder Project Details page

Guest access, sharing, events, and QR functionality are **out of scope**.

---

## Users

- **Workspace Admin** (authenticated, authorized for the workspace)

---

## Routes

- **Projects List:** `/workspace/[workspaceSlug]/projects`
- **Project Details:** `/workspace/[workspaceSlug]/projects/[projectId]`

## Data & Storage

### Firestore Collection Structure

- Projects are stored in a **top-level** Firestore collection:

  - `projects/{projectId}`

- Each project belongs to a workspace via `workspaceId`.
- Listing projects for a workspace is done by filtering on `workspaceId` and excluding deleted status.

### Project Schema (Data Contract)

A project document follows this shape:

```ts
export type ProjectStatus = "draft" | "live" | "deleted";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus; // default: "draft"

  // Workspace relationship
  workspaceId: string;

  // Switchboard pattern - controls which event is active
  activeEventId: string | null;

  // Soft delete timestamp (optional but recommended for future restore/audit)
  deletedAt: number | null;

  createdAt: number;
  updatedAt: number;
};
```

**Clarifications**

- `status === "deleted"` is the single functional source of truth for deletion behavior.
- `deletedAt` exists for audit/restore support, but list/filtering is driven by `status`.

---

## Functional Requirements

### 1. Projects List

**Access**

- The Projects List is accessible only to workspace admins.

**Content**

- Display all projects belonging to the current workspace **except projects with `status === "deleted"`**.
- Projects are displayed in a single-column list.
- Projects are ordered by **creation date**, newest first.

**Empty State**

- If no projects exist, show an empty state prompting the user to create a project.

**Interaction**

- Tapping a project navigates the user to its Project Details page.

---

### 2. Create Project

**Trigger**

- A “Create project” action is available on the Projects List page.

**Behavior**

- On action:

  - A new project is created immediately.
  - The project:

    - Belongs to the current workspace
    - Has the default name **“Untitled project”**
    - Has status **“draft”**

- On successful creation, the user is redirected to the Project Details page of the new project.

---

### 3. Delete Project

**Trigger**

- A delete action is available for each project.

**Confirmation**

- The user must confirm before deletion.

**Behavior**

- On confirmation:

  - The project is soft-deleted by setting its status to **“deleted”**.

- Deleted projects:

  - Do not appear in the Projects List
  - Are not accessible via direct URL

---

### 4. Project Details

**Access**

- Accessible only to workspace admins.

**Valid Project**

- If the project exists and is not deleted:

  - Display a placeholder message:
    **“Project details – work in progress.”**

**Invalid or Deleted Project**

- If the project does not exist **or** has status `deleted`:

  - Return a **404 Not Found** state.

---

## Non-Goals

- Editing project name or settings
- Restoring deleted projects (data model supports it, UI does not)
- Guest access or project sharing
- Events management
- QR code generation

---

## Acceptance Criteria (High-Level)

- Admin can see, create, open, and delete projects within a workspace.
- Deleted projects are never visible or accessible.
- Navigation and empty states behave predictably.
- No guest or cross-workspace access is possible.
