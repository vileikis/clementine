# Environment Variables & Secrets Management

This document explains how environment variables and secrets are managed for Firebase App Hosting deployment.

## Overview

Firebase App Hosting uses **Google Cloud Secret Manager** to securely store sensitive values. Secrets are **never** stored in `apphosting.yaml` - only their names are referenced.

## Variable Types

### 1. Client-Side Variables (Public)

These are bundled into your client-side JavaScript and are visible to anyone:

```yaml
- variable: VITE_FIREBASE_API_KEY
  value: AIzaSy...  # ✅ OK to commit - this is public anyway
  availability:
    - BUILD
    - RUNTIME
```

**Client-side variables:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Why it's safe:** These values are embedded in your client bundle and visible in browser DevTools. They're protected by Firebase Security Rules, not by secrecy.

### 2. Server-Side Secrets (Private)

These are only available on the server and should **never** be exposed:

```yaml
- variable: SESSION_SECRET
  secret: SESSION_SECRET  # ✅ References Secret Manager, NOT the actual value
  availability:
    - RUNTIME
```

**Server-side secrets:**
- `SESSION_SECRET`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_STORAGE_BUCKET`
- `FIREBASE_ADMIN_PRIVATE_KEY`

**Why it's protected:** These are stored in Google Cloud Secret Manager and injected at runtime. Never committed to git.

## Setup Process

### Step 1: Install Google Cloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Or download from:
# https://cloud.google.com/sdk/docs/install
```

### Step 2: Authenticate

```bash
gcloud auth login
gcloud config set project clementine-7568d
```

### Step 3: Run Setup Script

```bash
cd apps/clementine-app
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

The script will prompt you to enter each secret value interactively.

### Step 4: Verify Secrets

```bash
gcloud secrets list --project=clementine-7568d
```

You should see all 5 secrets listed.

## Manual Secret Management

### Create a Secret

```bash
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME \
  --data-file=- \
  --replication-policy="automatic" \
  --project=clementine-7568d
```

### Update a Secret

```bash
echo -n "new-secret-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=- \
  --project=clementine-7568d
```

### View Secret Metadata

```bash
gcloud secrets describe SECRET_NAME --project=clementine-7568d
```

### Delete a Secret

```bash
gcloud secrets delete SECRET_NAME --project=clementine-7568d
```

## How It Works

1. **In `apphosting.yaml`:**
   ```yaml
   - variable: SESSION_SECRET
     secret: SESSION_SECRET  # References the secret name
   ```

2. **In Google Cloud Secret Manager:**
   - Secret name: `SESSION_SECRET`
   - Secret value: `j6MKFSbykMGofUvJBYLtkEpCgHPgIcruvZKyDln4BJI`

3. **At runtime:**
   - Firebase App Hosting reads the secret from Secret Manager
   - Injects it as `process.env.SESSION_SECRET`
   - Your server code accesses it normally

## Getting Secret Values

### Generate SESSION_SECRET

```bash
openssl rand -base64 32
```

### Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Generate new private key
4. Download the JSON file
5. Extract values:
   - `FIREBASE_ADMIN_PROJECT_ID`: `project_id` field
   - `FIREBASE_ADMIN_CLIENT_EMAIL`: `client_email` field
   - `FIREBASE_ADMIN_PRIVATE_KEY`: `private_key` field (includes `\n` characters)
   - `FIREBASE_ADMIN_STORAGE_BUCKET`: `{project_id}.firebasestorage.app`

**Important:** For `FIREBASE_ADMIN_PRIVATE_KEY`, use the exact value from the JSON file, including the `\n` newline characters.

## Security Best Practices

### ✅ DO

- Store server secrets in Google Cloud Secret Manager
- Commit `apphosting.yaml` with secret references (not values)
- Rotate secrets regularly (especially after team changes)
- Use least-privilege IAM roles
- Enable Secret Manager audit logging

### ❌ DON'T

- Commit actual secret values to git
- Share secrets via Slack/email
- Reuse secrets across environments
- Store secrets in `.env` files that get committed
- Log secret values

## Troubleshooting

### "Secret not found" error

```bash
# Verify the secret exists
gcloud secrets describe SECRET_NAME --project=clementine-7568d

# Check IAM permissions
gcloud secrets get-iam-policy SECRET_NAME --project=clementine-7568d
```

### App Hosting can't access secrets

Firebase App Hosting service account needs `secretmanager.secretAccessor` role:

```bash
# Find the App Hosting service account (usually shown in deployment logs)
# Then grant access:
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project=clementine-7568d
```

### Wrong secret value

```bash
# View current version
gcloud secrets versions access latest --secret=SECRET_NAME --project=clementine-7568d

# Add new version
echo -n "correct-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=- \
  --project=clementine-7568d
```

## Environment-Specific Secrets

If you need different secrets for staging/production:

1. **Option A:** Separate projects
   - `clementine-7568d` (production)
   - `clementine-staging` (staging)
   - Each has its own Secret Manager

2. **Option B:** Prefixed secrets in same project
   - `prod_SESSION_SECRET`
   - `staging_SESSION_SECRET`
   - Update `apphosting.yaml` per environment

## Local Development

For local development, use `.env.local` (not committed):

```bash
# apps/clementine-app/.env.local
SESSION_SECRET=local-dev-secret
FIREBASE_ADMIN_PROJECT_ID=clementine-7568d
# ... etc
```

**Never commit `.env.local` to git!** It's in `.gitignore` by default.

## Resources

- [Firebase App Hosting - Environment Variables](https://firebase.google.com/docs/app-hosting/configure#environment-variables)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)

## Questions?

- Check Firebase App Hosting logs for deployment errors
- Use `gcloud secrets` commands to debug
- Review Google Cloud IAM permissions for the App Hosting service account
