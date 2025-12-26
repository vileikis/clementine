# Firestore Security Rules

This document defines principles and patterns for Firestore security rules and access control.

## Core Principles

### 1. Secure by Default
- Deny access unless explicitly allowed
- Never trust client input
- Validate all data server-side

### 2. Read/Write Separation
- Allow granular read access for real-time updates
- Restrict writes to enforce business logic
- Use security rules as last line of defense

### 3. Authentication-Ready
- Design rules for future authentication
- Plan for user-specific access control
- Keep POC simple, tighten for production

## Current Strategy (POC)

### Allow All Reads, Deny All Writes

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;   // Client SDK can read/subscribe
      allow write: if false; // Force all writes through server logic
    }
  }
}
```

**Why this approach:**
- ✅ Client SDK can read and subscribe to real-time updates
- ✅ All mutations enforced through server-side validation
- ✅ Business logic stays secure
- ✅ Ready to tighten when authentication is added

**Location:** `/firebase/firestore.rules`

## Future Authentication Patterns

### User-Specific Access Control

When authentication is added:

```javascript
// Helper functions
function isAuthenticated() {
  return request.auth != null;
}

function isOwner(companyId) {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/companies/$(companyId))
           .data.ownerId == request.auth.uid;
}

function isTeamMember(companyId) {
  return isAuthenticated() &&
         request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId))
           .data.teamMembers;
}
```

### Granular Collection Rules

```javascript
// Companies - only owners can write
match /companies/{companyId} {
  allow read: if isAuthenticated();
  allow write: if isOwner(companyId);
}

// Projects - company members only
match /projects/{projectId} {
  allow read: if true; // Public read for guest links
  allow write: if isOwner(resource.data.companyId);
}

// Events - guests can read live events
match /projects/{projectId}/events/{eventId} {
  allow read: if resource.data.status == 'live' ||
                 isOwner(resource.data.companyId);
  allow write: if false; // Server-side only for validation
}

// Experiences - company-scoped
match /experiences/{experienceId} {
  allow read: if isOwner(resource.data.companyId) ||
                 isTeamMember(resource.data.companyId);
  allow write: if false; // Server-side only
}
```

## Security Rule Patterns

### ✅ DO: Validate Data Shape

```javascript
function isValidEvent(data) {
  return data.keys().hasAll(['name', 'projectId', 'companyId', 'status']) &&
         data.name is string &&
         data.name.size() > 0 &&
         data.name.size() <= 100 &&
         data.status in ['draft', 'live', 'archived'];
}

match /events/{eventId} {
  allow create: if isValidEvent(request.resource.data);
  allow update: if isValidEvent(request.resource.data);
}
```

### ✅ DO: Prevent Data Tampering

```javascript
// Don't allow users to change their own companyId
match /projects/{projectId} {
  allow update: if request.resource.data.companyId == resource.data.companyId;
}
```

### ✅ DO: Use Field-Level Validation

```javascript
function validStatusTransition(before, after) {
  return (before == 'draft' && after == 'live') ||
         (before == 'live' && after == 'archived') ||
         (before == after); // No change is valid
}

match /events/{eventId} {
  allow update: if validStatusTransition(
    resource.data.status,
    request.resource.data.status
  );
}
```

### ❌ DON'T: Rely Only on Security Rules

Security rules are the **last line of defense**, not the only defense:

```typescript
// ❌ Bad: Client writes directly
await setDoc(doc(firestore, 'events', id), data)

// ✅ Good: Server-side validation first
await createEventAction(data) // Validates, then uses Admin SDK
```

**Why:**
- Rules are limited in complexity
- Rules can't enforce complex business logic
- Rules can't call external APIs
- Server-side validation is more maintainable

## Testing Security Rules

### Local Testing with Emulators

```bash
firebase emulators:start
```

### Unit Testing Rules

Use `@firebase/rules-unit-testing` for automated testing:

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

const testEnv = await initializeTestEnvironment({
  projectId: 'test-project',
  firestore: {
    rules: fs.readFileSync('firestore.rules', 'utf8'),
  },
})

// Test as unauthenticated user
const unauthedDb = testEnv.unauthenticatedContext().firestore()
await assertFails(
  setDoc(doc(unauthedDb, 'events/test'), { name: 'Test' })
)

// Test as authenticated user
const authedDb = testEnv.authenticatedContext('user123').firestore()
await assertSucceeds(
  getDoc(doc(authedDb, 'events/test'))
)
```

## Storage Security Rules

Similar patterns apply to Firebase Storage:

```javascript
// /firebase/storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // POC: Allow all reads, deny writes
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false; // Server-side only
    }

    // Future: Authenticated uploads
    match /media/{companyId}/{mediaType}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.uid in get(/databases/$(database)/documents/companies/$(companyId))
                        .data.teamMembers;
    }
  }
}
```

## Best Practices

### ✅ DO: Keep Rules Simple

- Complex logic belongs in server-side code
- Use rules for basic access control only
- Validate data shape, not business rules

### ✅ DO: Plan for Scale

- Avoid expensive `get()` calls in rules
- Cache user permissions in custom claims
- Use security rules for coarse-grained access

### ✅ DO: Version Security Rules

```javascript
// Add version comment at top of rules file
// Version: 2.0.0
// Last updated: 2024-12-26
// Changes: Added company-scoped access control
```

### ✅ DO: Document Rule Changes

Keep changelog in `/firebase/README.md`:

```markdown
## Security Rules Changelog

### v2.0.0 - 2024-12-26
- Added authentication-based access control
- Restricted writes to company owners
- Allowed public reads for live events

### v1.0.0 - 2024-01-01
- Initial POC rules (allow all reads, deny all writes)
```

### ❌ DON'T: Expose Sensitive Data in Rules

```javascript
// ❌ Don't check passwords in rules
allow read: if request.auth.token.password == resource.data.password

// ✅ Use proper authentication
allow read: if request.auth != null
```

### ❌ DON'T: Use Rules for Rate Limiting

Security rules can't rate limit. Use:
- Firebase App Check for abuse prevention
- Cloud Functions with rate limiting middleware
- Firestore quotas and limits

## Deployment

### Deploy Rules Only

```bash
pnpm fb:deploy:rules
```

### Deploy Rules with Indexes

```bash
pnpm fb:deploy
```

### Validate Before Deploy

```bash
firebase deploy --only firestore:rules --project=staging
# Test in staging first
firebase deploy --only firestore:rules --project=production
```

## Monitoring & Debugging

### Check Rule Denials

In Firebase Console:
1. Firestore → Rules → Playground
2. Test rules with sample requests
3. View detailed evaluation logs

### Enable Debug Logging

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

// Enable logging in development
if (process.env.NODE_ENV === 'development') {
  enableIndexedDbPersistence(firestore, { forceOwnership: true })
}
```

## Quick Reference

| Scenario | Pattern |
|----------|---------|
| **POC (current)** | Allow all reads, deny all writes |
| **Authenticated users** | Check `request.auth != null` |
| **Owner-only access** | Check `request.auth.uid == resource.data.ownerId` |
| **Public reads** | `allow read: if true` |
| **Server-only writes** | `allow write: if false` |
| **Validate data shape** | Use helper functions with `.keys().hasAll()` |
| **Field-level rules** | Compare `resource.data` vs `request.resource.data` |

## Resources

- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Unit Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Common Rule Patterns](https://firebase.google.com/docs/firestore/security/rules-conditions)
