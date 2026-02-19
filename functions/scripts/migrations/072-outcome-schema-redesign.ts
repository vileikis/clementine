#!/usr/bin/env tsx

/**
 * Migration Script: Outcome Schema Redesign
 *
 * Feature: 072-outcome-schema-redesign
 *
 * This migration transforms experience documents from the old flat outcome schema
 * to the new per-type config architecture.
 *
 * Old schema fields (flat):
 *   type: 'image' | 'gif' | 'video' | null
 *   aiEnabled: boolean
 *   captureStepId: string | null
 *   aspectRatio: ImageAspectRatio
 *   imageGeneration: { prompt, model, refMedia, aspectRatio } | null
 *
 * New schema fields (per-type config):
 *   type: 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video' | null
 *   photo: PhotoOutcomeConfig | null
 *   aiImage: AIImageOutcomeConfig | null
 *   gif: GifOutcomeConfig | null
 *   video: VideoOutcomeConfig | null
 *   aiVideo: AIVideoOutcomeConfig | null
 *
 * Mapping cases:
 *   1. type: 'image' + aiEnabled: false     -> type: 'photo',    photo: { captureStepId, aspectRatio }
 *   2. type: 'image' + aiEnabled: true + captureStepId: null -> type: 'ai.image', aiImage: { task: 'text-to-image', ... }
 *   3. type: 'image' + aiEnabled: true + captureStepId: <id> -> type: 'ai.image', aiImage: { task: 'image-to-image', ... }
 *   4. type: null                           -> type: null, all configs null
 *   5. Already migrated (has photo/aiImage) -> skip
 *
 * Usage:
 *   pnpm tsx scripts/migrations/072-outcome-schema-redesign.ts [--dry-run] [--production]
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
import { getFirestore } from 'firebase-admin/firestore'
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

/** Old outcome shape as stored in Firestore (type widened to string for migration safety) */
interface LegacyOutcome {
  type: string | null
  aiEnabled?: boolean
  captureStepId?: string | null
  aspectRatio?: string
  imageGeneration?: {
    prompt?: string
    model?: string
    refMedia?: Array<Record<string, unknown>>
    aspectRatio?: string | null
  } | null
  // New fields — presence indicates already migrated
  photo?: unknown
  aiImage?: unknown
}

/** Mapping case names for statistics */
type MappingCase = 'photo' | 'ai.image.t2i' | 'ai.image.i2i' | 'null' | 'gif' | 'video' | 'skipped' | 'no-outcome'

interface MigrationStats {
  experiencesScanned: number
  experiencesMigrated: number
  experiencesSkipped: number
  outcomesTransformed: number
  mappingCases: Record<MappingCase, number>
  errors: Array<{ experienceId: string; workspaceId: string; error: string }>
}

// ── Migration Logic ────────────────────────────────────────────

/**
 * Check if an outcome has already been migrated to the new schema.
 * An outcome is considered migrated if it has any per-type config field
 * (photo, aiImage, gif, video, aiVideo) or if the type is already a new value.
 */
function isAlreadyMigrated(outcome: LegacyOutcome): boolean {
  if (outcome.photo !== undefined || outcome.aiImage !== undefined) {
    return true
  }
  // New type values that don't exist in old schema
  if (outcome.type === 'photo' || outcome.type === ('ai.image' as string) || outcome.type === ('ai.video' as string)) {
    return true
  }
  return false
}

/**
 * Transform a single outcome from old schema to new schema.
 * Returns the new outcome object, or null if no transformation needed.
 */
function transformOutcome(outcome: LegacyOutcome): { transformed: Record<string, unknown>; mappingCase: MappingCase } | null {
  // Already migrated — skip
  if (isAlreadyMigrated(outcome)) {
    return null
  }

  const aspectRatio = outcome.aspectRatio ?? '1:1'

  // Case 4: type is null — no output configured
  if (outcome.type === null || outcome.type === undefined) {
    return {
      transformed: {
        type: null,
        photo: null,
        aiImage: null,
        gif: null,
        video: null,
        aiVideo: null,
      },
      mappingCase: 'null',
    }
  }

  // Case 1: type: 'image' + aiEnabled: false → photo
  if (outcome.type === 'image' && !outcome.aiEnabled) {
    return {
      transformed: {
        type: 'photo',
        photo: {
          captureStepId: outcome.captureStepId ?? '',
          aspectRatio,
        },
        aiImage: null,
        gif: null,
        video: null,
        aiVideo: null,
      },
      mappingCase: 'photo',
    }
  }

  // Cases 2 & 3: type: 'image' + aiEnabled: true → ai.image
  if (outcome.type === 'image' && outcome.aiEnabled) {
    const imageGen = outcome.imageGeneration ?? {}
    const task = outcome.captureStepId ? 'image-to-image' : 'text-to-image'
    const mappingCase: MappingCase = outcome.captureStepId ? 'ai.image.i2i' : 'ai.image.t2i'

    return {
      transformed: {
        type: 'ai.image',
        photo: null,
        aiImage: {
          task,
          captureStepId: outcome.captureStepId ?? null,
          aspectRatio,
          imageGeneration: {
            prompt: imageGen.prompt ?? '',
            model: imageGen.model ?? 'gemini-2.5-flash-image',
            refMedia: imageGen.refMedia ?? [],
            aspectRatio: imageGen.aspectRatio ?? null,
          },
        },
        gif: null,
        video: null,
        aiVideo: null,
      },
      mappingCase,
    }
  }

  // Case: type: 'gif' — preserve with per-type config structure
  if (outcome.type === 'gif') {
    return {
      transformed: {
        type: 'gif',
        photo: null,
        aiImage: null,
        gif: {
          captureStepId: outcome.captureStepId ?? '',
          aspectRatio,
        },
        video: null,
        aiVideo: null,
      },
      mappingCase: 'gif',
    }
  }

  // Case: type: 'video' — preserve with per-type config structure
  if (outcome.type === 'video') {
    return {
      transformed: {
        type: 'video',
        photo: null,
        aiImage: null,
        gif: null,
        video: {
          captureStepId: outcome.captureStepId ?? '',
          aspectRatio,
        },
        aiVideo: null,
      },
      mappingCase: 'video',
    }
  }

  // Unknown type — skip with warning
  return null
}

