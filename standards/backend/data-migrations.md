# Data Migrations Standards

This document defines principles and best practices for schema migrations and data evolution in Firestore.

## Core Principles

### 1. Developer Approval Required
- **All migrations must be discussed and approved by a developer before implementation**
- Migrations can have irreversible effects on production data
- Review migration logic, rollback strategy, and timing with the team
- Document the approval in the migration file or PR

### 2. Zero-Downtime Migrations
- Never break production during migrations
- Use expand-contract pattern for breaking changes
- Deploy compatibility code before migrating data

### 3. Schema Versioning
- Track schema versions in documents
- Use `schemaVersion` field for migration tracking
- Increment version when making breaking changes

### 4. Defensive Reading
- Read-time compatibility layers as safety nets
- Handle unknown/legacy values gracefully
- Don't rely solely on migration scripts

### 5. Explicit Migrations
- Migration scripts over lazy write-back
- One-time scripts for bulk data changes
- Audit trail for what was migrated

### 6. Use Transactions and Batches
- **Always use batched writes** for migration scripts (max 500 operations per batch)
- **Use transactions** when migration logic depends on current document state
- Never use individual `get()` followed by `update()` - use transactions instead
- Batches ensure atomicity and better performance

## Schema Versioning Pattern

### Document Structure

Include `schemaVersion` in versioned documents:

```typescript
export const projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number().default(1),
  theme: themeSchema.nullable().default(null),
  // ... other fields
})
```

### Version Tracking

```typescript
// In schema file
export const CURRENT_CONFIG_VERSION = 2

// Bump version when making breaking changes
// Document what changed in migration file
```

## Expand-Contract Migration Pattern

For breaking schema changes, follow this three-phase approach:

### Phase 1: Expand (Deploy First)

Deploy code that reads **both** old and new formats:

```typescript
// src/domains/event/shared/migrations/config-migrations.ts

export const CURRENT_CONFIG_VERSION = 2

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/**
 * Migration registry - maps version to migration function
 * Each migration transforms data from version N to N+1
 */
const migrations: Record<number, Migration> = {
  // v1 -> v2: Map legacy button radius values
  1: (data) => {
    const theme = data.theme as Record<string, unknown> | null
    if (theme?.button) {
      const button = theme.button as Record<string, unknown>
      const radiusMapping: Record<string, string> = {
        none: 'square',
        sm: 'rounded',
        md: 'rounded',
        full: 'pill',
      }
      const oldRadius = button.radius as string
      if (oldRadius && radiusMapping[oldRadius]) {
        button.radius = radiusMapping[oldRadius]
      }
    }
    return { ...data, schemaVersion: 2 }
  },
}

/**
 * Apply all pending migrations to bring data to current version
 * Used as read-time compatibility layer
 */
export function migrateConfig(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return { schemaVersion: CURRENT_CONFIG_VERSION }
  }

  let config = data as Record<string, unknown>
  const version = (config.schemaVersion as number) ?? 1

  // Apply migrations sequentially
  for (let v = version; v < CURRENT_CONFIG_VERSION; v++) {
    const migrate = migrations[v]
    if (migrate) {
      config = migrate(config)
    }
  }

  return config
}
```

Apply migration before parsing:

```typescript
// In query or Firestore utils
import { migrateConfig } from '../migrations/config-migrations'

function parseEventConfig(rawData: unknown): ProjectEventConfig {
  const migrated = migrateConfig(rawData)
  return projectEventConfigSchema.parse(migrated)
}
```

**Key point**: This phase only reads both formats. It does NOT write back migrated data.

### Phase 2: Migrate (Run Script)

After compatibility code is deployed, run the migration script.

**IMPORTANT**: Always use batched writes for migrations. Never use individual `get()` + `update()` calls.

