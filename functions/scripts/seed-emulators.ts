#!/usr/bin/env tsx

/**
 * Seed Firebase Emulators with test data
 *
 * This script populates the Firestore and Storage emulators with test data:
 * - Uploads 12 test images to Storage
 * - Uploads 2 overlay images to Storage
 * - Creates 3 session documents with different inputAssets configurations
 *
 * Usage:
 *   pnpm seed                    # From functions directory
 *   pnpm tsx scripts/seed-emulators.ts  # Direct execution
 *
 * Requirements:
 * - Firebase emulators must be running
 * - Test images must exist in seed-data/images/ (see README.md there)
 * - Overlay images must exist in seed-data/overlays/
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { InputAsset, SessionWithProcessing } from '@clementine/shared';

// Configure emulator endpoints BEFORE initializing admin
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'clementine-7568d',
  storageBucket: 'clementine-7568d.firebasestorage.app',
});

const db = admin.firestore();
// Explicitly set settings for emulator
db.settings({
  host: 'localhost:8080',
  ssl: false,
  ignoreUndefinedProperties: true,
});

const storage = admin.storage().bucket();

// Shared IDs for related entities (actual docs not created yet)
const COMPANY_ID = 'company-test-001';
const PROJECT_ID = 'project-test-001';
const EVENT_ID = 'event-test-001';
const GUEST_ID = 'guest-test-001';
const EXPERIENCE_ID = 'experience-test-001';

// Session IDs
const SESSION_IDS = {
  singleImage: 'session-single-image',
  fourImages: 'session-four-images',
  allImages: 'session-all-images',
};

// Image configuration
const TOTAL_IMAGES = 12;
const IMAGE_DIR = path.join(__dirname, '../seed-data/images');
const OVERLAY_DIR = path.join(__dirname, '../seed-data/overlays');
const OVERLAY_FILES = ['square-overlay.png', 'story-overlay.png'];

/**
 * Check if all required images exist
 */
async function validateImages(): Promise<void> {
  console.log('📋 Validating seed images...');

  const missingImages: string[] = [];

  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const filename = `photo-${String(i).padStart(2, '0')}.jpg`;
    const filepath = path.join(IMAGE_DIR, filename);

    try {
      await fs.access(filepath);
    } catch {
      missingImages.push(filename);
    }
  }

  if (missingImages.length > 0) {
    console.error('❌ Missing required images:');
    missingImages.forEach((img) => console.error(`   - ${img}`));
    console.error(
      `\n💡 Please add images to: ${IMAGE_DIR}`
    );
    console.error('   See seed-data/images/README.md for instructions');
    process.exit(1);
  }

  console.log(`✅ All ${TOTAL_IMAGES} seed images found\n`);
}

/**
 * Upload an image to Storage emulator and return metadata
 */
