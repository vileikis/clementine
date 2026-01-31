#!/usr/bin/env tsx

/**
 * Seed Firebase Emulators with test data
 *
 * This script populates the Firestore and Storage emulators with test data
 * for testing the transform pipeline.
 *
 * Creates:
 * - 1 Workspace
 * - 1 Project
 * - 3 Experiences (with transform, without transform, draft only)
 * - 5 Sessions for different test scenarios
 * - Uploads test images and overlays to Storage
 *
 * Usage:
 *   pnpm seed                    # From functions directory
 *   pnpm tsx scripts/seed-emulators.ts  # Direct execution
 *
 * Requirements:
 * - Firebase emulators must be running
 * - Test images in seed-data/images/ (optional, for future AI testing)
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import type {
  Workspace,
  Project,
  Experience,
  Session,
  TransformConfig,
  ExperienceConfig,
  CapturedMedia,
  Answer,
} from '@clementine/shared'

// Configure emulator endpoints BEFORE initializing admin
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199'
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'

// Initialize Firebase Admin SDK with modular API
initializeApp({
  projectId: 'clementine-7568d',
  storageBucket: 'clementine-7568d.firebasestorage.app',
})

const db = getFirestore()
// Explicitly set settings for emulator
db.settings({
  host: 'localhost:8080',
  ssl: false,
  ignoreUndefinedProperties: true,
})

const storage = getStorage().bucket()

// ============================================================================
// ENTITY IDS
// ============================================================================

const IDS = {
  workspace: 'workspace-test-001',
  project: 'project-test-001',

  // Experiences
  experienceWithTransform: 'experience-with-transform',
  experienceNoTransform: 'experience-no-transform',
  experienceDraftOnly: 'experience-draft-only',

  // Sessions
  sessionReady: 'session-ready',
  sessionPublished: 'session-published',
  sessionWithJob: 'session-with-job',
  sessionNoTransform: 'session-no-transform',
  sessionDraftOnly: 'session-draft-only',
} as const

// ============================================================================
// SEED DATA DIRECTORIES
// ============================================================================

const IMAGE_DIR = path.join(__dirname, '../seed-data/images')
const OVERLAY_DIR = path.join(__dirname, '../seed-data/overlays')
const AI_REFERENCE_DIR = path.join(__dirname, '../seed-data/ai-reference')
const OVERLAY_FILES = ['square-overlay.png', 'story-overlay.png']
const TOTAL_IMAGES = 12

// ============================================================================
// TRANSFORM CONFIG TEMPLATES
// ============================================================================

/**
 * Sample transform config for testing
 */
function createTransformConfig(): TransformConfig {
  return {
    nodes: [
      {
        id: 'node-1',
        type: 'ai.imageGeneration',
        config: {
          prompt: 'Transform this image into a cartoon style',
          model: 'gemini-2.5-flash-image',
          aspectRatio: '1:1',
          refMedia: [],
        },
      },
    ],
    outputFormat: {
      aspectRatio: '1:1',
      quality: 85,
    },
  }
}

/**
 * Sample experience config with transform
 */
function createExperienceConfigWithTransform(): ExperienceConfig {
  return {
    steps: [
      {
        id: crypto.randomUUID(),
        type: 'capture.photo',
        name: 'Take a photo',
        config: {
          aspectRatio: '1:1',
        },
      },
    ],
    transform: createTransformConfig(),
  }
}

/**
 * Experience config without transform
 */
function createExperienceConfigWithoutTransform(): ExperienceConfig {
  return {
    steps: [
      {
        id: crypto.randomUUID(),
        type: 'info',
        name: 'Welcome',
        config: {
          title: 'Welcome',
          description: 'This is a test experience without transform.',
          media: null,
        },
      },
    ],
    transform: null,
  }
}

// ============================================================================
// WORKSPACE
// ============================================================================