```typescript
/**
 * Migration: 002-theme-radius-values
 * Date: 2024-01-15
 * Author: developer-name
 * Approved by: senior-developer
 *
 * Changes:
 * - Maps old button radius values (none, sm, md, full) to new values (square, rounded, pill)
 * - Affects: draftConfig.theme.button.radius, publishedConfig.theme.button.radius
 * - Bumps schemaVersion from 1 to 2
 */

import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert } from 'firebase-admin/app'

// Initialize Firebase Admin
initializeApp({
  credential: cert('./service-account.json'),
})

const db = getFirestore()
const BATCH_SIZE = 500

const RADIUS_MAPPING: Record<string, string> = {
  none: 'square',
  sm: 'rounded',
  md: 'rounded',
  full: 'pill',
}

interface MigrationResult {
  total: number
  migrated: number
  skipped: number
  errors: Array<{ path: string; error: string }>
}

function computeUpdates(data: FirebaseFirestore.DocumentData): Record<string, unknown> {
  const updates: Record<string, unknown> = {}

  // Migrate draftConfig
  const draftRadius = data.draftConfig?.theme?.button?.radius
  if (draftRadius && RADIUS_MAPPING[draftRadius]) {
    updates['draftConfig.theme.button.radius'] = RADIUS_MAPPING[draftRadius]
    updates['draftConfig.schemaVersion'] = 2
  }

  // Migrate publishedConfig
  const publishedRadius = data.publishedConfig?.theme?.button?.radius
  if (publishedRadius && RADIUS_MAPPING[publishedRadius]) {
    updates['publishedConfig.theme.button.radius'] = RADIUS_MAPPING[publishedRadius]
    updates['publishedConfig.schemaVersion'] = 2
  }

  return updates
}

async function migrateThemeRadius(dryRun = true): Promise<MigrationResult> {
  console.log(`Starting theme radius migration... (dry run: ${dryRun})`)

  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  }

  // Use collectionGroup for efficient querying across all projects
  const eventsSnapshot = await db.collectionGroup('events').get()
  result.total = eventsSnapshot.size

  // Collect updates for batching
  const pendingUpdates: Array<{
    ref: FirebaseFirestore.DocumentReference
    updates: Record<string, unknown>
  }> = []

  for (const doc of eventsSnapshot.docs) {
    const updates = computeUpdates(doc.data())

    if (Object.keys(updates).length > 0) {
      pendingUpdates.push({ ref: doc.ref, updates })
    } else {
      result.skipped++
    }
  }

  // Execute in batches
  if (!dryRun) {
    for (let i = 0; i < pendingUpdates.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const chunk = pendingUpdates.slice(i, i + BATCH_SIZE)

      for (const { ref, updates } of chunk) {
        batch.update(ref, updates)
      }

      try {
        await batch.commit()
        result.migrated += chunk.length
        console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} documents)`)
      } catch (error) {
        for (const { ref } of chunk) {
          result.errors.push({
            path: ref.path,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }
  } else {
    // Dry run - just log what would be updated
    for (const { ref, updates } of pendingUpdates) {
      console.log(`[DRY RUN] Would update ${ref.path}:`, updates)
      result.migrated++
    }
  }

  console.log('\nMigration Summary:')
  console.log(`  Total documents: ${result.total}`)
  console.log(`  Migrated: ${result.migrated}`)
  console.log(`  Skipped: ${result.skipped}`)
  console.log(`  Errors: ${result.errors.length}`)

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    result.errors.forEach((e) => console.log(`  ${e.path}: ${e.error}`))
  }

  return result
}

// Run with: DRY_RUN=false npx ts-node migrations/002-theme-radius-values.ts
const dryRun = process.env.DRY_RUN !== 'false'
migrateThemeRadius(dryRun).catch(console.error)
```

### Phase 3: Contract (Cleanup)

After confirming all data is migrated:

1. Remove the migration layer (optional - can keep as safety net)
2. Update schema to only accept new values
3. Remove old value handling code

## Migration Script Best Practices

### DO: Use Batched Writes (Default Choice)

**Batches** are the default choice for migrations. Use them when:
- Updates don't depend on current document values (simple field mappings)
- You can compute all updates from the initial snapshot

```typescript
const BATCH_SIZE = 500

