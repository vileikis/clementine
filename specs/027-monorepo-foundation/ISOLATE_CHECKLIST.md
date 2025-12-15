# Firebase Functions Isolation Implementation Checklist

## Phase 1: Pre-Implementation Setup

- [ ] Review `ISOLATE_PLAN.md` completely
- [ ] Ensure current code is committed to git (clean working tree)
- [ ] Verify current build works: `pnpm --filter @clementine/shared build && pnpm --filter @clementine/functions build`
- [ ] Verify local emulators work: `pnpm functions:serve`

## Phase 2: Package Configuration

### Update Shared Package
- [ ] Open `packages/shared/package.json`
- [ ] Add `"files": ["dist/**/*", "package.json", "README.md"]`
- [ ] Verify shared package builds: `cd packages/shared && pnpm build`
- [ ] Commit changes: `git add packages/shared/package.json && git commit -m "Add files field to shared package for isolation"`

### Update Functions Package
- [ ] Open `functions/package.json`
- [ ] Add `"files": ["dist/**/*", "package.json"]`
- [ ] Move `"@clementine/shared": "workspace:*"` from `devDependencies` to `dependencies`
- [ ] Save and verify JSON is valid
- [ ] Commit changes: `git add functions/package.json && git commit -m "Configure functions package for isolation"`

### Install isolate-package
- [ ] Run `cd functions && pnpm add -D isolate-package`
- [ ] Verify installation: `cd functions && pnpm list isolate-package`
- [ ] Commit lockfile: `git add pnpm-lock.yaml && git commit -m "Add isolate-package dependency"`

## Phase 3: Isolation Configuration

### Create Isolation Config
- [ ] Create new file: `functions/isolate.config.json`
- [ ] Add configuration:
  ```json
  {
    "outDir": "./isolate",
    "packageManager": "npm",
    "includeDevDependencies": false,
    "logLevel": "info"
  }
  ```
- [ ] Save file
- [ ] Commit: `git add functions/isolate.config.json && git commit -m "Add isolation configuration"`

### Update .gitignore
- [ ] Open `functions/.gitignore`
- [ ] Add `/isolate` to the file
- [ ] Save file
- [ ] Commit: `git add functions/.gitignore && git commit -m "Ignore isolation output directory"`

## Phase 4: Firebase Configuration

### Update firebase.json
- [ ] Open root `firebase.json`
- [ ] Change `"source": "functions"` to `"source": "functions/isolate"`
- [ ] Add predeploy hook: `"predeploy": ["cd functions && pnpm build && npx isolate"]`
- [ ] Remove `.deploy` from ignore list (if present)
- [ ] Verify JSON is valid
- [ ] Commit: `git add firebase.json && git commit -m "Configure Firebase to use isolated functions output"`

### Update Deployment Script
- [ ] Open `functions/scripts/deploy.sh`
- [ ] Simplify to:
  ```bash
  #!/bin/bash
  set -e

  echo "🚀 Deploying Clementine Functions..."

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
  cd "$ROOT_DIR"

  echo "📦 Building shared package..."
  pnpm --filter @clementine/shared build

  echo "🔥 Deploying to Firebase (predeploy will build & isolate)..."
  firebase deploy --only functions

  echo "✅ Deployment complete!"
  ```
- [ ] Save file
- [ ] Commit: `git add functions/scripts/deploy.sh && git commit -m "Simplify deployment script - predeploy handles isolation"`

## Phase 5: Local Testing

### Test Build
- [ ] Build shared: `pnpm --filter @clementine/shared build`
- [ ] Verify `packages/shared/dist/` contains files
- [ ] Build functions: `pnpm --filter @clementine/functions build`
- [ ] Verify `functions/dist/index.js` exists

### Test Isolation
- [ ] Run isolation: `cd functions && npx isolate`
- [ ] Check output: `ls -la functions/isolate/`
- [ ] Verify `isolate/` contains:
  - [ ] `dist/index.js`
  - [ ] `package.json`
  - [ ] `package-lock.json` (npm format)
- [ ] Inspect `isolate/package.json`:
  - [ ] Verify no `workspace:*` protocol
  - [ ] Verify `@clementine/shared` is listed properly
- [ ] Check isolation log for errors

