# Firestore Security Rules

This document defines principles and patterns for Firestore security rules and access control.

## Core Principles

### 1. Simple Authentication Checks Only
- Security rules check **WHO** can access data
- Zod schemas validate **WHAT** data is valid
- Keep rules simple and maintainable

### 2. No Data Validation in Rules
- Don't validate data shape in security rules
- Don't check field lengths or enums
- Use Zod schemas in application code instead

### 3. Admin SDK for Deletes
- Soft deletes (status updates) via client SDK
- Hard deletes (actual removal) via Admin SDK in scheduled jobs
- Never allow deletes in security rules

### 4. Case-by-Case Permissions
- Some collections are public read (e.g., projects for guest links)
- Some collections require authentication
- Admin-only writes for management operations

## Current Strategy (Production)

### Simple Authentication-Based Rules

**Core principle**: Security rules check WHO can access, Zod schemas validate WHAT data is valid.

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null && !request.auth.token.isAnonymous;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }

    // Workspaces - admin read/write, no deletes
    match /workspaces/{workspaceId} {
      allow read: if isAdmin();
      allow create, update: if isAdmin();
      allow delete: if false; // Handled by Admin SDK scheduled jobs
    }

    // Projects - public read, admin write, no deletes
    match /projects/{projectId} {
      allow read: if true; // Public read for guest links
      allow create, update: if isAdmin();
      allow delete: if false; // Handled by Admin SDK scheduled jobs
    }

    // Events - case-by-case permissions
    match /events/{eventId} {
      allow read: if resource.data.status == 'live' || isAdmin();
      allow create, update: if isAdmin();
      allow delete: if false;
    }

    // Add more collections as needed with similar patterns
  }
}
```

**Why this approach:**
- ✅ Simple authentication and role checks only
- ✅ Data validation happens with Zod schemas in application code
- ✅ Deletes handled by Admin SDK with proper business logic
- ✅ Easy to understand and maintain
- ✅ Case-by-case permissions per collection

**Location:** `/firebase/firestore.rules`

## What to Validate Where

### ✅ IN Security Rules (Authentication/Authorization)

```javascript
// ✅ Check if user is authenticated
allow read: if request.auth != null

// ✅ Check if user is admin
allow write: if request.auth.token.admin == true

// ✅ Check resource status for conditional access
allow read: if resource.data.status == 'live'

// ✅ Prevent deletes (use Admin SDK instead)
allow delete: if false
```

### ✅ IN Application Code (Data Validation)

```typescript
// ✅ Validate data shape with Zod
const projectSchema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(['draft', 'active', 'archived']),
  workspaceId: z.string(),
})

// ✅ Validate before mutation
const validated = projectSchema.parse(input)
await createProject(validated)
```

### ❌ DON'T: Validate Data in Rules

```javascript
// ❌ Don't validate data shape in rules
function isValidEvent(data) {
  return data.keys().hasAll(['name', 'projectId']) &&
         data.name is string &&
         data.name.size() > 0 &&
         data.name.size() <= 100
}

// ❌ Don't check field values
allow write: if request.resource.data.status in ['draft', 'live', 'archived']

// ❌ Don't validate business logic
function validStatusTransition(before, after) {
  return (before == 'draft' && after == 'live')
}
```

**Why NOT validate in rules:**
- Rules are limited in complexity
- Hard to maintain and debug
- Can't provide good error messages
- Zod schemas are more powerful and flexible

## Common Patterns

### Public Read, Admin Write

```javascript
match /projects/{projectId} {
  allow read: if true; // Anyone can read
  allow write: if isAdmin(); // Only admins can write
  allow delete: if false; // No deletes
}
```

### Conditional Read Based on Status

```javascript
match /events/{eventId} {
  // Live events are public, others are admin-only
  allow read: if resource.data.status == 'live' || isAdmin();
  allow write: if isAdmin();
  allow delete: if false;
}
```

### Admin-Only Access

```javascript
match /workspaces/{workspaceId} {
  allow read: if isAdmin();
  allow write: if isAdmin();
  allow delete: if false; // Handled by scheduled jobs
}
```

## Storage Security Rules

Similar simple patterns for Firebase Storage:

```javascript
// /firebase/storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read, admin write
    match /media/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true;
      allow delete: if false; // Handled by Admin SDK
    }
  }
}
```

## Testing Security Rules

### Local Testing with Emulators

```bash
firebase emulators:start
```

Test rules locally before deploying.

### Manual Testing

1. Open Firebase Console → Firestore → Rules
2. Use Rules Playground to simulate requests
3. Test as authenticated user, admin, and anonymous

### Automated Testing (Optional)

Use `@firebase/rules-unit-testing` for automated tests:

```typescript
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'

const testEnv = await initializeTestEnvironment({
  projectId: 'test-project',
  firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
})

// Test unauthenticated access
const unauthedDb = testEnv.unauthenticatedContext().firestore()
await assertFails(setDoc(doc(unauthedDb, 'workspaces/test'), {}))

// Test admin access
const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore()
await assertSucceeds(setDoc(doc(adminDb, 'workspaces/test'), { name: 'Test' }))
```

## Best Practices

### ✅ DO: Keep Rules Simple

- Only check authentication and roles
- No data validation (use Zod schemas)
- No complex business logic

### ✅ DO: Use Custom Claims for Roles

```javascript
// Store roles in custom claims, not Firestore
function isAdmin() {
  return request.auth.token.admin == true
}
```

### ✅ DO: Disable Deletes in Rules

```javascript
// Always disable deletes (use Admin SDK instead)
allow delete: if false
```

### ✅ DO: Version and Document Changes

Add version comment at top of rules file:

```javascript
// Version: 2.0.0
// Last updated: 2024-12-26
// Changes: Added admin-based access control
```

### ❌ DON'T: Validate Data Shape

```javascript
// ❌ Bad: Validating data in rules
allow write: if request.resource.data.name is string &&
               request.resource.data.name.size() > 0

// ✅ Good: Validate with Zod schemas in code
const validated = schema.parse(data)
```

### ❌ DON'T: Use Expensive get() Calls

```javascript
// ❌ Bad: Expensive database lookups
allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isPremium

// ✅ Good: Use custom claims
allow read: if request.auth.token.isPremium == true
```

## Deployment

### Deploy Rules Only

```bash
pnpm fb:deploy:rules
```

### Deploy All Firebase Resources

```bash
pnpm fb:deploy
```

### Test Before Production

Always test rules in Firebase emulator before deploying:

```bash
firebase emulators:start
# Test your application with the new rules
# Deploy when confident
pnpm fb:deploy:rules
```

## Monitoring

### Check Rule Denials in Console

1. Open Firebase Console → Firestore → Rules
2. Use Rules Playground to simulate requests
3. Test different auth states (admin, authenticated, anonymous)

### Debug Permission Denied Errors

When you see "Missing or insufficient permissions":

1. Check if user is authenticated
2. Check if user has required custom claims (e.g., `admin: true`)
3. Verify collection permissions match expected pattern
4. Test in Rules Playground with actual user token

## Quick Reference

| Scenario | Pattern |
|----------|---------|
| **Admin-only** | `allow read, write: if isAdmin()` |
| **Public read, admin write** | `allow read: if true; allow write: if isAdmin()` |
| **Conditional read** | `allow read: if resource.data.status == 'live' \|\| isAdmin()` |
| **No deletes** | `allow delete: if false` |
| **Authenticated users** | `allow read: if request.auth != null` |

## Resources

- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
