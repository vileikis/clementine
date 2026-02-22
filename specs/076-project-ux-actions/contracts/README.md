# Contracts: Project UX & Actions

This feature is **purely client-side** — all mutations use Firebase client SDK directly via Firestore transactions. There are no REST/GraphQL API endpoints to define.

## Client-Side Mutation Contracts

### Rename Project

- **Input**: `{ projectId: string, name: string }`
- **Validation**: `updateProjectInputSchema` — name min 1, max 100 characters
- **Firestore operation**: `transaction.update(projectRef, { name, updatedAt: serverTimestamp() })`
- **Cache invalidation**: `['projects', workspaceId]`
- **Existing hook**: `useRenameProject(workspaceId)`

### Duplicate Project (new)

- **Input**: `{ workspaceId: string, projectId: string }`
- **Validation**: `duplicateProjectInputSchema` — both fields required, non-empty
- **Firestore operation**: `transaction.get(sourceRef)` → `transaction.set(newRef, clonedProject)`
- **Cache invalidation**: `['projects', workspaceId]`
- **New hook**: `useDuplicateProject()`
- **Returns**: `{ workspaceId: string, projectId: string, name: string }`
