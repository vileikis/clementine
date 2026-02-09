# Data Model: Duplicate Experience

**Feature**: 066-duplicate-experience
**Date**: 2026-02-09

## Entities

### Experience (existing — extended)

**Collection**: `workspaces/{workspaceId}/experiences/{experienceId}`

The existing `Experience` document is the only entity involved. The duplicate creates a **new document** in the same collection with fields derived from the source.

#### New Field

| Field               | Type              | Description                              |
| ------------------- | ----------------- | ---------------------------------------- |
| `sourceExperienceId` | `string \| null`  | ID of the experience this was duplicated from. `null` for non-duplicates. |

This field is additive — it does not affect existing experiences. Existing documents will simply not have this field (Zod's `looseObject` handles unknown fields gracefully).

### Field Mapping: Source → Duplicate

| Field              | Source Value                | Duplicate Value                          |
| ------------------ | --------------------------- | ---------------------------------------- |
| `id`               | source.id                   | New auto-generated ID                    |
| `name`             | source.name                 | `generateDuplicateName(source.name)`     |
| `status`           | source.status               | `"active"`                               |
| `profile`          | source.profile              | source.profile (copied as-is)            |
| `media`            | source.media                | source.media (reference copied, not file) |
| `draft`            | source.draft                | `structuredClone(source.draft)`          |
| `published`        | source.published            | `structuredClone(source.published)` or `null` |
| `draftVersion`     | source.draftVersion         | `1`                                      |
| `publishedVersion` | source.publishedVersion     | `null`                                   |
| `publishedAt`      | source.publishedAt          | `null`                                   |
| `publishedBy`      | source.publishedBy          | `null`                                   |
| `createdAt`        | source.createdAt            | `serverTimestamp()`                      |
| `updatedAt`        | source.updatedAt            | `serverTimestamp()`                      |
| `deletedAt`        | source.deletedAt            | `null`                                   |
| `sourceExperienceId` | N/A                       | source.id                                |

### Naming Function

```
generateDuplicateName(name: string): string
  IF name ends with " (Copy)" → return name unchanged
  ELSE → return name + " (Copy)"
  IF result exceeds 100 chars → truncate original name to fit " (Copy)" within limit
```

## State Transitions

No new state transitions. The duplicate is created in `status: "active"` with publish state reset. It follows the existing experience lifecycle from that point.

## Validation

### Input Schema: `duplicateExperienceInputSchema`

| Field          | Type     | Validation          |
| -------------- | -------- | ------------------- |
| `workspaceId`  | `string` | min(1)              |
| `experienceId` | `string` | min(1)              |

No `name` or `profile` input needed — both are derived from the source document inside the transaction.

## Firestore Security Considerations

No new security rules needed. The duplicate operation creates a new document in the same `experiences` subcollection. Existing write rules for `workspaces/{workspaceId}/experiences/{experienceId}` apply to the new document.
