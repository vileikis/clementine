#!/usr/bin/env node
/**
 * Migration Script: /experiences → /aiPresets
 *
 * This script copies all documents from the /experiences collection
 * to the /aiPresets collection, preserving document IDs.
 *
 * Usage:
 *   cd scripts && pnpm migrate:ai-presets <service-account.json>
 *
 *   Or directly:
 *   cd scripts && node --import=tsx migrate-experiences-to-ai-presets.ts <service-account.json>
 *
 * Prerequisites:
 *   - Firebase service account JSON file (download from Firebase Console > Project Settings > Service Accounts)
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Get service account path from command line
const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error(
    "Usage: pnpm migrate:ai-presets <service-account.json>"
  );
  console.error("");
  console.error("Download your service account JSON from:");
  console.error(
    "  Firebase Console > Project Settings > Service Accounts > Generate new private key"
  );
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`Error: Service account file not found: ${absolutePath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateExperiencesToAiPresets(): Promise<void> {
  console.log("Starting migration from /experiences to /aiPresets...\n");

  // Step 1: Get all documents from /experiences
  const experiencesRef = db.collection("experiences");
  const aiPresetsRef = db.collection("aiPresets");

  const snapshot = await experiencesRef.get();
  const totalDocs = snapshot.size;

  if (totalDocs === 0) {
    console.log(
      "No documents found in /experiences collection. Nothing to migrate."
    );
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
    console.log(
      `\n✓ Verification passed: ${aiPresetsCount} documents in /aiPresets`
    );
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