/**
 * Process a single experience document.
 * Transforms both draft.outcome and published.outcome if present.
 */
function processExperience(data: Record<string, unknown>): {
  updates: Record<string, unknown>
  cases: MappingCase[]
} | null {
  const updates: Record<string, unknown> = {}
  const cases: MappingCase[] = []

  // Process draft.outcome
  const draft = data['draft'] as Record<string, unknown> | undefined
  if (draft?.['outcome']) {
    const result = transformOutcome(draft['outcome'] as LegacyOutcome)
    if (result) {
      updates['draft.outcome'] = result.transformed
      cases.push(result.mappingCase)
    } else {
      cases.push('skipped')
    }
  } else if (draft && !draft['outcome']) {
    cases.push('no-outcome')
  }

  // Process published.outcome
  const published = data['published'] as Record<string, unknown> | null | undefined
  if (published?.['outcome']) {
    const result = transformOutcome(published['outcome'] as LegacyOutcome)
    if (result) {
      updates['published.outcome'] = result.transformed
      cases.push(result.mappingCase)
    } else {
      cases.push('skipped')
    }
  }

  // No updates needed
  if (Object.keys(updates).length === 0) {
    return null
  }

  return { updates, cases }
}

/**
 * Run the migration
 */
async function runMigration(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Migration: 072-outcome-schema-redesign')
  console.log('  Transform flat outcome schema to per-type config')
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
    outcomesTransformed: 0,
    mappingCases: {
      'photo': 0,
      'ai.image.t2i': 0,
      'ai.image.i2i': 0,
      'null': 0,
      'gif': 0,
      'video': 0,
      'skipped': 0,
      'no-outcome': 0,
    },
    errors: [],
  }

  try {
    // Use collectionGroup query to get all experiences across workspaces
    console.log('Fetching all experiences via collectionGroup query...')
    const experiencesSnapshot = await db.collectionGroup('experiences').get()
    stats.experiencesScanned = experiencesSnapshot.size
    console.log(`Found ${stats.experiencesScanned} experiences`)
    console.log('')

    for (const doc of experiencesSnapshot.docs) {
      const data = doc.data()
      const experienceId = doc.id
      // Extract workspaceId from document path: workspaces/{workspaceId}/experiences/{experienceId}
      const pathSegments = doc.ref.path.split('/')
      const workspaceId = pathSegments[1] ?? 'unknown'
      const name = (data['name'] as string) ?? '(unnamed)'

      try {
        const result = processExperience(data)

        if (!result) {
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - No changes needed, skipping`)
          stats.experiencesSkipped++
          // Count all cases as skipped
          const draft = data['draft'] as Record<string, unknown> | undefined
          const published = data['published'] as Record<string, unknown> | null | undefined
          if (draft?.['outcome']) stats.mappingCases['skipped']++
          if (published?.['outcome']) stats.mappingCases['skipped']++
          if (draft && !draft['outcome']) stats.mappingCases['no-outcome']++
          continue
        }

        // Count mapping cases
        for (const c of result.cases) {
          stats.mappingCases[c]++
        }

        const transformedCount = result.cases.filter(c => c !== 'skipped' && c !== 'no-outcome').length

        if (!isDryRun) {
          await doc.ref.update(result.updates)
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - Migrated (${result.cases.join(', ')})`)
        } else {
          console.log(`  [${workspaceId}/${experienceId}] "${name}" - [DRY RUN] Would migrate:`)
          for (const [field, value] of Object.entries(result.updates)) {
            const outcome = value as Record<string, unknown>
            console.log(`      ${field}: type '${outcome['type'] as string}'`)
          }
        }

        stats.experiencesMigrated++
        stats.outcomesTransformed += transformedCount
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
    console.log(`  Outcomes transformed:   ${stats.outcomesTransformed}`)
    console.log('')
    console.log('  Mapping Cases:')
    console.log(`    photo (image+!ai):    ${stats.mappingCases['photo']}`)
    console.log(`    ai.image t2i:         ${stats.mappingCases['ai.image.t2i']}`)
    console.log(`    ai.image i2i:         ${stats.mappingCases['ai.image.i2i']}`)
    console.log(`    null (no type):       ${stats.mappingCases['null']}`)
    console.log(`    gif:                  ${stats.mappingCases['gif']}`)
    console.log(`    video:                ${stats.mappingCases['video']}`)
    console.log(`    already migrated:     ${stats.mappingCases['skipped']}`)
    console.log(`    no outcome field:     ${stats.mappingCases['no-outcome']}`)
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
