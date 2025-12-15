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
