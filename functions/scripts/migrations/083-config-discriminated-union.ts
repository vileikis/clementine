#!/usr/bin/env tsx

/**
 * Migration Script: Experience Config Discriminated Union
 *
 * Feature: 083-config-discriminated-union
 *
 * This migration transforms experience documents from the flat nullable config
 * structure to the new discriminated union structure.
 *
 * Per-document transformation:
 *   1. Read `experience.type` (top-level field)
 *   2. Inject `type` into `draft`: draft.type = experience.type
 *   3. If `published` is not null: inject published.type = experience.type
 *   4. Set `draftType = experience.type` (denormalized query field)
 *   5. Delete top-level `type` field
 *   6. Delete null type-specific config fields (photo, gif, video, aiImage, aiVideo)
 *      from draft and published
 *
 * Idempotency: Skips documents where `draft.type` already exists.
 *
 * Usage:
 *   pnpm tsx scripts/migrations/083-config-discriminated-union.ts [--dry-run] [--production]
 *
 * Flags:
 *   --dry-run     Preview changes without writing to Firestore
 *   --production  Run against production (default is emulators)
 *
 * Requirements:
 * - For emulator: Firebase emulators must be running
 * - For production: GOOGLE_APPLICATION_CREDENTIALS env var must be set
 *   or credentials at functions/credentials/prod-service-account-1.json
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isProduction = args.includes('--production')

// Configure emulator endpoints for non-production
if (!isProduction) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
}

// Initialize Firebase Admin
if (isProduction) {
  let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialsPath) {
    const defaultPath = path.resolve(__dirname, '../../credentials/prod-service-account-1.json')
    if (fs.existsSync(defaultPath)) {
      credentialsPath = defaultPath
      console.log(`Using default credentials: ${defaultPath}`)
    } else {
      console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable must be set for production')
      console.error('Or place credentials at: functions/credentials/prod-service-account-1.json')
      process.exit(1)
    }
  }

  const serviceAccountJson = fs.readFileSync(credentialsPath, 'utf-8')
  const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount

  initializeApp({
    credential: cert(serviceAccount),
  })
} else {
  initializeApp({
    projectId: 'demo-clementine',
  })
}

const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

// ── Types ──────────────────────────────────────────────────────

const VALID_TYPES = new Set(['survey', 'photo', 'gif', 'video', 'ai.image', 'ai.video'])

/** Type-specific config keys that should be removed when null */
const TYPE_CONFIG_KEYS = ['photo', 'gif', 'video', 'aiImage', 'aiVideo'] as const

interface MigrationStats {
  experiencesScanned: number
  experiencesMigrated: number
  experiencesSkipped: number
  skipReasons: Record<string, number>
  errors: Array<{ experienceId: string; workspaceId: string; error: string }>
}

// ── Migration Logic ────────────────────────────────────────────

/**
 * Check if a document has already been migrated.
 * A doc is migrated if `draft.type` already exists with a valid value.
 */
function isAlreadyMigrated(data: Record<string, unknown>): boolean {
  const draft = data['draft'] as Record<string, unknown> | null | undefined
  if (!draft) return false

  const draftType = draft['type'] as string | undefined
  return draftType !== undefined && VALID_TYPES.has(draftType)
}

/**
 * Process a single experience document.
 * Returns the Firestore update object or null if no migration needed.
 */
function processExperience(data: Record<string, unknown>): Record<string, unknown> | null {
  // Idempotency check
  if (isAlreadyMigrated(data)) {
    return null
  }

  const type = data['type'] as string | undefined

  if (!type || !VALID_TYPES.has(type)) {
    return null
  }

  const updates: Record<string, unknown> = {}

  // 1. Inject type into draft
  updates['draft.type'] = type

  // 2. If published exists, inject type into published
  const published = data['published'] as Record<string, unknown> | null | undefined
  if (published) {
    updates['published.type'] = type
  }

  // 3. Set draftType (denormalized query field)
  updates['draftType'] = type

  // 4. Delete top-level type field
  updates['type'] = FieldValue.delete()

  // 5. Delete null type-specific config fields from draft
  const draft = data['draft'] as Record<string, unknown> | null | undefined
  if (draft) {
    for (const key of TYPE_CONFIG_KEYS) {
      if (draft[key] === null) {
        updates[`draft.${key}`] = FieldValue.delete()
      }
    }
  }

  // 6. Delete null type-specific config fields from published
  if (published) {
    for (const key of TYPE_CONFIG_KEYS) {
      if (published[key] === null) {
        updates[`published.${key}`] = FieldValue.delete()
      }
    }
  }

  return updates
}

