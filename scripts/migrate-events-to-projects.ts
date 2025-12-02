#!/usr/bin/env node
/**
 * Migration Script: /events → /projects
 *
 * This script copies all documents from the /events collection
 * to the /projects collection with field renaming:
 *   - ownerId → companyId
 *   - joinPath → sharePath
 *   - activeJourneyId → activeEventId
 *
 * Usage:
 *   cd scripts && pnpm migrate:projects [--dry-run] <service-account.json>
 *
 *   Or directly:
 *   cd scripts && node --import=tsx migrate-events-to-projects.ts [--dry-run] <service-account.json>
 *
 * Options:
 *   --dry-run: Preview changes without writing to Firestore
 *
 * Prerequisites:
 *   - Firebase service account JSON file (download from Firebase Console > Project Settings > Service Accounts)
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const serviceAccountPath = args.find((arg) => !arg.startsWith("--"));

if (!serviceAccountPath) {
  console.error("Usage: pnpm migrate:projects [--dry-run] <service-account.json>");
  console.error("");
  console.error("Options:");
  console.error("  --dry-run    Preview changes without writing to Firestore");
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

interface EventDocument {
  id: string;
  name: string;
  status: string;
  ownerId: string | null;
  joinPath: string;
  qrPngPath: string;
  publishStartAt?: number | null;
  publishEndAt?: number | null;
  activeJourneyId?: string | null;
  theme: Record<string, unknown>;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  [key: string]: unknown;
}

interface ProjectDocument {
  id: string;
  name: string;
  status: string;
  companyId: string | null;
  sharePath: string;
  qrPngPath: string;
  publishStartAt?: number | null;
  publishEndAt?: number | null;
  activeEventId?: string | null;
  theme: Record<string, unknown>;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  [key: string]: unknown;
}

/**
 * Transform Event document to Project document with field renaming
 */
function transformEventToProject(eventDoc: admin.firestore.QueryDocumentSnapshot): ProjectDocument {
  const eventData = eventDoc.data() as EventDocument;

  // Create project document with renamed fields
  const projectData: ProjectDocument = {
    ...eventData,
    id: eventDoc.id,
    companyId: eventData.ownerId ?? null,
    sharePath: eventData.joinPath,
    activeEventId: eventData.activeJourneyId ?? null,
  };

  // Remove old field names
  delete projectData.ownerId;
  delete projectData.joinPath;
  delete projectData.activeJourneyId;

  return projectData;
}

async function migrateEventsToProjects(): Promise<void> {
  const mode = isDryRun ? "[DRY RUN] " : "";
  console.log(`${mode}Starting migration from /events to /projects...\n`);

  if (isDryRun) {
    console.log("⚠️  DRY RUN MODE - No writes will be performed\n");
  }

  // Step 1: Get all documents from /events
  const eventsRef = db.collection("events");
  const projectsRef = db.collection("projects");

  const snapshot = await eventsRef.get();
  const totalDocs = snapshot.size;

  if (totalDocs === 0) {
    console.log("No documents found in /events collection. Nothing to migrate.");
    return;
  }

  console.log(`Found ${totalDocs} documents in /events collection.`);

  // Step 2: Transform and preview changes
  const transformedDocs: Array<{ id: string; data: ProjectDocument }> = [];

  console.log("\nTransforming documents...");
  for (const doc of snapshot.docs) {
    const projectData = transformEventToProject(doc);
    transformedDocs.push({ id: doc.id, data: projectData });
  }

  // Step 3: Show sample transformations (first 3 docs)
  console.log("\nSample transformations (first 3 documents):");
  console.log("=".repeat(80));
  for (let i = 0; i < Math.min(3, transformedDocs.length); i++) {
    const { id, data } = transformedDocs[i];
    const originalData = snapshot.docs[i].data() as EventDocument;

    console.log(`\nDocument ID: ${id}`);
    console.log(`  ownerId: ${originalData.ownerId} → companyId: ${data.companyId}`);
    console.log(`  joinPath: ${originalData.joinPath} → sharePath: ${data.sharePath}`);
    console.log(
      `  activeJourneyId: ${originalData.activeJourneyId ?? "null"} → activeEventId: ${data.activeEventId ?? "null"}`
    );
    console.log(`  Other fields: preserved as-is`);
  }
  console.log("=".repeat(80));

  if (isDryRun) {
    console.log("\n✓ Dry run complete. Review transformations above.");
    console.log("Run without --dry-run flag to perform actual migration.");
    return;
  }

  // Step 4: Batch write to /projects (Firestore batch limit is 500)
  console.log("\nWriting to /projects collection...");
  const BATCH_SIZE = 500;
  let migratedCount = 0;

  for (let i = 0; i < transformedDocs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = transformedDocs.slice(i, i + BATCH_SIZE);

    for (const { id, data } of chunk) {
      const targetRef = projectsRef.doc(id);
      // Remove the 'id' field before writing (it's the document ID, not a field)
      const { id: _id, ...dataWithoutId } = data;
      batch.set(targetRef, dataWithoutId);
    }

    await batch.commit();
    migratedCount += chunk.length;
    console.log(`Migrated ${migratedCount}/${totalDocs} documents...`);
  }

  // Step 5: Verify migration
  console.log("\nVerifying migration...");
  const projectsSnapshot = await projectsRef.get();
  const projectsCount = projectsSnapshot.size;

  if (projectsCount === totalDocs) {
    console.log(`\n✓ Verification passed: ${projectsCount} documents in /projects`);
    console.log("Migration complete!\n");
    console.log("Note: The /events collection has been preserved as backup.");
    console.log("You can delete it later after confirming stability.");
  } else {
    console.error(
      `\n✗ Verification failed: Expected ${totalDocs} documents but found ${projectsCount}`
    );
    process.exit(1);
  }

  // Step 6: Spot-check 10 random documents
  console.log("\nSpot-checking 10 random documents for field correctness...");
  const randomDocs = projectsSnapshot.docs
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, projectsSnapshot.docs.length));

  let spotChecksPassed = 0;
  for (const doc of randomDocs) {
    const data = doc.data() as ProjectDocument;
    const hasCompanyId = "companyId" in data;
    const hasSharePath = "sharePath" in data;
    const noOwnerId = !("ownerId" in data);
    const noJoinPath = !("joinPath" in data);
    const noActiveJourneyId = !("activeJourneyId" in data);

    if (hasCompanyId && hasSharePath && noOwnerId && noJoinPath && noActiveJourneyId) {
      spotChecksPassed++;
    } else {
      console.error(`✗ Spot-check failed for document ${doc.id}`);
      console.error(`  hasCompanyId: ${hasCompanyId}`);
      console.error(`  hasSharePath: ${hasSharePath}`);
      console.error(`  noOwnerId: ${noOwnerId}`);
      console.error(`  noJoinPath: ${noJoinPath}`);
      console.error(`  noActiveJourneyId: ${noActiveJourneyId}`);
    }
  }

  if (spotChecksPassed === randomDocs.length) {
    console.log(`✓ All ${spotChecksPassed} spot-checks passed!`);
  } else {
    console.error(
      `✗ Spot-checks failed: ${spotChecksPassed}/${randomDocs.length} passed`
    );
    process.exit(1);
  }
}

// Run migration
migrateEventsToProjects()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
