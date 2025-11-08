// Test route to verify Firebase Admin SDK connection
// Visit: http://localhost:3000/api/test-firebase

import { NextResponse } from "next/server";
import { db, storage } from "@/lib/firebase/admin";

export async function GET() {
  try {
    // Test 1: List Firestore collections
    const collections = await db.listCollections();
    const collectionNames = collections.map((col) => col.id);

    // Test 2: Try to read from a test collection (will work with POC security rules)
    const testDoc = await db.collection("_test").doc("connection").get();

    // Test 3: Check Storage bucket access
    const [bucketExists] = await storage.exists();

    return NextResponse.json({
      success: true,
      message: "Firebase Admin SDK connected successfully! ✅",
      tests: {
        firestore: {
          connected: true,
          collections: collectionNames,
          collectionsCount: collectionNames.length,
        },
        storage: {
          connected: true,
          bucketExists,
          bucketName: storage.name,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Firebase Admin SDK connection failed ❌",
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Check your FIREBASE_* environment variables in .env.local",
      },
      { status: 500 }
    );
  }
}
