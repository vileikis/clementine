# Firebase Configuration

This directory contains all Firebase-related configuration files for the Clementine project.

## Files

### Security Rules

- **`firestore.rules`** - Firestore database security rules
  - Authentication-based access control using Firebase Auth custom claims
  - Admin users (with `admin: true` claim) have full read/write access
  - Authenticated users have scoped access per collection
  - Soft deletes enforced (hard deletes forbidden)

- **`storage.rules`** - Firebase Storage security rules
  - Controls access to uploaded images and media files
  - Authenticated reads, admin-only writes

### Configuration

- **`firestore.indexes.json`** - Firestore composite indexes
  - Defines indexes for complex queries across all collections
  - Firebase automatically creates single-field indexes

## Database Structure

### Top-Level Collections

- **`workspaces`** - Workspace/tenant containers
  - **`mediaAssets`** (subcollection) - Uploaded media files
  - **`experiences`** (subcollection) - AI experience configurations

- **`projects`** - Project containers
  - **`events`** (subcollection) - Event configurations
  - **`sessions`** (subcollection) - Guest session executions
  - **`jobs`** (subcollection) - Transform pipeline job tracking

### Indexes

Composite indexes are defined for:

| Collection | Fields | Purpose |
|------------|--------|---------|
| workspaces | slug + status | Lookup by slug |
| workspaces | status + createdAt | List active workspaces |
| projects | workspaceId + status + createdAt | List projects in workspace |
| projects | type + workspaceId + status + createdAt | Filter by project type |
| experiences | status + createdAt | List experiences |
| experiences | status + profile + createdAt | Filter by profile |
| sessions | guestId + createdAt | Guest session history |
| jobs | projectId + status + createdAt | List jobs by project |
| jobs | sessionId + createdAt | Jobs for a session |
| events | status + createdAt | List events |
| events | companyId + createdAt | Events by company |

## Deployment

Deploy from the **root directory**:

```bash
# Deploy only security rules
pnpm fb:deploy:rules

# Deploy only Firestore indexes
pnpm fb:deploy:indexes

# Deploy everything (rules + indexes + functions)
pnpm fb:deploy
```

**Note**: After adding new indexes, deploy them before queries will work in production.

## Security Strategy

Uses **authentication-based access control** with Firebase Auth custom claims:

### Admin Users (`admin: true` claim)
- Full read/write access to all collections
- Can manage workspaces, projects, experiences, events
- Can view all sessions and jobs

### Authenticated Users
- Can read public data (experiences, events, projects)
- Can create/read/update their own sessions
- Cannot access jobs (admin debugging only)
- Cannot hard delete any documents

### Server (Admin SDK)
- Full access via Cloud Functions
- All job creation/updates happen server-side
- Business logic and validation enforced

### Design Principles

1. **Authentication required** - All operations require Firebase Auth
2. **Soft deletes only** - Hard deletes forbidden in rules
3. **Owner-scoped writes** - Users can only modify their own data
4. **Admin override** - Admins can access everything
5. **Server-side jobs** - Job collection is admin-only (Cloud Functions)

## Testing Rules Locally

Use the Firebase Emulator Suite to test rules locally:

```bash
# Start emulators (from root directory)
firebase emulators:start

# Emulator UI available at http://localhost:4000
# - Firestore: localhost:8080
# - Storage: localhost:9199
```

## Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
