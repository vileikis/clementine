# Epic E1: Experience Data Layer & Library

> **Epic Series:** Experience System
> **Dependencies:** None (foundation epic)
> **Enables:** E2 (Step System), E3 (Event Integration), E4 (Share Screen Editor)

---

## 1. Goal

Enable admins to create and manage experiences at the workspace level through a dedicated Experience Library UI.

**This epic delivers:**

- Experience CRUD operations at workspace level
- Experience Library UI (`/workspace/:slug/experiences`)
- Experience creation flow (`/workspace/:slug/experiences/create`)
- Draft/published document structure
- Profile filtering and display

**This epic does NOT include:**

- Step editing (E2)
- Event-experience assignment (E3)
- Runtime or sessions (E5+)

---

## 2. Existing Code Baseline

The following scaffolding exists from Phase 0:

| File | Status | Changes Needed |
|------|--------|----------------|
| `domains/experience/shared/schemas/experience.schema.ts` | Exists | Update profiles, path, add media field |
| `domains/experience/shared/types/profile.types.ts` | Exists | Update profile definitions |
| `domains/experience/shared/schemas/step-registry.schema.ts` | Exists | Remove share step (E2 will expand) |

**Key schema changes required:**

1. **Firestore path**: Change from `/projects/.../experiences` to `/workspaces/{workspaceId}/experiences`
2. **Profiles**: Change from `freeform|main_default|pregate_default|preshare_default` to `freeform|survey|story`
3. **Add media field** at root level (flattened for easy list display)
4. **Add publishedBy field** for audit trail

---

## 3. Firebase Data Model

### 3.1 Experience Document

**Path:** `/workspaces/{workspaceId}/experiences/{experienceId}`

```typescript
{
  // Identity
  id: string                    // Firestore document ID
  name: string                  // Display name (1-100 chars)

  // Metadata
  status: 'active' | 'deleted'
  profile: 'freeform' | 'survey' | 'story'
  media: {                      // Thumbnail/cover (flattened for easy list display)
    mediaAssetId: string
    url: string
  } | null

  // Configuration (nested objects for atomic copy)
  draft: {
    steps: Step[]               // Step array (empty initially)
  }

  published: {                  // null until first publish
    steps: Step[]
  } | null

  // Timestamps (flattened, like events)
  createdAt: number             // Unix ms
  updatedAt: number             // Last draft modification
  publishedAt: number | null    // Last publish time
  publishedBy: string | null    // UID of publisher
  deletedAt: number | null      // Soft delete timestamp
}
```

### 3.2 Profile Definitions

| Profile | Description | Allowed Step Categories | Slot Compatibility |
|---------|-------------|------------------------|-------------------|
| `freeform` | Full flexibility | info, input, capture, transform | main |
| `survey` | Data collection | info, input, capture | main, pregate, preshare |
| `story` | Display only | info | pregate, preshare |

**Note:** Profile is immutable after creation.

---

## 4. Security Rules

Add to `firestore.rules`:

```javascript
// Experience rules (workspace-scoped)
match /workspaces/{workspaceId}/experiences/{experienceId} {
  // Authenticated users can read (guests need published field)
  allow read: if request.auth != null;

  // Only admins can write
  allow create, update: if isAdmin();

  // No hard deletes
  allow delete: if false;
}
```

**Note:** Guests read full doc (same pattern as events). Client filters to published field.

---

## 5. Schema Updates

### 5.1 Experience Schema (`experience.schema.ts`)

```typescript
import { z } from 'zod'

export const experienceProfileSchema = z.enum([
  'freeform',
  'survey',
  'story'
])

export const experienceMediaSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
}).nullable()

export const experienceConfigSchema = z.object({
  steps: z.array(z.any()).default([]),  // Step schema from E2
})

export const experienceSchema = z.looseObject({
  // Identity
  id: z.string(),
  name: z.string().min(1).max(100),

  // Metadata
  status: z.enum(['active', 'deleted']).default('active'),
  profile: experienceProfileSchema,
  media: experienceMediaSchema.default(null),  // Flattened for easy list display

  // Configuration
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
  publishedAt: z.number().nullable().default(null),
  publishedBy: z.string().nullable().default(null),
  deletedAt: z.number().nullable().default(null),
})

export type Experience = z.infer<typeof experienceSchema>
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>
export type ExperienceConfig = z.infer<typeof experienceConfigSchema>
```

### 5.2 Profile Validation Updates (`profile.types.ts`)

Update profile validators to use new profile names:

```typescript
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  freeform: createEmptyValidator(),    // Full validation in E2
  survey: createEmptyValidator(),
  story: createEmptyValidator(),
}
```

---

## 6. Data Hooks

### 6.1 Query Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useWorkspaceExperiences(workspaceId)` | List active experiences | `Experience[]` |
| `useWorkspaceExperience(workspaceId, experienceId)` | Single experience | `Experience` |

**Filtering:** `useWorkspaceExperiences` accepts optional `profile` filter.

### 6.2 Mutation Hooks

| Hook | Purpose | Input |
|------|---------|-------|
| `useCreateExperience()` | Create new experience | `{ workspaceId, name, profile }` |
| `useUpdateExperience()` | Update experience | `{ workspaceId, experienceId, data }` |
| `useDeleteExperience()` | Soft delete | `{ workspaceId, experienceId }` |

