# Feature Requirements: Workspace View & Settings (Admin)

## Goal

Allow admins to view a workspace in its own context and perform basic edits (name + slug).

---

## Access Control

- Only admins (`request.auth.token.admin == true`) can access any `/workspace/**` routes for this MVP.
- All reads/writes of `workspaces` collection must remain admin-only via Firestore rules.

---

## Workspace Resolution

### Workspace Root Page

**Route:** `/workspace/[workspaceSlug]`

**Behavior**

- Resolve workspace by `slug == [workspaceSlug]` and `status == "active"`.
- If not found:
  - Show friendly 404 state (e.g. title + short explanation + link back to `/admin/workspaces`).

---

## Layout: Workspace Context

### Sidebar Workspace Selector

When workspace is successfully resolved:

- Show workspace identity in the sidebar selector:
  - `workspace.name`
  - and workspace icon (2 letters max of first 2 words)
- Selector behavior (MVP):
  - Just display only

---

## Workspace Projects Placeholder

### Projects Page

**Route:** `/workspace/[workspaceSlug]/projects`

**Behavior**

- Resolve workspace using the same slug logic as above.
- If workspace exists:
  - Render header text: `“Projects”`
- If not found:
  - Show the same friendly 404 state.

---

## Workspace Settings (Edit)

### Settings Page

**Route:** `/workspace/[workspaceSlug]/settings`

**Behavior**

- Resolve workspace using the same slug logic as above.
- Show form fields:
  - Workspace Name (editable)
  - Workspace Slug (editable)

### Validation Rules

- Name:
  - Must satisfy `WORKSPACE_NAME` min/max constraints
  - Can duplicate across different workspaces (allowed)
- Slug:
  - Must satisfy `slugSchema`
  - Must be **globally unique across all workspaces** (case-insensitive)
  - Must not conflict with slugs of deleted workspaces (slug reuse ❌, recommended)

### Save Behavior

On Save:

- Perform update
  - Re-check slug uniqueness at write-time
  - Update:
    - `name`
    - `slug`
    - `updatedAt = now()`

### Slug Change Redirect (Non-negotiable)

If slug was changed successfully:

- Redirect user to:
  - `/workspace/[newWorkspaceSlug]/settings` (or `/workspace/[newWorkspaceSlug]`)
- Old slug route should become:
  - “not found” (unless you implement slug history; MVP can skip history)

> If you don’t redirect after slug change, you’ll leave the app in an inconsistent state (URL says old slug, data says new slug).

### Friendly Errors

- If slug is not unique:
  - Prevent save
  - Show inline error on slug field (e.g. “Slug already in use”)
- If update fails due to permissions:
  - Show “You don’t have access” error state (shouldn’t happen for admins, but handle gracefully)

---

## Data & Constraints

### Workspace Lookup

Workspace lookup must always treat slug as canonical:

- `slug` is the public identifier in URLs
- Workspaces must have exactly one active document per slug

### Schema Invariants

- If `status == "deleted"` → `deletedAt != null`
- If `status == "active"` → `deletedAt == null`

---

## Out of Scope

- Non-admin workspace access
- Slug history / legacy redirects
- Workspace switching (selector dropdown) if not implemented
- Projects CRUD