async function createWorkspace(): Promise<void> {
  console.log('📦 Creating workspace...')

  const now = Date.now()
  const workspace: Workspace = {
    id: IDS.workspace,
    name: 'Test Workspace',
    slug: 'test-workspace',
    status: 'active',
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await db.collection('workspaces').doc(IDS.workspace).set(workspace)
  console.log(`   ✓ Created workspace: ${IDS.workspace}`)
}

// ============================================================================
// PROJECT
// ============================================================================

async function createProject(): Promise<void> {
  console.log('📁 Creating project...')

  const now = Date.now()
  const project: Project = {
    id: IDS.project,
    name: 'Test Project',
    workspaceId: IDS.workspace,
    status: 'live',
    type: 'standard',
    activeEventId: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await db.collection('projects').doc(IDS.project).set(project)
  console.log(`   ✓ Created project: ${IDS.project}`)
}

// ============================================================================
// EXPERIENCES
// ============================================================================

async function createExperiences(): Promise<void> {
  console.log('🎨 Creating experiences...')

  const now = Date.now()
  const experiencesRef = db
    .collection('workspaces')
    .doc(IDS.workspace)
    .collection('experiences')

  // Experience 1: With transform config (draft + published)
  const exp1: Experience = {
    id: IDS.experienceWithTransform,
    name: 'Experience with Transform',
    status: 'active',
    profile: 'freeform',
    media: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    draft: createExperienceConfigWithTransform(),
    published: createExperienceConfigWithTransform(),
    draftVersion: 2,
    publishedVersion: 1,
    publishedAt: now,
    publishedBy: 'admin-user-001',
  }
  await experiencesRef.doc(IDS.experienceWithTransform).set(exp1)
  console.log(`   ✓ Created experience: ${IDS.experienceWithTransform} (with transform)`)

  // Experience 2: Without transform config
  const exp2: Experience = {
    id: IDS.experienceNoTransform,
    name: 'Experience without Transform',
    status: 'active',
    profile: 'survey',
    media: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    draft: createExperienceConfigWithoutTransform(),
    published: createExperienceConfigWithoutTransform(),
    draftVersion: 1,
    publishedVersion: 1,
    publishedAt: now,
    publishedBy: 'admin-user-001',
  }
  await experiencesRef.doc(IDS.experienceNoTransform).set(exp2)
  console.log(`   ✓ Created experience: ${IDS.experienceNoTransform} (no transform)`)

  // Experience 3: Draft only (no published config)
  const exp3: Experience = {
    id: IDS.experienceDraftOnly,
    name: 'Experience Draft Only',
    status: 'active',
    profile: 'freeform',
    media: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    draft: createExperienceConfigWithTransform(),
    published: null,
    draftVersion: 1,
    publishedVersion: null,
    publishedAt: null,
    publishedBy: null,
  }
  await experiencesRef.doc(IDS.experienceDraftOnly).set(exp3)
  console.log(`   ✓ Created experience: ${IDS.experienceDraftOnly} (draft only)`)
}

// ============================================================================
// SESSIONS
// ============================================================================

/**
 * Sample captured media for sessions
 */
function createSampleCapturedMedia(): CapturedMedia[] {
  const now = Date.now()
  return [
    {
      stepId: 'capture-step-1',
      assetId: 'asset-001',
      url: 'http://localhost:9199/v0/b/clementine-7568d.firebasestorage.app/o/test%2Fphoto-01.jpg?alt=media',
      createdAt: now,
    },
  ]
}

/**
 * Sample answers for sessions
 */
function createSampleAnswers(): Answer[] {
  const now = Date.now()
  return [
    {
      stepId: 'input-step-1',
      stepType: 'input.scale',
      value: 5,
      answeredAt: now,
    },
  ]
}

async function createSessions(): Promise<void> {
  console.log('📝 Creating sessions...')

  const now = Date.now()
  const sessionsRef = db
    .collection('projects')
    .doc(IDS.project)
    .collection('sessions')

  // Session 1: Ready to process (draft config)
  const session1: Session = {
    id: IDS.sessionReady,
    projectId: IDS.project,
    workspaceId: IDS.workspace,
    eventId: null,
    experienceId: IDS.experienceWithTransform,
    mode: 'preview',
    configSource: 'draft',
    status: 'active',
    answers: createSampleAnswers(),
    capturedMedia: createSampleCapturedMedia(),
    resultMedia: null,
    jobId: null,
    jobStatus: null,
    createdBy: 'admin-user-001',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
  await sessionsRef.doc(IDS.sessionReady).set(session1)
  console.log(`   ✓ Created session: ${IDS.sessionReady} (ready, draft config)`)

  // Session 2: Uses published config
  const session2: Session = {
    id: IDS.sessionPublished,
    projectId: IDS.project,
    workspaceId: IDS.workspace,
    eventId: null,
    experienceId: IDS.experienceWithTransform,
    mode: 'guest',
    configSource: 'published',
    status: 'active',
    answers: [],
    capturedMedia: createSampleCapturedMedia(),
    resultMedia: null,
    jobId: null,
    jobStatus: null,
    createdBy: 'guest-user-001',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
  await sessionsRef.doc(IDS.sessionPublished).set(session2)
  console.log(`   ✓ Created session: ${IDS.sessionPublished} (published config)`)

  // Session 3: Has active job (for testing conflict)
  const session3: Session = {
    id: IDS.sessionWithJob,
    projectId: IDS.project,
    workspaceId: IDS.workspace,
    eventId: null,
    experienceId: IDS.experienceWithTransform,
    mode: 'preview',
    configSource: 'draft',
    status: 'active',
    answers: [],
    capturedMedia: createSampleCapturedMedia(),
    resultMedia: null,
    jobId: 'existing-job-001',
    jobStatus: 'running',
    createdBy: 'admin-user-001',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
  await sessionsRef.doc(IDS.sessionWithJob).set(session3)
  console.log(`   ✓ Created session: ${IDS.sessionWithJob} (has active job)`)

  // Session 4: References experience without transform
  const session4: Session = {
    id: IDS.sessionNoTransform,
    projectId: IDS.project,
    workspaceId: IDS.workspace,
    eventId: null,
    experienceId: IDS.experienceNoTransform,
    mode: 'preview',
    configSource: 'draft',
    status: 'active',
    answers: [],
    capturedMedia: [],
    resultMedia: null,
    jobId: null,
    jobStatus: null,
    createdBy: 'admin-user-001',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
  await sessionsRef.doc(IDS.sessionNoTransform).set(session4)
  console.log(`   ✓ Created session: ${IDS.sessionNoTransform} (no transform)`)

  // Session 5: Uses published config but experience has no published
  const session5: Session = {
    id: IDS.sessionDraftOnly,
    projectId: IDS.project,
    workspaceId: IDS.workspace,
    eventId: null,
    experienceId: IDS.experienceDraftOnly,
    mode: 'guest',
    configSource: 'published',
    status: 'active',
    answers: [],
    capturedMedia: createSampleCapturedMedia(),
    resultMedia: null,
    jobId: null,
    jobStatus: null,
    createdBy: 'guest-user-001',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
  await sessionsRef.doc(IDS.sessionDraftOnly).set(session5)
  console.log(`   ✓ Created session: ${IDS.sessionDraftOnly} (draft-only experience)`)
}

// ============================================================================
// STORAGE UPLOADS (for future AI testing)
// ============================================================================

interface UploadedAsset {
  filename: string
  url: string
  sizeBytes: number
}

/**
 * Upload an image to Storage emulator
 */
async function uploadImage(filename: string, subdir: string = 'inputs'): Promise<UploadedAsset | null> {
  const filepath = path.join(IMAGE_DIR, filename)
  const storagePath = `media/${IDS.workspace}/${subdir}/${Date.now()}-${filename}`

  try {
    const fileBuffer = await fs.readFile(filepath)
    const stats = await fs.stat(filepath)

    await storage.file(storagePath).save(fileBuffer, {
      metadata: { contentType: 'image/jpeg' },
    })
    await storage.file(storagePath).makePublic()

    const publicUrl = `http://localhost:9199/v0/b/${storage.name}/o/${encodeURIComponent(storagePath)}?alt=media`
    console.log(`   ✓ Uploaded ${filename}`)

    return {
      filename,
      url: publicUrl,
      sizeBytes: stats.size,
    }
  } catch {
    return null
  }
}

/**
 * Upload test images if available
 */
async function uploadTestImages(): Promise<void> {
  console.log('📤 Uploading test images (if available)...')

  let uploadedCount = 0

  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const filename = `photo-${String(i).padStart(2, '0')}.jpg`
    const result = await uploadImage(filename)
    if (result) uploadedCount++
  }

  if (uploadedCount > 0) {
    console.log(`   ✅ Uploaded ${uploadedCount} test images`)
  } else {
    console.log('   ⚠ No test images found (add to seed-data/images/ for AI testing)')
  }
}

/**
 * Upload overlay files if available
 */
async function uploadOverlays(): Promise<void> {
  console.log('📤 Uploading overlays (if available)...')

  let uploadedCount = 0

  for (const filename of OVERLAY_FILES) {
    const filepath = path.join(OVERLAY_DIR, filename)
    const storagePath = `media/${IDS.workspace}/overlays/${filename}`

    try {
      await fs.access(filepath)
      const fileBuffer = await fs.readFile(filepath)

      await storage.file(storagePath).save(fileBuffer, {
        metadata: { contentType: 'image/png' },
      })
      await storage.file(storagePath).makePublic()

      console.log(`   ✓ Uploaded ${filename}`)
      uploadedCount++
    } catch {
      // File doesn't exist, skip
    }
  }

  if (uploadedCount > 0) {
    console.log(`   ✅ Uploaded ${uploadedCount} overlays`)
  } else {
    console.log('   ⚠ No overlays found (add to seed-data/overlays/ if needed)')
  }
}

/**
 * Upload AI reference images if available
 */
async function uploadAiReferences(): Promise<void> {
  console.log('📤 Uploading AI reference images (if available)...')

  try {
    const files = await fs.readdir(AI_REFERENCE_DIR)
    const imageFiles = files.filter(
      (file) =>
        file.endsWith('.jpg') ||
        file.endsWith('.jpeg') ||
        file.endsWith('.png') ||
        file.endsWith('.webp')
    )

    if (imageFiles.length === 0) {
      console.log('   ⚠ No AI reference images found')
      return
    }

    for (const filename of imageFiles) {
      const filepath = path.join(AI_REFERENCE_DIR, filename)
      const storagePath = `media/${IDS.workspace}/ai-reference/${filename}`

      const fileBuffer = await fs.readFile(filepath)

      let contentType = 'image/jpeg'
      if (filename.endsWith('.png')) contentType = 'image/png'
      else if (filename.endsWith('.webp')) contentType = 'image/webp'

      await storage.file(storagePath).save(fileBuffer, {
        metadata: { contentType },
      })
      await storage.file(storagePath).makePublic()

      console.log(`   ✓ Uploaded ${filename}`)
    }

    console.log(`   ✅ Uploaded ${imageFiles.length} AI reference images`)
  } catch {
    console.log('   ⚠ AI reference directory not found')
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function seed(): Promise<void> {
  console.log('🌱 Seeding Firebase Emulators for Transform Pipeline Testing\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Create Firestore documents
    await createWorkspace()
    await createProject()
    await createExperiences()
    await createSessions()

    console.log('')

    // Upload media files (optional)
    await uploadTestImages()
    await uploadOverlays()
    await uploadAiReferences()

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✨ Seeding complete!\n')
    console.log('📊 Summary:')
    console.log('   Firestore:')
    console.log(`     - 1 Workspace: ${IDS.workspace}`)
    console.log(`     - 1 Project: ${IDS.project}`)
    console.log('     - 3 Experiences (with transform, no transform, draft only)')
    console.log('     - 5 Sessions (ready, published, with-job, no-transform, draft-only)')
    console.log('   Storage:')
    console.log('     - Test images uploaded (if available)')
    console.log('     - Overlays uploaded (if available)')
    console.log('     - AI references uploaded (if available)')
    console.log('')
    console.log('📖 Test cases: functions/docs/transform-pipeline-qa.md')
    console.log(`\n🔗 Emulator UI: http://localhost:4000\n`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seeding failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run seeding
seed()
