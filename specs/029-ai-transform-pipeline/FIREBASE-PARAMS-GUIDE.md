# Firebase Params Guide: GOOGLE_AI_API_KEY

This guide explains how to configure the Google AI API key using Firebase's modern Params API (Firebase Functions v2).

## Overview

Firebase Params (introduced in Functions v2) provides a unified way to manage configuration and secrets that works seamlessly in both local development (emulators) and production.

**Key Benefits**:
- ✅ Same configuration approach for local and production
- ✅ Secrets stored securely (Google Cloud Secret Manager in production)
- ✅ Interactive prompts during first use
- ✅ No manual .env file management
- ✅ Automatic .secret.local for emulator persistence

---

## Setup Steps

### 1. Get Your Google AI API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with `AIza...`)

**Important**: Keep this key secure - it provides access to your Google AI quota

---

### 2. Local Development (Emulators)

When you first start the Firebase emulators with AI transform code:

```bash
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine
pnpm functions:serve
```

**You'll be prompted**:
```
? Enter a value for GOOGLE_AI_API_KEY:
```

**What to do**:
1. Paste your API key from step 1
2. Press Enter

**What happens**:
- Firebase saves your key to `.secret.local` (gitignored)
- Subsequent runs automatically load from `.secret.local`
- No need to re-enter the key unless you delete `.secret.local`

---

### 3. Production Deployment

When you deploy functions to production:

```bash
firebase deploy --only functions
```

**You'll be prompted**:
```
? Enter a value for GOOGLE_AI_API_KEY:
```

**What to do**:
1. Paste your API key
2. Press Enter

**What happens**:
- Firebase stores the key in Google Cloud Secret Manager
- The secret is encrypted at rest
- Your function automatically has access to the value
- The key is NOT visible in Firebase Console or code

---

## How It Works in Code

In `functions/src/services/ai/providers/gemini.provider.ts`, we use:

```typescript
import { defineSecret } from 'firebase-functions/params';

// Define the secret parameter
const googleAiApiKey = defineSecret('GOOGLE_AI_API_KEY');

// Use in a function
export const someFunction = onRequest(
  {
    region: 'europe-west1',
    secrets: [googleAiApiKey], // Declare dependency
  },
  async (req, res) => {
    // Access the value
    const apiKey = googleAiApiKey.value();

    // Use with Gemini SDK
    const ai = new GoogleGenAI({ apiKey });
    // ...
  }
);
```

---

## Managing Secrets

### View Secret Value (Production)

```bash
# View secret in Google Cloud Secret Manager
firebase functions:secrets:access GOOGLE_AI_API_KEY
```

### Update Secret Value (Production)

If you need to rotate your API key:

```bash
# Set new value
firebase functions:secrets:set GOOGLE_AI_API_KEY

# Redeploy functions to use new value
firebase deploy --only functions
```

### Delete Local Secret

If you need to re-enter the key for emulators:

```bash
rm functions/.secret.local
# Next emulator run will prompt again
```

---

## Troubleshooting

### "Secret GOOGLE_AI_API_KEY not found"

**Cause**: Secret not configured for emulators or production

**Fix for Emulators**:
```bash
# Delete and re-prompt
rm functions/.secret.local
pnpm functions:serve
# Enter key when prompted
```

**Fix for Production**:
```bash
# Set the secret
firebase functions:secrets:set GOOGLE_AI_API_KEY
# Deploy
firebase deploy --only functions
```

---

### "Invalid API key" errors

**Cause**: API key is incorrect or doesn't have access to Gemini API

**Fix**:
1. Verify your API key at https://makersuite.google.com/app/apikey
2. Generate a new key if needed
3. Update the secret:
   - **Local**: Delete `.secret.local` and restart emulators
   - **Production**: Run `firebase functions:secrets:set GOOGLE_AI_API_KEY`

---

### "Permission denied" on Secret Manager

**Cause**: Your Firebase project doesn't have Secret Manager enabled

**Fix**:
1. Go to Google Cloud Console
2. Enable Secret Manager API for your project
3. Try deployment again

---

## Security Best Practices

✅ **DO**:
- Keep your API key secret
- Use different keys for development and production (optional)
- Rotate keys periodically
- Monitor API usage in Google AI Studio

❌ **DON'T**:
- Commit `.secret.local` to git (already gitignored)
- Share your API key in Slack/email/etc.
- Use the same key across multiple projects
- Hard-code API keys in source code

---

## Next Steps

Once you've configured the secret:
1. Verify emulators can access it
2. Test AI transformation locally
3. Deploy to production when ready
4. Monitor API usage and costs

---

## Reference

- [Firebase Params Documentation](https://firebase.google.com/docs/functions/config-env)
- [Google AI Studio](https://makersuite.google.com/)
- [Secret Manager Pricing](https://cloud.google.com/secret-manager/pricing)
