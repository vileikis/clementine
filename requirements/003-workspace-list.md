# Feature Requirements: Workspace Management (Admin) — **Slug-Based Routing**

## Goal

Enable **admins** (users with Firebase Auth custom claim `admin: true`) to **view, create, open, and soft-delete** workspaces using **slug-based URLs**.

---

## Roles & Access Control

### Admin Definition

A user is considered an **admin** if:

- `request.auth != null`
- `request.auth.token.admin == true`

### Authorization Rules

- Only admins can **read and write** documents in Firestore collection: `workspaces`
- All workspace access (list, create, delete, read by slug) must be server-validated

---

## Routes & Navigation

### Admin Workspace List

**Route:** `/admin/workspaces`

**Behavior:**

- Fetch and display all **active** workspaces (`status == "active"`)
- Render as a single-column list
- Each item navigates to:

```
/workspace/[workspaceSlug]

```

### Empty State

- If no active workspaces exist:
  - Show empty message
  - Primary CTA: **Create workspace**

---

## Workspace Creation

### Creation Flow

- Admin initiates workspace creation from `/admin/workspaces`
- Admin must provide:
  - `name` (required)

### Slug Handling (**Critical**)

- `slug` is the **public identifier**
- Slug is:
  - Auto-generated from `name`
  - Editable before submission (recommended)
- Slug must:
  - Pass `slugSchema`
  - Be **globally unique (case-insensitive)**
  - Not belong to a deleted workspace (slug reuse ❌)

> Slug uniqueness must be enforced at write-time, not only client-side.

### Create Action

On submit:

- Create workspace document with:
  - `slug` (stored as a field)
  - `status = "active"`
  - `deletedAt = null`
  - `createdAt = now()`
  - `updatedAt = now()`

### Success Behavior

- Redirect admin to:

```
/workspace/[workspaceSlug]

```

---

## Workspace Resolution (Slug → Workspace)

### Workspace Page

**Route:** `/workspace/[workspaceSlug]`

**Resolution Logic:**

- Query `workspaces` where:
  - `slug == workspaceSlug`
  - `status == "active"`

### Invalid States

- If no workspace is found:
  - Show “Workspace not found”
- If workspace exists but is `deleted`:
  - Treat as not found (do not reveal existence)

> This prevents enumeration and avoids leaking deleted entities.

---

## Workspace Deletion (Soft Delete)

### Trigger

- Admin can delete a workspace from `/admin/workspaces`

### Confirmation

- Show confirmation modal before deletion

### Delete Behavior

Soft delete only:

- Set:
  - `status = "deleted"`
  - `deletedAt = now()`
  - `updatedAt = now()`

### Post-Delete Effects

- Workspace disappears from `/admin/workspaces`
- `/workspace/[workspaceSlug]` becomes inaccessible
- Slug **cannot be reused**

---

## Data Model

### Workspace Schema (Zod)

```tsx
export const workspaceStatusSchema = z.enum(["active", "deleted"]);

export const workspaceSchema = z
  .object({
    id: z.string(),

    name: z.string().min(WORKSPACE_NAME.min).max(WORKSPACE_NAME.max),

    slug: slugSchema,

    status: workspaceStatusSchema,

    deletedAt: z.number().nullable(),

    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .refine((data) => data.status === "active" || data.deletedAt !== null, {
    message: "deletedAt must be set when workspace is deleted",
    path: ["deletedAt"],
  });
```

---

## Firestore Constraints & Rules

### Security Rules (Intent)

- Allow read/write on `workspaces` **only** if:

```
request.auth.token.admin == true

```

### Data Constraints (Must Enforce in Code)

- `slug` uniqueness (case-insensitive)
- One active workspace per slug
- Writes must update `updatedAt`

> Firestore cannot enforce uniqueness natively — you must enforce it in:

- a transaction, or
- a callable function / server action

---

## Explicit Non-Goals (Out of Scope)

- Workspace members
- Public workspace access
- Slug renaming after creation
- Restore deleted workspace
- Multi-tenant permissions
  ***