**Create behavior:**
- Generates UUID for `id`
- Sets `status: 'active'`
- Initializes `draft: { steps: [], media: null }`
- Sets `published: null`
- Sets timestamps

---

## 7. UI Deliverables

### 7.1 Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/workspace/:slug/experiences` | `ExperiencesPage` | List experiences |
| `/workspace/:slug/experiences/create` | `CreateExperiencePage` | Create form |
| `/workspace/:slug/experiences/:experienceId` | `ExperienceEditorPage` | Editor (shell only in E1) |

### 7.2 Components

**ExperiencesPage (`domains/experience/library/containers/`)**

- Header with title + "Create Experience" button
- Profile filter tabs/dropdown (All, Freeform, Survey, Story)
- Experience list (cards or rows)
- Empty state with CTA
- Loading skeleton

**ExperienceListItem (`domains/experience/library/components/`)**

- Thumbnail (from `media` field or placeholder)
- Name
- Profile badge (colored by profile type)
- Status indicator (draft only / published)
- Context menu (Edit, Delete)
- Click navigates to editor

**CreateExperiencePage (`domains/experience/library/containers/`)**

- Back navigation to list
- Name input (required)
- Profile selector (radio or select)
- Profile descriptions/hints
- Create button
- On success: navigate to editor

**ExperienceEditorPage (shell only)**

- Breadcrumb: Workspace / Experiences / [Name]
- Placeholder content: "Step editor coming in E2"
- This route exists so "Edit" navigation works

### 7.3 Empty States

| Context | Display |
|---------|---------|
| No experiences | Illustration + "Create your first experience" CTA |
| No experiences matching filter | "No [profile] experiences" + "Create one" link |

---

## 8. Implementation Phases

### Phase 1: Schema & Security Rules

Update experience schema with new profiles and structure. Add Firestore security rules. Remove deprecated share step schema.

### Phase 2: Data Hooks

Implement CRUD hooks for experiences: list (with profile filter), get single, create, update, soft delete.

### Phase 3: Library UI

Build experiences list page with profile filtering, list items showing thumbnail and profile badge, empty states.

### Phase 4: Create Flow

Build create experience page with name input and profile selector. Wire up navigation from list to create to editor.

### Phase 5: Editor Shell & Polish

Create editor route as placeholder (content in E2). Add context menu actions, rename dialog, loading/error states.

---

## 9. Acceptance Criteria

### Must Have

- [ ] Admin can view list of experiences at `/workspace/:slug/experiences`
- [ ] Admin can filter experiences by profile
- [ ] Profile badge is visible on each experience item
- [ ] Admin can create experience with name + profile selection
- [ ] Profile cannot be changed after creation
- [ ] Admin can rename experience
- [ ] Admin can soft-delete experience (with confirmation)
- [ ] Deleted experiences do not appear in list
- [ ] Security rules enforce admin-only write access
- [ ] Experience document has correct draft/published structure

### Nice to Have (if time permits)

- [ ] Thumbnail upload for experience media
- [ ] Search/filter by name
- [ ] Sort by created/updated date

---

## 10. Technical Notes

### Folder Structure

```
domains/experience/
├── shared/
│   ├── schemas/
│   │   ├── experience.schema.ts     # Updated
│   │   └── step-registry.schema.ts  # Share step removed
│   ├── types/
│   │   ├── experience.types.ts
│   │   └── profile.types.ts         # Updated
│   └── hooks/
│       ├── useWorkspaceExperiences.ts
│       ├── useWorkspaceExperience.ts
│       ├── useCreateExperience.ts
│       ├── useUpdateExperience.ts
│       └── useDeleteExperience.ts
├── library/
│   ├── containers/
│   │   ├── ExperiencesPage.tsx
│   │   ├── CreateExperiencePage.tsx
│   │   └── ExperienceEditorPage.tsx  # Shell only
│   └── components/
│       ├── ExperienceListItem.tsx
│       ├── ExperienceListEmpty.tsx
│       ├── CreateExperienceForm.tsx
│       └── ProfileBadge.tsx
└── index.ts
```

### Route Files

```
app/workspace/
├── $workspaceSlug.experiences/
│   ├── index.tsx           # List page
│   ├── create.tsx          # Create page
│   └── $experienceId.tsx   # Editor shell
```

### Query Keys

```typescript
// Experience query keys for TanStack Query
export const experienceKeys = {
  all: ['experiences'] as const,
  lists: () => [...experienceKeys.all, 'list'] as const,
  list: (workspaceId: string, filters?: { profile?: ExperienceProfile }) =>
    [...experienceKeys.lists(), workspaceId, filters] as const,
  details: () => [...experienceKeys.all, 'detail'] as const,
  detail: (workspaceId: string, experienceId: string) =>
    [...experienceKeys.details(), workspaceId, experienceId] as const,
}
```

---

## 11. Out of Scope (Handled in Later Epics)

| Item | Epic |
|------|------|
| Step editing | E2 |
| Step renderers | E2 |
| Experience publish button | E2 |
| Event-experience assignment | E3 |
| Welcome screen integration | E3 |
| Session creation | E5 |
| Guest access | E6 |

---

## 12. Open Questions

None currently. Schema and UX decisions are finalized.