async function migrateBatched() {
  const snapshot = await db.collectionGroup('events').get()

  // Collect all updates first
  const pendingUpdates: Array<{
    ref: FirebaseFirestore.DocumentReference
    updates: Record<string, unknown>
  }> = []

  for (const doc of snapshot.docs) {
    const updates = computeUpdates(doc.data())
    if (Object.keys(updates).length > 0) {
      pendingUpdates.push({ ref: doc.ref, updates })
    }
  }

  // Execute in batches
  for (let i = 0; i < pendingUpdates.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = pendingUpdates.slice(i, i + BATCH_SIZE)

    for (const { ref, updates } of chunk) {
      batch.update(ref, updates)
    }

    await batch.commit()
    console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1}`)
  }
}
```

### DO: Use Transactions When Updates Depend on Current State

**Transactions** are needed when:
- Migration logic depends on reading current document values
- You need read-modify-write atomicity
- Concurrent updates could cause data corruption

```typescript
async function migrateWithTransaction(docRef: FirebaseFirestore.DocumentReference) {
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef)
    if (!doc.exists) return

    const data = doc.data()!
    const currentCount = data.processedCount ?? 0
    const newStatus = currentCount > 10 ? 'completed' : 'pending'

    // Update based on current state
    transaction.update(docRef, {
      status: newStatus,
      schemaVersion: 2,
    })
  })
}

// For bulk transaction migrations, process sequentially (transactions can't be batched)
async function migrateAllWithTransactions() {
  const snapshot = await db.collectionGroup('events').get()

  for (const doc of snapshot.docs) {
    await migrateWithTransaction(doc.ref)
  }
}
```

### DON'T: Use Individual get() + update() (Race Conditions)

```typescript
// ❌ NEVER do this - race condition between get and update
async function badMigration(docRef: FirebaseFirestore.DocumentReference) {
  const doc = await docRef.get()
  const data = doc.data()!

  // Another process could modify the document here!

  await docRef.update({
    newField: computeFromData(data),
  })
}

// ✅ Use transaction instead
async function goodMigration(docRef: FirebaseFirestore.DocumentReference) {
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef)
    const data = doc.data()!

    transaction.update(docRef, {
      newField: computeFromData(data),
    })
  })
}
```

### DO: Add Dry-Run Mode

```typescript
async function migrate(dryRun = true) {
  const snapshot = await db.collectionGroup('events').get()

  for (const doc of snapshot.docs) {
    const updates = computeUpdates(doc.data())

    if (dryRun) {
      console.log(`[DRY RUN] Would update ${doc.ref.path}:`, updates)
    } else {
      await doc.ref.update(updates)
      console.log(`Updated: ${doc.ref.path}`)
    }
  }
}

// Run with: DRY_RUN=true npx ts-node migrate.ts
migrate(process.env.DRY_RUN === 'true')
```

### DO: Log Progress and Results

```typescript
interface MigrationResult {
  total: number
  migrated: number
  skipped: number
  errors: Array<{ path: string; error: string }>
}

async function migrateWithLogging(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  }

  // ... migration logic with result tracking

  console.log('Migration Summary:')
  console.log(`  Total documents: ${result.total}`)
  console.log(`  Migrated: ${result.migrated}`)
  console.log(`  Skipped: ${result.skipped}`)
  console.log(`  Errors: ${result.errors.length}`)

  if (result.errors.length > 0) {
    console.log('Errors:')
    result.errors.forEach(e => console.log(`  ${e.path}: ${e.error}`))
  }

  return result
}
```

### DO: Handle Errors Gracefully

```typescript
async function migrateWithRetry(maxRetries = 3) {
  const snapshot = await db.collectionGroup('events').get()

  for (const doc of snapshot.docs) {
    let retries = 0
    while (retries < maxRetries) {
      try {
        const updates = computeUpdates(doc.data())
        if (Object.keys(updates).length > 0) {
          await doc.ref.update(updates)
        }
        break // Success, move to next document
      } catch (error) {
        retries++
        if (retries >= maxRetries) {
          console.error(`Failed after ${maxRetries} retries: ${doc.ref.path}`)
        } else {
          console.log(`Retry ${retries} for ${doc.ref.path}`)
          await sleep(1000 * retries) // Exponential backoff
        }
      }
    }
  }
}
```

### DON'T: Lazy Write-Back on Client

```typescript
// ❌ DON'T do this - risky for publishedConfig
function useEventConfig(eventId: string) {
  const [config, setConfig] = useState<ProjectEventConfig | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      const raw = snapshot.data()
      const migrated = migrateConfig(raw)

      // ❌ Writing back on read - dangerous!
      if (migrated.schemaVersion !== raw.schemaVersion) {
        await updateDoc(docRef, migrated)
      }

      setConfig(migrated)
    })
    return unsubscribe
  }, [eventId])

  return config
}
```

**Why it's problematic:**
- Race conditions with concurrent updates
- Modifies `publishedConfig` unexpectedly
- Hard to audit what was changed and when
- Can cause infinite update loops

## Migration File Naming

Use numbered prefixes for ordering:

```
migrations/
├── 001-initial-schema.ts
├── 002-theme-radius-values.ts
├── 003-sharing-config-defaults.ts
└── README.md
```

Include metadata in each migration:

```typescript
/**
 * Migration: 002-theme-radius-values
 * Date: 2024-01-15
 * Author: developer-name
 * Approved by: senior-developer (or "self" for non-breaking changes)
 *
 * Changes:
 * - Maps old button radius values (none, sm, md, full) to new values (square, rounded, pill)
 * - Affects: draftConfig.theme.button.radius, publishedConfig.theme.button.radius
 * - Bumps schemaVersion from 1 to 2
 *
 * Rollback:
 * - Reverse the mapping in RADIUS_MAPPING
 * - Set schemaVersion back to 1
 *
 * Notes:
 * - Approved in PR #123 / Slack thread link / meeting on date
 */
```

## When to Use Each Approach

| Scenario | Approach |
|----------|----------|
| **Adding optional field** | Just add with `.nullable().default(null)` - no migration needed |
| **Renaming field** | Expand-contract with migration script |
| **Changing field type** | Expand-contract with migration script |
| **Changing enum values** | Expand-contract with migration script |
| **Removing field** | Just remove from schema - old data ignored with `.looseObject()` |
| **Adding required field** | Add with default, then optionally migrate to populate |

## Testing Migrations

### Unit Test Migration Functions

```typescript
import { describe, it, expect } from 'vitest'
import { migrateConfig } from './config-migrations'

describe('migrateConfig', () => {
  it('should migrate v1 radius values to v2', () => {
    const v1Data = {
      schemaVersion: 1,
      theme: {
        button: { radius: 'md' }
      }
    }

    const result = migrateConfig(v1Data)

    expect(result.schemaVersion).toBe(2)
    expect(result.theme.button.radius).toBe('rounded')
  })

  it('should handle already migrated data', () => {
    const v2Data = {
      schemaVersion: 2,
      theme: {
        button: { radius: 'rounded' }
      }
    }

    const result = migrateConfig(v2Data)

    expect(result.schemaVersion).toBe(2)
    expect(result.theme.button.radius).toBe('rounded')
  })

  it('should handle null theme', () => {
    const data = { schemaVersion: 1, theme: null }
    const result = migrateConfig(data)
    expect(result.schemaVersion).toBe(2)
  })
})
```

### Test Migration Script with Emulator

```typescript
// Use Firebase Emulator for integration tests
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

describe('Migration Script', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: { host: 'localhost', port: 8080 }
    })
  })

  it('should migrate all events', async () => {
    // Seed test data
    // Run migration
    // Verify results
  })
})
```

## Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| **Run migration (dry run)** | `DRY_RUN=true npx ts-node migrations/002-*.ts` |
| **Run migration (live)** | `npx ts-node migrations/002-*.ts` |
| **Check schema version** | `db.doc(path).get().then(d => d.data().schemaVersion)` |
| **Apply read-time migration** | `migrateConfig(rawData)` before parsing |

## Checklist for Breaking Changes

- [ ] **Discuss migration need and approach with developer/team**
- [ ] **Get explicit approval before proceeding**
- [ ] Create migration function in `migrations/` folder
- [ ] Document approval in migration file header (author, approver, date)
- [ ] Add read-time compatibility layer
- [ ] Write unit tests for migration function
- [ ] Deploy code with compatibility layer (Phase 1)
- [ ] Run migration script in dry-run mode
- [ ] Review dry-run output with team
- [ ] Run migration script (Phase 2)
- [ ] Verify data in Firestore console
- [ ] Monitor for errors in production
- [ ] Schedule cleanup of compatibility code (Phase 3)

## Resources

- [Firestore Data Model Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Schema Versioning Patterns](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)
- [Zero-Downtime Migrations](https://stripe.com/blog/online-migrations)