### Validate Isolated Package
- [ ] `cd functions/isolate`
- [ ] Run `npm install` (should work without errors)
- [ ] Check `node_modules/@clementine/shared/` exists
- [ ] Verify shared package contents: `ls -la node_modules/@clementine/shared/dist/`

### Test Local Emulators
- [ ] Run `pnpm functions:serve` (from root)
- [ ] Verify emulators start without errors
- [ ] Check Functions emulator is running (port 5003)
- [ ] Make a code change in `functions/src/`
- [ ] Verify hot reload still works
- [ ] Stop emulators

## Phase 6: Deployment Testing

### Pre-Deployment Checks
- [ ] Ensure Firebase CLI is authenticated: `firebase login`
- [ ] Verify Firebase project: `firebase projects:list`
- [ ] Check current project: `firebase use`
- [ ] Ensure project is `clementine-7568d`: `firebase use clementine-7568d`

### First Deployment Attempt
- [ ] Run: `pnpm functions:deploy`
- [ ] Watch for predeploy hook execution:
  - [ ] Shared package build
  - [ ] Functions build with esbuild
  - [ ] Isolation runs (`npx isolate`)
- [ ] Monitor Cloud Build logs for errors
- [ ] Check for "EUNSUPPORTEDPROTOCOL" error (should NOT appear)

### Deployment Success Validation
- [ ] Deployment completes without errors
- [ ] Open Firebase Console: https://console.firebase.google.com/project/clementine-7568d/functions
- [ ] Verify functions are listed
- [ ] Check function status (should be "Active")
- [ ] Note deployed function names and URLs

### Runtime Validation
- [ ] Test function invocation (via Firebase Console or curl)
- [ ] Check function logs: `firebase functions:log`
- [ ] Verify no import/module errors
- [ ] Confirm shared package code is accessible at runtime
- [ ] Test with real data if applicable

## Phase 7: Post-Deployment Cleanup

### Documentation
- [ ] Update project README with deployment notes
- [ ] Document isolation requirement for new developers
- [ ] Add troubleshooting notes if any issues occurred

### Cleanup
- [ ] Remove old `.deploy/` directory if present: `rm -rf functions/.deploy`
- [ ] Clean isolation artifacts locally: `rm -rf functions/isolate`
- [ ] Verify `.gitignore` prevents committing `functions/isolate/`

### Verification
- [ ] Test deployment one more time: `pnpm functions:deploy`
- [ ] Verify it works consistently
- [ ] Test local emulators still work: `pnpm functions:serve`

## Phase 8: Team Communication

- [ ] Document changes in team chat/Slack/etc.
- [ ] Update deployment documentation
- [ ] Share this checklist with team
- [ ] Schedule knowledge transfer session if needed

## Rollback Plan (If Needed)

If deployment fails and you need to rollback:

- [ ] Revert firebase.json changes: `git checkout HEAD -- firebase.json`
- [ ] Revert functions/package.json: `git checkout HEAD -- functions/package.json`
- [ ] Revert packages/shared/package.json: `git checkout HEAD -- packages/shared/package.json`
- [ ] Remove isolate config: `rm functions/isolate.config.json`
- [ ] Rebuild and test: `pnpm build`
- [ ] Test deployment with old setup

## Success Criteria

Implementation is complete when:

- [x] ✅ All configuration files updated
- [x] ✅ Isolation runs successfully locally
- [x] ✅ `firebase deploy` completes without "EUNSUPPORTEDPROTOCOL" error
- [x] ✅ Functions are active in Firebase Console
- [x] ✅ Functions can be invoked successfully
- [x] ✅ Shared package code works at runtime
- [x] ✅ Local emulator hot reload still works
- [x] ✅ Team is informed and documentation updated

## Troubleshooting Reference

If issues occur, refer to the Troubleshooting section in `ISOLATE_PLAN.md`:
- Issue: Isolation fails with "No files included"
- Issue: Shared package not found in isolated output
- Issue: Functions fail at runtime with import errors
- Issue: Local emulators stop working

Enable debug mode if needed:
```bash
cd functions
DEBUG_ISOLATE_CONFIG=true npx isolate
```

Or update `isolate.config.json`:
```json
{
  "logLevel": "debug"
}
```

## Notes

- This is a one-time setup process
- Once complete, the workflow is: build → isolate (automatic via predeploy) → deploy
- Local development workflow remains unchanged
- Isolation only happens during deployment, not during local dev
