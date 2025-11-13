#!/bin/bash

# ============================================================================
# Quick publish script - for experienced users
# Usage: ./scripts/quick-release.sh
# ============================================================================

set -e

# Get version type from user
echo "Select version bump type:"
echo "  1) patch (1.0.0 -> 1.0.1) - Bug fixes"
echo "  2) minor (1.0.0 -> 1.1.0) - New features"
echo "  3) major (1.0.0 -> 2.0.0) - Breaking changes"
read -p "Enter choice (1-3): " choice

case $choice in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Run checks
echo "Running tests..."
npm test || { echo "Tests failed!"; exit 1; }

echo "Running build..."
npm run build || { echo "Build failed!"; exit 1; }

# Bump version
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
echo "New version: $NEW_VERSION"

# Publish
echo "Publishing to npm..."
npm publish --access public

# Git operations
git add package.json package-lock.json
git commit -m "chore: release $NEW_VERSION"
git tag "$NEW_VERSION"
git push origin master --tags

echo "✓ Successfully published $NEW_VERSION!"
