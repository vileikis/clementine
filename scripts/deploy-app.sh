#!/bin/bash
set -e

BACKEND_ID="clementine-be"

# Use provided branch or detect current branch
if [ -n "$1" ]; then
  BRANCH="$1"
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$BRANCH" = "HEAD" ]; then
    echo "Error: Cannot deploy from detached HEAD state."
    echo "Either checkout a branch or specify a branch name: pnpm app:deploy <branch>"
    exit 1
  fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "Warning: You have uncommitted changes!"
  echo ""
  git status --short
  echo ""
  read -p "Deploy anyway? (y/N): " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Check if branch exists on remote
if ! git ls-remote --exit-code --heads origin "$BRANCH" > /dev/null 2>&1; then
  echo "Error: Branch '$BRANCH' does not exist on remote."
  echo "Push your branch first: git push -u origin $BRANCH"
  exit 1
fi

# Confirmation prompt
echo ""
echo "Deploy to Firebase App Hosting"
echo "=============================="
echo "Backend:  $BACKEND_ID"
echo "Branch:   $BRANCH"
echo ""
read -p "Continue? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Deploying..."
firebase apphosting:rollouts:create "$BACKEND_ID" --git-branch "$BRANCH"
