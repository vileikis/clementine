# Firestore Standards

This document defines principles and best practices for Firestore database design, queries, and data management.

## Core Principles

### 1. Flat Collection Design
- Use flat, root-level collections instead of deep nesting
- Link documents by ID references, not subcollections
- Enables future SQL migration and better query flexibility

### 2. Normalized Data Model
- Store data in logical entities (companies, projects, events, experiences, steps)
- Avoid data duplication across collections
- Use references for relationships (foreign key pattern)

### 3. Read-Optimized Structure
- Denormalize selectively for read performance
- Store computed values when reads >> writes
- Balance normalization with query efficiency

### 4. Schema Evolution
- Design schemas for forward compatibility
- Use `.passthrough()` in Zod schemas to allow unknown fields
- Add new optional fields with `.nullable().default(null)`

## Collection Design

### ✅ DO: Use Flat Root Collections

```
✅ Good Structure:
/companies/{companyId}
/projects/{projectId}
/experiences/{experienceId}
/experiences/{experienceId}/steps/{stepId}  # Only one level of nesting

❌ Bad Structure:
/companies/{companyId}/projects/{projectId}/events/{eventId}/experiences/{experienceId}
```

**Why:**
- Simpler queries
- Better scalability
- Easier migrations
- More flexible access patterns

### ✅ DO: Link by ID References

```typescript
// ✅ Link documents by ID
{
  projectId: "proj_123",      // Reference to /projects/proj_123
  companyId: "comp_456",      // Reference to /companies/comp_456
  activeEventId: "evt_789"    // Reference to /events/evt_789
}

// ❌ Don't embed entire documents
{
  project: { /* full project object */ }  // Creates duplication
}
```

### ✅ DO: Use Subcollections Sparingly

**When to use subcollections:**
- Child documents are tightly coupled to parent
- Children are only accessed through parent
- Children should be deleted when parent is deleted

**Example: Steps under Experiences**
```
/experiences/{experienceId}/steps/{stepId}
```

Steps only exist within an experience and are always queried through the parent experience.

### ❌ DON'T: Store `undefined` Values

Firestore rejects `undefined` values. Always use:
- `null` for optional fields
- Empty arrays `[]` for optional array fields
- Empty strings `""` if appropriate for your use case

## Data Model Patterns

### Current Collections