async function uploadImage(filename: string): Promise<InputAsset> {
  const filepath = path.join(IMAGE_DIR, filename);
  const storagePath = `media/${COMPANY_ID}/inputs/${Date.now()}-${filename}`;

  // Read file
  const fileBuffer = await fs.readFile(filepath);
  const stats = await fs.stat(filepath);

  // Upload to Storage emulator
  await storage.file(storagePath).save(fileBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });

  // Make file public (emulator only)
  await storage.file(storagePath).makePublic();

  // Get public URL
  const publicUrl = `http://localhost:9199/v0/b/${storage.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

  console.log(`   ✓ Uploaded ${filename} → ${storagePath}`);

  return {
    url: publicUrl,
    filename,
    mimeType: 'image/jpeg',
    sizeBytes: stats.size,
    uploadedAt: Date.now(),
  };
}

/**
 * Upload all images and return metadata array
 */
async function uploadAllImages(): Promise<InputAsset[]> {
  console.log('📤 Uploading images to Storage emulator...');

  const imageMetadata: InputAsset[] = [];

  for (let i = 1; i <= TOTAL_IMAGES; i++) {
    const filename = `photo-${String(i).padStart(2, '0')}.jpg`;
    const metadata = await uploadImage(filename);
    imageMetadata.push(metadata);
  }

  console.log(`✅ Uploaded ${TOTAL_IMAGES} images\n`);
  return imageMetadata;
}

/**
 * Upload overlay files to Storage emulator
 */
async function uploadOverlays(): Promise<void> {
  console.log('📤 Uploading overlays to Storage emulator...');

  for (const filename of OVERLAY_FILES) {
    const filepath = path.join(OVERLAY_DIR, filename);
    const storagePath = `media/${COMPANY_ID}/overlays/${filename}`;

    try {
      // Check if file exists
      await fs.access(filepath);

      // Read file
      const fileBuffer = await fs.readFile(filepath);

      // Upload to Storage emulator
      await storage.file(storagePath).save(fileBuffer, {
        metadata: {
          contentType: 'image/png',
        },
      });

      // Make file public (emulator only)
      await storage.file(storagePath).makePublic();

      // Get public URL
      const publicUrl = `http://localhost:9199/v0/b/${storage.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      console.log(`   ✓ Uploaded ${filename} → ${storagePath}`);
      console.log(`     URL: ${publicUrl}`);
    } catch (error) {
      console.warn(`   ⚠ Skipping ${filename} (not found or error)`);
    }
  }

  console.log(`✅ Uploaded ${OVERLAY_FILES.length} overlays\n`);
}

/**
 * Create session documents in Firestore
 */
async function createSessions(imageMetadata: InputAsset[]): Promise<void> {
  console.log('📝 Creating session documents...');

  const now = Date.now();

  const baseSession: SessionWithProcessing = {
    id: '',
    projectId: PROJECT_ID,
    eventId: EVENT_ID,
    companyId: COMPANY_ID,
    guestId: GUEST_ID,
    experienceId: EXPERIENCE_ID,
    createdAt: now,
    updatedAt: now,
  };

  // Session 1: Single image (photo-01)
  const session1: SessionWithProcessing = {
    ...baseSession,
    id: SESSION_IDS.singleImage,
    inputAssets: [imageMetadata[0]],
    
  };
  await db.collection('sessions').doc(SESSION_IDS.singleImage).set(session1);
  console.log(`   ✓ Created session: ${SESSION_IDS.singleImage} (1 image)`);

  // Session 2: Four images (photo-07 through photo-10)
  const session2: SessionWithProcessing = {
    ...baseSession,
    id: SESSION_IDS.fourImages,
    inputAssets: imageMetadata.slice(6, 10), // indices 6-9 = photos 7-10
  };
  await db.collection('sessions').doc(SESSION_IDS.fourImages).set(session2);
  console.log(`   ✓ Created session: ${SESSION_IDS.fourImages} (4 images)`);

  // Session 3: All 12 images
  const session3: SessionWithProcessing = {
    ...baseSession,
    id: SESSION_IDS.allImages,
    inputAssets: imageMetadata,
  };
  await db.collection('sessions').doc(SESSION_IDS.allImages).set(session3);
  console.log(`   ✓ Created session: ${SESSION_IDS.allImages} (12 images)`);

  console.log('✅ Created 3 session documents\n');
}

/**
 * Main seeding function
 */
async function seed(): Promise<void> {
  console.log('🌱 Seeding Firebase Emulators\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Validate images exist
    await validateImages();

    // Upload images
    const imageMetadata = await uploadAllImages();

    // Upload overlays
    await uploadOverlays();

    // Create sessions
    await createSessions(imageMetadata);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Storage: ${TOTAL_IMAGES} images uploaded`);
    console.log(`   - Storage: ${OVERLAY_FILES.length} overlays uploaded`);
    console.log('   - Firestore: 3 sessions created');
    console.log(`\n🔗 View at: http://localhost:4000\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run seeding
seed();
