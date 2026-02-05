#!/bin/bash

# =============================================================================
# Functions Shell with Emulators
# =============================================================================
#
# Starts the Firebase functions shell connected to local emulators.
#
# Prerequisites:
#   Emulators must be running: pnpm functions:serve
#
# Usage:
#   ./scripts/functions-shell.sh
#   pnpm functions:shell  # If added to package.json
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Emulator ports (match firebase.json)
FIRESTORE_PORT="${FIRESTORE_PORT:-8080}"
STORAGE_PORT="${STORAGE_PORT:-9199}"

echo ""
echo -e "${YELLOW}Firebase Functions Shell (with Emulators)${NC}"
echo ""

# Check if emulators are running
echo "Checking emulator connectivity..."

if ! curl -s "http://127.0.0.1:${FIRESTORE_PORT}" > /dev/null 2>&1; then
  echo -e "${RED}Error: Firestore emulator not running on port ${FIRESTORE_PORT}${NC}"
  echo ""
  echo "Start emulators first in another terminal:"
  echo "  pnpm functions:serve"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Emulators detected${NC}"
echo ""

# Set emulator environment variables
export FIRESTORE_EMULATOR_HOST="127.0.0.1:${FIRESTORE_PORT}"
export FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:${STORAGE_PORT}"

echo "Environment configured:"
echo "  FIRESTORE_EMULATOR_HOST=${FIRESTORE_EMULATOR_HOST}"
echo "  FIREBASE_STORAGE_EMULATOR_HOST=${FIREBASE_STORAGE_EMULATOR_HOST}"
echo ""
echo -e "${YELLOW}Starting functions shell...${NC}"
echo ""
echo "Example usage:"
echo "  startTransformPipelineV2({ jobId: \"test-job-123\" })"
echo ""

# Start the functions shell
firebase functions:shell
