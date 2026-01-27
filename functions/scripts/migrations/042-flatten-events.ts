#!/usr/bin/env tsx

/**
 * Migration Script: Flatten Events into Projects
 *
 * Feature: 042-flatten-structure-refactor
 *
 * This migration flattens the project/event structure by:
 * 1. Reading all projects with activeEventId
 * 2. Fetching the active event's config
 * 3. Copying event config to project document
 * 4. Removing activeEventId from project
 * 5. Marking the event as migrated
 *
 * Usage:
 *   pnpm tsx scripts/migrations/042-flatten-events.ts [--dry-run] [--production]
 *
 * Flags:
 *   --dry-run     Preview changes without writing to Firestore
 *   --production  Run against production (default is emulators)
 *
 * Requirements:
 * - For emulator: Firebase emulators must be running
 * - For production: GOOGLE_APPLICATION_CREDENTIALS env var must be set
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
  // Production requires service account credentials
  // Check for env var or use default path
  let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  // If no env var, try default location
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

  // Read and parse the service account JSON
  const serviceAccountJson = fs.readFileSync(credentialsPath, 'utf-8')
  const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount

  initializeApp({
    credential: cert(serviceAccount),
  })
} else {
  // Emulator mode
  initializeApp({
    projectId: 'demo-clementine',
  })
}

const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

/**
 * Statistics for migration progress tracking
 */
interface MigrationStats {
  projectsScanned: number
  projectsWithActiveEvent: number
  projectsMigrated: number
  projectsSkipped: number
  eventsMigrated: number
  errors: Array<{ projectId: string; error: string }>
}

/**
 * Project document shape before migration
 */
interface LegacyProject {
  id: string
  name: string
  workspaceId: string
  status: string
  type: string
  activeEventId: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

/**
 * Event document shape
 */
interface ProjectEvent {
  id: string
  name: string
  status: string
  draftConfig: Record<string, unknown> | null
  publishedConfig: Record<string, unknown> | null
  draftVersion: number
  publishedVersion: number | null
  publishedAt: number | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

/**
 * Run the migration
 */
async function runMigration(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Migration: 042-flatten-events')
  console.log('  Flatten project/event structure')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Target: ${isProduction ? 'PRODUCTION' : 'EMULATORS'}`)
  console.log('')

  if (isProduction && !isDryRun) {
    console.log('⚠️  WARNING: Running in PRODUCTION mode!')
    console.log('    Press Ctrl+C within 5 seconds to abort...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    console.log('')
  }

  const stats: MigrationStats = {
    projectsScanned: 0,
    projectsWithActiveEvent: 0,
    projectsMigrated: 0,
    projectsSkipped: 0,
    eventsMigrated: 0,
    errors: [],
  }

  try {
    // Fetch all projects
    console.log('Fetching all projects...')
    const projectsSnapshot = await db.collection('projects').get()
    stats.projectsScanned = projectsSnapshot.size
    console.log(`Found ${stats.projectsScanned} projects`)
    console.log('')

    // Process each project
    for (const projectDoc of projectsSnapshot.docs) {
      const project = { id: projectDoc.id, ...projectDoc.data() } as LegacyProject

      // Skip projects without activeEventId
      if (!project.activeEventId) {
        console.log(`⏭️  [${project.id}] "${project.name}" - No activeEventId, skipping`)
        stats.projectsSkipped++
        continue
      }

      // Skip projects that already have draftConfig (already migrated)
      const projectData = projectDoc.data()
      if (projectData.draftConfig !== undefined) {
        console.log(`⏭️  [${project.id}] "${project.name}" - Already has draftConfig, skipping`)
        stats.projectsSkipped++
        continue
      }

      stats.projectsWithActiveEvent++
      console.log(`📦 [${project.id}] "${project.name}" - Has activeEventId: ${project.activeEventId}`)

      try {
        // Fetch the active event
        const eventDoc = await db
          .collection('projects')
          .doc(project.id)
          .collection('events')
          .doc(project.activeEventId)
          .get()

        if (!eventDoc.exists) {
          console.log(`   ⚠️  Event ${project.activeEventId} not found!`)
          stats.errors.push({
            projectId: project.id,
            error: `Event ${project.activeEventId} not found`,
          })
          continue
        }

        const event = { id: eventDoc.id, ...eventDoc.data() } as ProjectEvent
        console.log(`   📄 Event "${event.name}" found`)
        console.log(`      - draftVersion: ${event.draftVersion}`)
        console.log(`      - publishedVersion: ${event.publishedVersion ?? 'none'}`)
        console.log(`      - has draftConfig: ${event.draftConfig !== null}`)
        console.log(`      - has publishedConfig: ${event.publishedConfig !== null}`)

        if (!isDryRun) {
          // Update project with event config
          const projectUpdate = {
            draftConfig: event.draftConfig,
            publishedConfig: event.publishedConfig,
            draftVersion: event.draftVersion,
            publishedVersion: event.publishedVersion,
            publishedAt: event.publishedAt,
            activeEventId: FieldValue.delete(),
            updatedAt: Date.now(),
          }

          await db.collection('projects').doc(project.id).update(projectUpdate)
          console.log(`   ✅ Project updated with config`)

          // Mark event as migrated (add a flag, keep for audit trail)
          await db
            .collection('projects')
            .doc(project.id)
            .collection('events')
            .doc(project.activeEventId)
            .update({
              _migratedToProject: true,
              _migratedAt: Date.now(),
              updatedAt: Date.now(),
            })
          console.log(`   ✅ Event marked as migrated`)
        } else {
          console.log(`   🔍 [DRY RUN] Would update project with:`)
          console.log(`      - draftConfig: ${event.draftConfig ? 'copied' : 'null'}`)
          console.log(`      - publishedConfig: ${event.publishedConfig ? 'copied' : 'null'}`)
          console.log(`      - draftVersion: ${event.draftVersion}`)
          console.log(`      - publishedVersion: ${event.publishedVersion ?? 'null'}`)
          console.log(`      - activeEventId: DELETED`)
        }

        stats.projectsMigrated++
        stats.eventsMigrated++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`   ❌ Error: ${errorMessage}`)
        stats.errors.push({ projectId: project.id, error: errorMessage })
      }

      console.log('')
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  Migration Summary')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  Projects scanned:           ${stats.projectsScanned}`)
    console.log(`  Projects with activeEventId: ${stats.projectsWithActiveEvent}`)
    console.log(`  Projects migrated:          ${stats.projectsMigrated}`)
    console.log(`  Projects skipped:           ${stats.projectsSkipped}`)
    console.log(`  Events migrated:            ${stats.eventsMigrated}`)
    console.log(`  Errors:                     ${stats.errors.length}`)
    console.log('')

    if (stats.errors.length > 0) {
      console.log('  Errors:')
      for (const err of stats.errors) {
        console.log(`    - [${err.projectId}] ${err.error}`)
      }
      console.log('')
    }

    if (isDryRun) {
      console.log('  ℹ️  This was a DRY RUN. No changes were made.')
      console.log('     Run without --dry-run to apply changes.')
    } else if (stats.projectsMigrated > 0) {
      console.log('  ✅ Migration completed successfully!')
    } else {
      console.log('  ℹ️  No projects needed migration.')
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
