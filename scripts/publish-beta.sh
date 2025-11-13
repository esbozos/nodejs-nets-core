#!/bin/bash

# ============================================================================
# Publish beta/pre-release version to npm
# Usage: ./scripts/publish-beta.sh [beta|alpha|rc]
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

PRERELEASE_TYPE=${1:-beta}

if [[ ! "$PRERELEASE_TYPE" =~ ^(beta|alpha|rc)$ ]]; then
    print_warning "Invalid pre-release type. Using 'beta'"
    PRERELEASE_TYPE="beta"
fi

CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Clean and build
print_info "Building..."
rm -rf dist/
npm run build

# Bump version with prerelease identifier
print_info "Creating $PRERELEASE_TYPE version..."
NEW_VERSION=$(npm version prerelease --preid=$PRERELEASE_TYPE --no-git-tag-version)
print_success "New version: $NEW_VERSION"

# Publish with beta tag
print_info "Publishing to npm with '$PRERELEASE_TYPE' tag..."
npm publish --tag $PRERELEASE_TYPE --access public

print_success "Published $NEW_VERSION to npm!"
print_info "Users can install with: npm install nodejs-nets-core@$PRERELEASE_TYPE"

# Reset version if you don't want to commit beta versions
read -p "Commit beta version to git? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    git checkout package.json package-lock.json
    print_info "Version reset to $CURRENT_VERSION"
fi
