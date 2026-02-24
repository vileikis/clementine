#!/usr/bin/env tsx

/**
 * Migration Script: Experience Type Flattening
 *
 * Feature: 081-experience-type-flattening
 *
 * This migration transforms experience documents from the old profile + nested
 * outcome structure to the new flat type + config structure.
 *
 * Old schema:
 *   experience.profile: 'freeform' | 'survey' | 'story'
 *   experience.draft.outcome: { type, photo, gif, video, aiImage, aiVideo }
 *   experience.published.outcome: { ... } | null
 *
 * New schema:
 *   experience.type: 'survey' | 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video'
 *   experience.draft.photo / .aiImage / .aiVideo / .gif / .video (flattened)
 *   experience.published.photo / ... (flattened)
 *
 * Type derivation rules:
 *   profile: 'freeform' + outcome.type: 'photo'    → type: 'photo'
 *   profile: 'freeform' + outcome.type: 'ai.image'  → type: 'ai.image'
 *   profile: 'freeform' + outcome.type: 'ai.video'  → type: 'ai.video'
 *   profile: 'freeform' + outcome.type: 'gif'       → type: 'gif'
 *   profile: 'freeform' + outcome.type: 'video'     → type: 'video'
 *   profile: 'freeform' + outcome.type: null         → type: 'ai.image' (safe default)
 *   profile: 'survey'                               → type: 'survey'
 *   profile: 'story'                                → type: 'survey'
 *
 * Usage:
 *   pnpm tsx scripts/migrations/081-experience-type-flattening.ts [--dry-run] [--production]
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

/** Valid new experience types */
const VALID_TYPES = new Set(['survey', 'photo', 'gif', 'video', 'ai.image', 'ai.video'])

/** Old outcome shape nested inside draft/published */
interface LegacyOutcome {
  type?: string | null
  photo?: Record<string, unknown> | null
  gif?: Record<string, unknown> | null
  video?: Record<string, unknown> | null
  aiImage?: Record<string, unknown> | null
  aiVideo?: Record<string, unknown> | null
}

type MappingCase =
  | 'freeform→photo'
  | 'freeform→ai.image'
  | 'freeform→ai.video'
  | 'freeform→gif'
  | 'freeform→video'
  | 'freeform→ai.image(default)'
  | 'survey→survey'
  | 'story→survey'
  | 'already-migrated'
  | 'no-profile'

interface MigrationStats {
  experiencesScanned: number
  experiencesMigrated: number
  experiencesSkipped: number
  mappingCases: Record<MappingCase, number>
  errors: Array<{ experienceId: string; workspaceId: string; error: string }>
}

// ── Migration Logic ────────────────────────────────────────────

/**
 * Check if a document has already been migrated.
 * A doc is migrated if it has a top-level `type` field with a valid value
 * and no `profile` field.
 */
function isAlreadyMigrated(data: Record<string, unknown>): boolean {
  const type = data['type'] as string | undefined
  const profile = data['profile'] as string | undefined

  // Has new `type` field with valid value AND no old `profile` field
  if (type && VALID_TYPES.has(type) && profile === undefined) {
    return true
  }

  return false
}

/**
 * Derive the new experience type from old profile + outcome.type.
 */
function deriveType(profile: string, outcomeType: string | null | undefined): { type: string; mappingCase: MappingCase } {
  if (profile === 'survey') {
    return { type: 'survey', mappingCase: 'survey→survey' }
  }

  if (profile === 'story') {
    return { type: 'survey', mappingCase: 'story→survey' }
  }

  // profile === 'freeform' (or anything else — treat as freeform)
  if (outcomeType && VALID_TYPES.has(outcomeType) && outcomeType !== 'survey') {
    return { type: outcomeType, mappingCase: `freeform→${outcomeType}` as MappingCase }
  }

  // No outcome type configured — safe default
  return { type: 'ai.image', mappingCase: 'freeform→ai.image(default)' }
}

/**
 * Flatten a config object by extracting per-type fields from the outcome wrapper.
 * Returns the update fields to set using dot notation.
 */
function flattenConfig(
  configPath: 'draft' | 'published',
  config: Record<string, unknown>,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {}
  const outcome = config['outcome'] as LegacyOutcome | null | undefined

  if (outcome) {
    // Move per-type configs up one level
    updates[`${configPath}.photo`] = outcome.photo ?? null
    updates[`${configPath}.gif`] = outcome.gif ?? null
    updates[`${configPath}.video`] = outcome.video ?? null
    updates[`${configPath}.aiImage`] = outcome.aiImage ?? null
    updates[`${configPath}.aiVideo`] = outcome.aiVideo ?? null

    // Remove the outcome wrapper
    updates[`${configPath}.outcome`] = FieldValue.delete()
  } else {
    // No outcome object — set all per-type configs to null
    updates[`${configPath}.photo`] = null
    updates[`${configPath}.gif`] = null
    updates[`${configPath}.video`] = null
    updates[`${configPath}.aiImage`] = null
    updates[`${configPath}.aiVideo`] = null
  }

  return updates
}