// ── Main ───────────────────────────────────────────────────────

const BATCH_SIZE = 500

async function runMigration(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Migration: 083-config-discriminated-union')
  console.log('  Transform flat config to discriminated union + draftType')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Target: ${isProduction ? 'PRODUCTION' : 'EMULATORS'}`)
  console.log('')

  if (isProduction && !isDryRun) {
    console.log('WARNING: Running in PRODUCTION mode!')
    console.log('    Press Ctrl+C within 5 seconds to abort...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    console.log('')
  }

  const stats: MigrationStats = {
    experiencesScanned: 0,
    experiencesMigrated: 0,
    experiencesSkipped: 0,
    skipReasons: {
      'already-migrated': 0,
      'no-type-field': 0,
    },
    errors: [],
  }

  try {
    console.log('Fetching all experiences via collectionGroup query...')
    const experiencesSnapshot = await db.collectionGroup('experiences').get()
    stats.experiencesScanned = experiencesSnapshot.size
    console.log(`Found ${stats.experiencesScanned} experiences`)
    console.log('')

    // Process in batches
    let batch = db.batch()
    let batchCount = 0

    for (const doc of experiencesSnapshot.docs) {
      const data = doc.data()
      const experienceId = doc.id
      const pathSegments = doc.ref.path.split('/')
      const workspaceId = pathSegments[1] ?? 'unknown'
      const name = (data['name'] as string) ?? '(unnamed)'
      const type = (data['type'] as string) ?? '(none)'

      try {
        const updates = processExperience(data)

        if (!updates) {
          const reason = isAlreadyMigrated(data) ? 'already-migrated' : 'no-type-field'
          stats.skipReasons[reason]++
          stats.experiencesSkipped++
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - Skipped (${reason})`)
          continue
        }

        if (!isDryRun) {
          batch.update(doc.ref, updates)
          batchCount++

          // Commit when reaching batch limit
          if (batchCount >= BATCH_SIZE) {
            await batch.commit()
            console.log(`  [batch] Committed ${batchCount} updates`)
            batch = db.batch()
            batchCount = 0
          }

          console.log(`  [${workspaceId}/${experienceId}] "${name}" - Migrated (type: '${type}' → draftType + draft.type)`)
        } else {
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - [DRY RUN] Would migrate (type: '${type}' → draftType + draft.type)`)
        }

        stats.experiencesMigrated++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`  [${workspaceId}/${experienceId}] "${name}" - ERROR: ${errorMessage}`)
        stats.errors.push({ experienceId, workspaceId, error: errorMessage })
      }
    }

    // Commit remaining batch
    if (!isDryRun && batchCount > 0) {
      await batch.commit()
      console.log(`  [batch] Committed ${batchCount} updates (final)`)
    }

    // Print summary
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  Migration Summary')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  Experiences scanned:    ${stats.experiencesScanned}`)
    console.log(`  Experiences migrated:   ${stats.experiencesMigrated}`)
    console.log(`  Experiences skipped:    ${stats.experiencesSkipped}`)
    console.log('')
    console.log('  Skip Reasons:')
    console.log(`    already migrated:     ${stats.skipReasons['already-migrated']}`)
    console.log(`    no type field:        ${stats.skipReasons['no-type-field']}`)
    console.log('')
    console.log(`  Errors:                 ${stats.errors.length}`)

    if (stats.errors.length > 0) {
      console.log('')
      console.log('  Error Details:')
      for (const err of stats.errors) {
        console.log(`    - [${err.workspaceId}/${err.experienceId}] ${err.error}`)
      }
    }

    console.log('')
    if (isDryRun) {
      console.log('  This was a DRY RUN. No changes were made.')
      console.log('  Run without --dry-run to apply changes.')
    } else if (stats.experiencesMigrated > 0) {
      console.log('  Migration completed successfully!')
    } else {
      console.log('  No experiences needed migration.')
    }
    console.log('')

  } catch (error) {
    console.error('Fatal error during migration:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
