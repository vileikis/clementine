#!/usr/bin/env npx ts-node
/**
 * Migration Script: /experiences → /aiPresets
 *
 * This script copies all documents from the /experiences collection
 * to the /aiPresets collection, preserving document IDs.
 *
 * Usage:
 *   # From project root, with environment variables loaded:
 *   cd web && npx ts-node ../scripts/migrate-experiences-to-ai-presets.ts
 *
 *   # Or source your .env.local first:
 *   export $(cat web/.env.local | xargs) && npx ts-node scripts/migrate-experiences-to-ai-presets.ts
 *
 * Prerequisites:
 *   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars set
 *   - firebase-admin installed (available from web workspace)
 */

import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

async function migrateExperiencesToAiPresets(): Promise<void> {
  console.log("Starting migration from /experiences to /aiPresets...\n");

  // Step 1: Get all documents from /experiences
  const experiencesRef = db.collection("experiences");
  const aiPresetsRef = db.collection("aiPresets");

  const snapshot = await experiencesRef.get();
  const totalDocs = snapshot.size;

  if (totalDocs === 0) {
    console.log("No documents found in /experiences collection. Nothing to migrate.");
    return;
  }

  console.log(`Found ${totalDocs} documents in /experiences collection.`);

  // Step 2: Batch copy to /aiPresets (Firestore batch limit is 500)
  const BATCH_SIZE = 500;
  const docs = snapshot.docs;
  let migratedCount = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      // Preserve document ID
      const targetRef = aiPresetsRef.doc(doc.id);
      batch.set(targetRef, doc.data());
    }

    await batch.commit();
    migratedCount += chunk.length;
    console.log(`Migrated ${migratedCount}/${totalDocs} documents...`);
  }

  // Step 3: Verify migration
  console.log("\nVerifying migration...");
  const aiPresetsSnapshot = await aiPresetsRef.get();
  const aiPresetsCount = aiPresetsSnapshot.size;

  if (aiPresetsCount === totalDocs) {
    console.log(`\n✓ Verification passed: ${aiPresetsCount} documents in /aiPresets`);
    console.log("Migration complete!\n");
    console.log("Note: The /experiences collection has been preserved as backup.");
    console.log("You can delete it later after confirming stability.");
  } else {
    console.error(
      `\n✗ Verification failed: Expected ${totalDocs} documents but found ${aiPresetsCount}`
    );
    process.exit(1);
  }
}

// Run migration
migrateExperiencesToAiPresets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