/**
 * Process a single experience document.
 * Returns the Firestore update object or null if no migration needed.
 */
function processExperience(data: Record<string, unknown>): {
  updates: Record<string, unknown>
  mappingCase: MappingCase
} | null {
  // Already migrated — skip
  if (isAlreadyMigrated(data)) {
    return null
  }

  const profile = data['profile'] as string | undefined

  if (!profile) {
    return null
  }

  // Derive the new type
  const draft = data['draft'] as Record<string, unknown> | undefined
  const draftOutcome = draft?.['outcome'] as LegacyOutcome | null | undefined
  const outcomeType = draftOutcome?.type ?? null

  const { type, mappingCase } = deriveType(profile, outcomeType)

  // Build update object
  const updates: Record<string, unknown> = {}

  // Set new type field
  updates['type'] = type

  // Remove old profile field
  updates['profile'] = FieldValue.delete()

  // Flatten draft config
  if (draft) {
    Object.assign(updates, flattenConfig('draft', draft))
  }

  // Flatten published config
  const published = data['published'] as Record<string, unknown> | null | undefined
  if (published) {
    Object.assign(updates, flattenConfig('published', published))
  }

  return { updates, mappingCase }
}

// ── Main ───────────────────────────────────────────────────────

async function runMigration(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Migration: 081-experience-type-flattening')
  console.log('  Flatten profile+outcome into type + per-type config')
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
    mappingCases: {
      'freeform→photo': 0,
      'freeform→ai.image': 0,
      'freeform→ai.video': 0,
      'freeform→gif': 0,
      'freeform→video': 0,
      'freeform→ai.image(default)': 0,
      'survey→survey': 0,
      'story→survey': 0,
      'already-migrated': 0,
      'no-profile': 0,
    },
    errors: [],
  }

  try {
    console.log('Fetching all experiences via collectionGroup query...')
    const experiencesSnapshot = await db.collectionGroup('experiences').get()
    stats.experiencesScanned = experiencesSnapshot.size
    console.log(`Found ${stats.experiencesScanned} experiences`)
    console.log('')

    for (const doc of experiencesSnapshot.docs) {
      const data = doc.data()
      const experienceId = doc.id
      // Extract workspaceId from path: workspaces/{workspaceId}/experiences/{experienceId}
      const pathSegments = doc.ref.path.split('/')
      const workspaceId = pathSegments[1] ?? 'unknown'
      const name = (data['name'] as string) ?? '(unnamed)'

      try {
        const result = processExperience(data)

        if (!result) {
          const reason = isAlreadyMigrated(data) ? 'already-migrated' : 'no-profile'
          stats.mappingCases[reason as MappingCase]++
          stats.experiencesSkipped++
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - Skipped (${reason})`)
          continue
        }

        stats.mappingCases[result.mappingCase]++

        if (!isDryRun) {
          await doc.ref.update(result.updates)
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - Migrated (${result.mappingCase}) → type: '${result.updates['type'] as string}'`)
        } else {
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - [DRY RUN] Would migrate (${result.mappingCase}) → type: '${result.updates['type'] as string}'`)
        }

        stats.experiencesMigrated++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`  [${workspaceId}/${experienceId}] "${name}" - ERROR: ${errorMessage}`)
        stats.errors.push({ experienceId, workspaceId, error: errorMessage })
      }
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
    console.log('  Mapping Cases:')
    console.log(`    freeform→photo:       ${stats.mappingCases['freeform→photo']}`)
    console.log(`    freeform→ai.image:    ${stats.mappingCases['freeform→ai.image']}`)
    console.log(`    freeform→ai.video:    ${stats.mappingCases['freeform→ai.video']}`)
    console.log(`    freeform→gif:         ${stats.mappingCases['freeform→gif']}`)
    console.log(`    freeform→video:       ${stats.mappingCases['freeform→video']}`)
    console.log(`    freeform→default:     ${stats.mappingCases['freeform→ai.image(default)']}`)
    console.log(`    survey→survey:        ${stats.mappingCases['survey→survey']}`)
    console.log(`    story→survey:         ${stats.mappingCases['story→survey']}`)
    console.log(`    already migrated:     ${stats.mappingCases['already-migrated']}`)
    console.log(`    no profile field:     ${stats.mappingCases['no-profile']}`)
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