**Root Collections:**
- `/companies` - Organizations (top-level scope)
- `/projects` - Containers for events (company-scoped)
- `/experiences` - Reusable flow templates (company-scoped)
- `/aiPresets` - Legacy AI configurations (deprecated, don't use)

**Subcollections:**
- `/projects/{projectId}/events/{eventId}` - Themed instances
- `/experiences/{experienceId}/steps/{stepId}` - Flow steps

### Document ID Strategy

**✅ DO: Use Auto-Generated IDs**
```typescript
const docRef = collection(firestore, 'events').doc() // Auto-generates ID
await setDoc(docRef, data)
return docRef.id
```

**✅ DO: Use Prefixed IDs for Clarity**
```typescript
const eventId = `evt_${randomId()}`
const projectId = `proj_${randomId()}`
```

**❌ DON'T: Use Sequential IDs**
- Causes hotspots in distributed systems
- Poor performance for high-write workloads

### Timestamps

**✅ DO: Store as Numbers (Unix Timestamps)**
```typescript
{
  createdAt: Date.now(),           // ✅ Number (milliseconds)
  updatedAt: Date.now(),
}
```

**❌ DON'T: Use Firestore Timestamps**
```typescript
{
  createdAt: FieldValue.serverTimestamp()  // ❌ Complex type, harder to work with
}
```

**Why numbers:**
- Simple to work with in JavaScript
- Easy to query and compare
- Portable across systems
- No timezone complexity

### Status Fields

**✅ DO: Use String Enums**
```typescript
{
  status: 'active' | 'inactive' | 'archived'
}
```

**Benefits:**
- Easy to query with `where('status', '==', 'active')`
- Human-readable in database
- Simple Zod validation

## Query Optimization

### ✅ DO: Index Strategic Fields

**Always index fields used in:**
- `where()` clauses
- `orderBy()` clauses
- Combined queries

**Define in `firebase/firestore.indexes.json`**

### ✅ DO: Minimize Reads

```typescript
// ✅ Query only what you need
const q = query(
  collection(firestore, 'events'),
  where('companyId', '==', companyId),
  where('status', '==', 'active')
)

// ❌ Don't fetch everything and filter client-side
const all = await getDocs(collection(firestore, 'events'))
const filtered = all.docs.filter(d => d.data().status === 'active')
```

### ✅ DO: Use Real-Time Listeners Wisely

```typescript
// ✅ Subscribe to specific documents
const unsubscribe = onSnapshot(
  doc(firestore, `events/${eventId}`),
  (snapshot) => { /* handle updates */ }
)

// Clean up when component unmounts
return () => unsubscribe()
```

### ❌ DON'T: Use Polling

```typescript
// ❌ Wasteful polling
setInterval(async () => {
  const doc = await getDoc(docRef)
}, 2000)

// ✅ Use real-time listener
const unsubscribe = onSnapshot(docRef, (snapshot) => { /* ... */ })
```

## Client SDK vs Admin SDK

### Client SDK (Frontend)

**Use for:**
- ✅ All reads and queries
- ✅ Real-time subscriptions (`onSnapshot`)
- ✅ Guest-facing operations
- ✅ Public data access

**Import:**
```typescript
import { firestore } from '@/integrations/firebase/client'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
```

### Admin SDK (Backend - Functions only)

**Use for:**
- ✅ Privileged operations
- ✅ Server-side business logic
- ✅ Batch operations
- ✅ Data migrations

**Import (Modular API):**
```typescript
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore()
```

**❌ DON'T: Use Global Namespace**
```typescript
// ❌ Avoid this pattern
import * as admin from 'firebase-admin'
const db = admin.firestore()
```

## Dynamic Field Updates

### ✅ DO: Use Field Mapping for Nested Updates

When updating nested fields dynamically:

```typescript
const fieldMappings = {
  buttonColor: 'theme.buttonColor',
  buttonTextColor: 'theme.buttonTextColor',
  backgroundColor: 'theme.backgroundColor',
}

const updateData: Record<string, any> = {}
Object.entries(input).forEach(([key, value]) => {
  if (value !== undefined && fieldMappings[key]) {
    updateData[fieldMappings[key]] = value
  }
})

await updateDoc(docRef, updateData)
```

**Benefits:**
- Scalable (no repetitive if statements)
- DRY (single source of truth for field mappings)
- Easy to maintain

### ❌ DON'T: Check Existence Before Updates

```typescript
// ❌ Wasteful extra read
const doc = await getDoc(docRef)
if (!doc.exists()) return { error: 'Not found' }
await updateDoc(docRef, data)

// ✅ Trust Firestore - it throws if document doesn't exist
try {
  await updateDoc(docRef, data)
} catch (error: any) {
  if (error.code === 'not-found') {
    return { error: 'Document not found' }
  }
  throw error
}
```

**Exception:** Only check existence when you need the current data for business logic.

## Validation & Type Safety

### ✅ DO: Validate with Zod Schemas

```typescript
import { eventSchema } from './schemas'

// Validate before writing
const validated = eventSchema.parse(input)
await setDoc(docRef, validated)
```

### ✅ DO: Use Firestore-Safe Schemas

See `global/zod-validation.md` for complete Zod patterns specific to Firestore.

Key rules:
- Use `.nullable().default(null)` for optional fields
- Use `.default([])` for optional arrays
- Never allow `undefined` values

## Error Handling

### ✅ DO: Handle Firestore Errors

```typescript
try {
  await updateDoc(docRef, data)
} catch (error: any) {
  if (error.code === 'not-found') {
    return { success: false, error: 'Document not found' }
  }
  if (error.code === 'permission-denied') {
    return { success: false, error: 'Permission denied' }
  }
  // Log unexpected errors
  console.error('Firestore error:', error)
  return { success: false, error: 'Internal error' }
}
```

### ✅ DO: Clean Up Listeners

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    // Handle updates
  })

  // Always clean up
  return () => unsubscribe()
}, [docRef])
```

## Transactions & Batches

### Use Transactions for Atomic Reads + Writes

```typescript
await runTransaction(firestore, async (transaction) => {
  const eventDoc = await transaction.get(eventDocRef)
  const currentCount = eventDoc.data()?.sessionCount ?? 0

  transaction.update(eventDocRef, {
    sessionCount: currentCount + 1
  })
})
```

### Use Batches for Multiple Independent Writes

```typescript
const batch = writeBatch(firestore)
batch.set(doc1Ref, data1)
batch.update(doc2Ref, data2)
batch.delete(doc3Ref)
await batch.commit()
```

## Testing

### Mock Firestore in Tests

```typescript
import { vi } from 'vitest'

vi.mock('@/integrations/firebase/client', () => ({
  firestore: {},
}))
```

See `testing/testing.md` for complete testing patterns.

## Quick Reference

| Task | Pattern |
|------|---------|
| **Create document** | `setDoc(doc(firestore, 'collection', id), data)` |
| **Update document** | `updateDoc(doc(firestore, 'collection', id), data)` |
| **Delete document** | `deleteDoc(doc(firestore, 'collection', id))` |
| **Get document** | `getDoc(doc(firestore, 'collection', id))` |
| **Query collection** | `getDocs(query(collection(firestore, 'col'), where(...)))` |
| **Real-time listener** | `onSnapshot(docRef, callback)` |
| **Batch writes** | `writeBatch(firestore)` |
| **Transaction** | `runTransaction(firestore, async (txn) => {...})` |

## Resources

- [Firestore Data Model Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Query Documentation](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
