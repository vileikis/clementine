#!/usr/bin/env tsx

/**
 * Grant Admin Script
 *
 * Server-side script to grant admin privileges to users via Firebase Admin SDK.
 *
 * Usage:
 *   pnpm grant-admin <email>
 *   node --loader tsx scripts/grant-admin.ts <email>
 *
 * Requirements:
 *   - Firebase Admin SDK credentials (service account JSON)
 *   - User must exist in Firebase Auth
 *   - User must not be anonymous
 *
 * Example:
 *   pnpm grant-admin user@example.com
 */

// Load environment variables from .env.local
import { config } from 'dotenv'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

config({ path: '.env.local' })

// Email validation schema (T049)
const GrantAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
})

// Firebase Admin SDK initialization (T048)
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return // Already initialized
  }

  // Load service account credentials from environment variables
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  // Validate required environment variables
  if (
    !serviceAccount.projectId ||
    !serviceAccount.clientEmail ||
    !serviceAccount.privateKey
  ) {
    console.error('❌ Error: Missing Firebase Admin SDK credentials')
    console.error(
      'Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local',
    )
    process.exit(1)
  }

  try {
    initializeApp({
      credential: cert(serviceAccount as any),
    })
    console.log('✅ Firebase Admin SDK initialized')
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error)
    process.exit(1)
  }
}

// Main grant admin function
async function grantAdmin(email: string): Promise<void> {
  try {
    // Validate email format (T049)
    const validation = GrantAdminSchema.safeParse({ email })
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error.issues[0].message)
      process.exit(1)
    }

    console.log(`\n🔍 Looking up user: ${email}`)

    const auth = getAuth()

    // Get user by email (T050)
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(email)
    } catch (error: any) {
      // Error handling for user-not-found case (T054)
      if (error.code === 'auth/user-not-found') {
        console.error(`❌ Error: User not found with email: ${email}`)
        console.error(
          'Please create the user in Firebase Console first (Authentication → Users → Add user)',
        )
        process.exit(1)
      }
      throw error
    }

    console.log(`✅ User found: ${userRecord.uid}`)

    // Check if user is anonymous (T051)
    if (userRecord.providerData.length === 0) {
      console.error(
        '❌ Error: Cannot grant admin privileges to anonymous users',
      )
      console.error(
        'Anonymous users have no provider data. User must authenticate with email/password or OAuth.',
      )
      process.exit(1)
    }

    // Check if user already has admin claim
    const existingClaims = userRecord.customClaims || {}
    if (existingClaims.admin === true) {
      console.log(`ℹ️  User ${email} already has admin privileges`)
      process.exit(0)
    }

    // Grant admin claim (T052)
    console.log('🔧 Setting admin custom claim...')
    await auth.setCustomUserClaims(userRecord.uid, {
      ...existingClaims,
      admin: true,
    })

    console.log(`\n✅ Success! Admin privileges granted to ${email}`)
    console.log(`   User ID: ${userRecord.uid}`)
    console.log(
      '\n⚠️  Important: User must sign out and sign back in for changes to take effect.',
    )
    console.log(
      '   Custom claims are embedded in ID tokens, which are cached client-side.',
    )
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// CLI argument parsing (T053)
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Error: Email argument is required')
    console.error('\nUsage:')
    console.error('  pnpm grant-admin <email>')
    console.error('\nExample:')
    console.error('  pnpm grant-admin user@example.com')
    process.exit(1)
  }

  const email = args[0]

  console.log('🚀 Grant Admin Script')
  console.log('====================\n')

  // Initialize Firebase Admin SDK
  initializeFirebaseAdmin()

  // Grant admin privileges
  await grantAdmin(email)
}

// Execute main function
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
