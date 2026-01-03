#!/bin/bash

# Create a new git worktree with branch and setup
# Usage: ./scripts/new-worktree.sh <type> <name>
# Example: ./scripts/new-worktree.sh tech workspace-polish
# Types: feature, tech, fix

set -e

TYPE=$1
NAME=$2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$TYPE" ] || [ -z "$NAME" ]; then
  echo -e "${RED}Error: Missing arguments${NC}"
  echo ""
  echo "Usage: $0 <type> <name>"
  echo ""
  echo "Types:"
  echo "  feature  - New feature development"
  echo "  tech     - Technical improvements/refactoring"
  echo "  fix      - Bug fixes"
  echo ""
  echo "Example: $0 tech workspace-polish"
  exit 1
fi

# Validate type
if [[ ! "$TYPE" =~ ^(feature|tech|fix)$ ]]; then
  echo -e "${RED}Invalid type: ${TYPE}${NC}"
  echo "Must be one of: feature, tech, fix"
  exit 1
fi

BRANCH_NAME="${TYPE}/${NAME}"
WORKTREE_PATH="../${NAME}"

echo -e "${BLUE}Creating worktree...${NC}"
echo "  Branch: ${BRANCH_NAME}"
echo "  Path: ${WORKTREE_PATH}"
echo ""

# Create the worktree
git worktree add "${WORKTREE_PATH}" -b "${BRANCH_NAME}"

echo ""
echo -e "${BLUE}Installing dependencies...${NC}"
cd "${WORKTREE_PATH}"
pnpm i

echo ""
echo -e "${BLUE}Opening in Cursor...${NC}"
cursor .

echo ""
echo -e "${GREEN}✓ Done!${NC}"
echo ""
echo "Worktree created at: ${WORKTREE_PATH}"
echo "Branch: ${BRANCH_NAME}"
echo ""
echo "To remove this worktree later:"
echo "  git worktree remove ${WORKTREE_PATH}"
