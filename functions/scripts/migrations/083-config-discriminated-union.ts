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
 *   1. For each config (draft, published): infer actual type from which
 *      type-specific config field (aiImage, photo, etc.) is non-null
 *   2. Inject inferred type into draft.type and published.type
 *   3. Set draftType = draft's inferred type (denormalized query field)
 *   4. Delete top-level `type` field
 *   5. Delete null type-specific config fields (photo, gif, video, aiImage, aiVideo)
 *      from draft and published
 *
 * Type inference: The type is determined by which config field has data,
 * NOT from the top-level `type` field (which could be stale if the user
 * changed the draft type after publishing, or if data was partially saved).
 *
 * Idempotency: Skips documents where draft.type and published.type already
 * match the inferred types.
 *
 * Repair: Re-running after a prior migration will fix any draft.type or
 * published.type that was incorrectly set.
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

/** Map from config key to experience type */
const CONFIG_KEY_TO_TYPE: Record<string, string> = {
  aiImage: 'ai.image',
  aiVideo: 'ai.video',
  photo: 'photo',
  gif: 'gif',
  video: 'video',
}

interface MigrationStats {
  experiencesScanned: number
  experiencesMigrated: number
  experiencesRepaired: number
  experiencesSkipped: number
  skipReasons: Record<string, number>
  errors: Array<{ experienceId: string; workspaceId: string; error: string }>
}

// ── Migration Logic ────────────────────────────────────────────

/**
 * Infer the experience type from a config object by checking which
 * type-specific config field is present and non-null.
 * Returns 'survey' if no type-specific config is found.
 */
function inferTypeFromConfig(config: Record<string, unknown>): string {
  for (const [key, expType] of Object.entries(CONFIG_KEY_TO_TYPE)) {
    if (config[key] != null && typeof config[key] === 'object') {
      return expType
    }
  }
  return 'survey'
}

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
 * Check if an already-migrated document needs repair on draft.type,
 * published.type, or draftType. Returns update object or null.
 */
function repairTypes(data: Record<string, unknown>): {
  updates: Record<string, unknown>
  details: string[]
} | null {
  const updates: Record<string, unknown> = {}
  const details: string[] = []

  // Check draft.type
  const draft = data['draft'] as Record<string, unknown> | null | undefined
  if (draft) {
    const currentDraftType = draft['type'] as string | undefined
    const inferredDraftType = inferTypeFromConfig(draft)

    if (currentDraftType !== inferredDraftType) {
      updates['draft.type'] = inferredDraftType
      updates['draftType'] = inferredDraftType
      details.push(`draft.type: '${currentDraftType ?? '(none)'}' → '${inferredDraftType}'`)
    }

    // Also check draftType consistency
    const currentDraftTypeField = data['draftType'] as string | undefined
    if (currentDraftTypeField !== inferredDraftType && !updates['draftType']) {
      updates['draftType'] = inferredDraftType
      details.push(`draftType: '${currentDraftTypeField ?? '(none)'}' → '${inferredDraftType}'`)
    }
  }

  // Check published.type
  const published = data['published'] as Record<string, unknown> | null | undefined
  if (published) {
    const currentPublishedType = published['type'] as string | undefined
    const inferredPublishedType = inferTypeFromConfig(published)

    if (currentPublishedType !== inferredPublishedType) {
      updates['published.type'] = inferredPublishedType
      details.push(`published.type: '${currentPublishedType ?? '(none)'}' → '${inferredPublishedType}'`)
    }
  }

  return details.length > 0 ? { updates, details } : null
}

/**
 * Process a single experience document.
 * Returns { updates, action } or null if no changes needed.
 */
function processExperience(data: Record<string, unknown>): {
  updates: Record<string, unknown>
  action: 'migrate' | 'repair'
  detail?: string
} | null {
  // Already migrated → check if types need repair
  if (isAlreadyMigrated(data)) {
    const repair = repairTypes(data)
    if (!repair) return null

    return {
      updates: repair.updates,
      action: 'repair',
      detail: repair.details.join(', '),
    }
  }

  // Full migration for unmigrated documents
  const type = data['type'] as string | undefined

  if (!type || !VALID_TYPES.has(type)) {
    return null
  }

  const updates: Record<string, unknown> = {}
  const draft = data['draft'] as Record<string, unknown> | null | undefined
  const published = data['published'] as Record<string, unknown> | null | undefined

  // 1. Infer draft type from config contents (safer than trusting top-level type)
  if (draft) {
    const inferredDraftType = inferTypeFromConfig(draft)
    updates['draft.type'] = inferredDraftType
    updates['draftType'] = inferredDraftType
  } else {
    // No draft — fall back to top-level type
    updates['draftType'] = type
  }

  // 2. If published exists, infer type from config contents
  if (published) {
    updates['published.type'] = inferTypeFromConfig(published)
  }

  // 3. Delete top-level type field
  updates['type'] = FieldValue.delete()

  // 4. Delete null type-specific config fields from draft
  if (draft) {
    for (const key of TYPE_CONFIG_KEYS) {
      if (draft[key] === null) {
        updates[`draft.${key}`] = FieldValue.delete()
      }
    }
  }

  // 5. Delete null type-specific config fields from published
  if (published) {
    for (const key of TYPE_CONFIG_KEYS) {
      if (published[key] === null) {
        updates[`published.${key}`] = FieldValue.delete()
      }
    }
  }

  return { updates, action: 'migrate' }
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
    experiencesRepaired: 0,
    experiencesSkipped: 0,
    skipReasons: {
      'already-correct': 0,
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
        const result = processExperience(data)

        if (!result) {
          const reason = isAlreadyMigrated(data) ? 'already-correct' : 'no-type-field'
          stats.skipReasons[reason]++
          stats.experiencesSkipped++
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - Skipped (${reason})`)
          continue
        }

        const { updates, action, detail } = result

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
        }

        if (action === 'repair') {
          stats.experiencesRepaired++
          const prefix = isDryRun ? '[DRY RUN] Would repair' : 'Repaired'
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - ${prefix} (${detail})`)
        } else {
          stats.experiencesMigrated++
          const prefix = isDryRun ? '[DRY RUN] Would migrate' : 'Migrated'
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - ${prefix} (type: '${type}' → draftType + draft.type)`)
        }
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
    console.log(`  Experiences repaired:   ${stats.experiencesRepaired}`)
    console.log(`  Experiences skipped:    ${stats.experiencesSkipped}`)
    console.log('')
    console.log('  Skip Reasons:')
    console.log(`    already correct:      ${stats.skipReasons['already-correct']}`)
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
    } else if (stats.experiencesMigrated > 0 || stats.experiencesRepaired > 0) {
      console.log('  Migration completed successfully!')
    } else {
      console.log('  No experiences needed migration or repair.')
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
