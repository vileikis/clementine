# Data Model: Project UX & Actions

**Branch**: `076-project-ux-actions` | **Date**: 2026-02-22

## Entities

### Project (existing — no schema changes)

The Project entity already has all fields needed for rename and duplication. No schema modifications required.

**Key fields for this feature**:

| Field | Type | Relevance |
| ----- | ---- | --------- |
| `id` | `string` | Document ID, auto-generated for duplicates |
| `name` | `string (1-100)` | Displayed in badge, edited via rename, prefixed for duplicates |
| `workspaceId` | `string` | Copied from source on duplicate |
| `status` | `'draft' \| 'live' \| 'deleted'` | Copied from source on duplicate (or reset to `'draft'`) |
| `type` | `'standard' \| 'ghost'` | Copied from source on duplicate |
| `draftConfig` | `ProjectConfig \| null` | Deep-cloned via `structuredClone()` on duplicate |
| `publishedConfig` | `ProjectConfig \| null` | Set to `null` on duplicate (unpublished copy) |
| `exports` | `ProjectExports \| null` | Set to `null` on duplicate |
| `draftVersion` | `number` | Reset to `1` on duplicate |
| `publishedVersion` | `number \| null` | Set to `null` on duplicate |
| `publishedAt` | `number \| null` | Set to `null` on duplicate |
| `deletedAt` | `number \| null` | Set to `null` on duplicate |
| `createdAt` | `number` | Set to `serverTimestamp()` on duplicate |
| `updatedAt` | `number` | Set to `serverTimestamp()` on duplicate |

**Firestore path**: `projects/{projectId}` (top-level collection)

### Duplicate Project — New Document Shape

When duplicating, the new document is constructed as:

```
{
  id:               <new auto-generated ID>,
  name:             generateDuplicateName(source.name),  // "Original (Copy)"
  workspaceId:      source.workspaceId,
  status:           'draft',
  type:             source.type,
  draftConfig:      structuredClone(source.draftConfig),
  publishedConfig:  null,                                // Not published
  exports:          null,                                 // No exports
  draftVersion:     1,
  publishedVersion: null,
  publishedAt:      null,
  deletedAt:        null,
  createdAt:        serverTimestamp(),
  updatedAt:        serverTimestamp(),
}
```

## Validation Schemas

### Existing (no changes)

- `updateProjectInputSchema` — validates `{ name: string }` for rename (min 1, max 100)

### New

- `duplicateProjectInputSchema` — validates `{ workspaceId: string, projectId: string }` for duplication input

## State Transitions

**Rename**: Updates `name` and `updatedAt` fields only. No status change.

**Duplicate**: Creates a new document in `'draft'` status regardless of source status. All publish-related fields reset.
