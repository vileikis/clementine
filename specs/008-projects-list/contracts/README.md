# API Contracts: Projects List & Basic Project Management

**Feature**: `008-projects-list`
**Date**: 2025-12-30

## Overview

This directory contains the API contracts and infrastructure specifications for the Projects feature. Since this feature follows a client-first architecture using Firebase Firestore, there are no traditional REST/GraphQL API endpoints. Instead, the contracts define Firestore security rules and database indexes.

## Contents

### 1. `firestore.rules`

Firestore security rules for the `projects` collection. These rules enforce:

- **Authentication**: All operations require admin authentication
- **Workspace-scoped access**: Users can only access projects in workspaces they admin
- **Soft delete filtering**: Deleted projects are invisible at the database level
- **Data validation**: Enforces project data structure and field constraints
- **Immutability**: Prevents workspace transfers and other invalid mutations

**Deployment**:
1. Copy the rules block from `contracts/firestore.rules` into the main `firebase/firestore.rules` file at **monorepo root** (NOT inside apps/clementine-app/)
2. Add the rules after the existing `workspaces` rules block
3. Deploy via `pnpm fb:deploy:rules` or `pnpm fb:deploy` from monorepo root

**Testing**:
- Use Firebase Emulator to test rules before production deployment
- Verify workspace-scoped access (can't read projects in other workspaces)
- Verify soft delete filtering (deleted projects invisible)
- Verify validation (invalid data structures rejected)

### 2. `firestore.indexes.json`

Firestore composite index configuration for efficient project queries.

**Index Details**:
- **Collection**: `projects`
- **Fields**: `workspaceId` (ASC) + `status` (ASC) + `createdAt` (DESC)
- **Purpose**: Supports workspace-scoped queries with status filtering and creation date ordering

**Query Patterns Supported**:
```javascript
// Primary query: List active projects in workspace
query(
  collection(firestore, 'projects'),
  where('workspaceId', '==', workspaceId),
  where('status', '!=', 'deleted'),
  orderBy('status'),           // Required for != query
  orderBy('createdAt', 'desc')
)
```

**Deployment**:
1. Merge the index definition into `firebase/firestore.indexes.json`
2. Deploy via `pnpm fb:deploy:indexes` or `pnpm fb:deploy`
3. Wait for index to build (monitor Firebase Console)
4. Verify index is active before deploying application code

**Performance**:
- Index build time: ~30 seconds for empty collection, longer for existing data
- Query performance: <100ms for up to 100 projects per workspace
- Cost: Minimal (1 index entry per project, ~$0.06 per 100K queries)

## Client-Side Data Operations

Since this feature uses Firebase Client SDK, all data operations happen client-side:

### Read Operations

**List Projects**:
```typescript
// Implementation: useProjects hook
const q = query(
  collection(firestore, 'projects'),
  where('workspaceId', '==', workspaceId),
  where('status', '!=', 'deleted'),
  orderBy('status'),
  orderBy('createdAt', 'desc')
)
```

**Get Single Project**:
```typescript
// Implementation: Route loader
const projectRef = doc(firestore, 'projects', projectId)
const projectDoc = await getDoc(projectRef)
```

### Write Operations

**Create Project**:
```typescript
// Implementation: useCreateProject hook
const projectsRef = collection(firestore, 'projects')
const newProject = {
  name: 'Untitled project',
  workspaceId: workspaceId,
  status: 'draft',
  activeEventId: null,
  deletedAt: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}
await addDoc(projectsRef, newProject)
```

**Soft Delete Project**:
```typescript
// Implementation: useDeleteProject hook
const projectRef = doc(firestore, 'projects', projectId)
await updateDoc(projectRef, {
  status: 'deleted',
  deletedAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})
```

## Security Model

All security is enforced at the **Firestore security rules level**, not in application code.

**Principles**:
1. ✅ Client code is UNTRUSTED - all validation happens server-side (Firestore rules)
2. ✅ Workspace-scoped access - enforced by rules, not application logic
3. ✅ Soft deletes are database-level filtered - deleted projects invisible in queries
4. ✅ No custom server functions needed - Firebase handles all security

**Admin Authorization**:
- Assumes `request.auth.token.admin == true` for admin users
- Workspace admin check verifies workspace exists and is active
- Follows existing authorization pattern from workspace collection

## Validation Strategy

**Zod Schemas** (Client-Side):
- Runtime validation of user input (forms, API responses)
- Type safety for TypeScript
- Does NOT replace Firestore rules (client validation is UX, not security)

**Firestore Rules** (Server-Side):
- Authoritative validation layer (client-side validation can be bypassed)
- Enforces data structure, field types, and business rules
- Prevents malicious or malformed data from being stored

**Both Layers Required**:
- Zod schemas provide immediate user feedback (client-side)
- Firestore rules provide security guarantee (server-side)

## Deployment Checklist

Before deploying the Projects feature to production:

- [ ] Deploy Firestore indexes via `pnpm fb:deploy:indexes`
- [ ] Wait for index build to complete (check Firebase Console)
- [ ] Deploy Firestore security rules via `pnpm fb:deploy:rules`
- [ ] Test rules in Firebase Emulator (local testing)
- [ ] Verify workspace-scoped access in staging environment
- [ ] Verify soft delete filtering works correctly
- [ ] Monitor Firestore read/write costs after deployment
- [ ] Set up alerting for security rule violations (Firebase Console)

## Monitoring & Observability

**Firestore Metrics** (Firebase Console):
- Read/write operations count
- Index usage statistics
- Security rule evaluation failures
- Query performance (latency percentiles)

**Application Metrics** (Sentry):
- Mutation errors (create/delete failures)
- Real-time listener errors
- Authentication failures
- Network errors

**Cost Monitoring**:
- Firestore reads: ~$0.06 per 100K reads
- Firestore writes: ~$0.18 per 100K writes
- Index storage: ~$0.18 per GB/month
- Expected cost: <$1/month for 100 active users

## Future API Contracts

When the feature expands to include Events and Media, additional contracts will be added:

- `events.rules` - Security rules for events collection
- `events.indexes.json` - Indexes for event queries
- `media.rules` - Security rules for media uploads
- `media-processing.openapi.yaml` - AI processing API (if using Cloud Functions)

For now, the Projects feature only requires Firestore rules and indexes.
