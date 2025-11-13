#!/bin/bash

# ============================================================================
# BASH SCRIPT to build and publish nodejs-nets-core to npm
# Author: Migrated from django-nets-core
# Date: 2024-11-12
# Version: 2.0
# Description: This script handles versioning, building, and publishing to npm
# Usage: ./scripts/release.sh [patch|minor|major]
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# 1. Validate environment
# ============================================================================

print_info "Validating environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we're logged into npm
if ! npm whoami &> /dev/null; then
    print_error "You are not logged into npm. Please run 'npm login' first."
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes:"
    git status -s
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted."
        exit 0
    fi
fi

print_success "Environment validated"

# ============================================================================
# 2. Get version bump type
# ============================================================================

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major|prepatch|preminor|premajor|prerelease)$ ]]; then
    print_error "Invalid version type: $VERSION_TYPE"
    echo "Usage: $0 [patch|minor|major|prepatch|preminor|premajor|prerelease]"
    echo ""
    echo "Examples:"
    echo "  patch:      1.0.0 -> 1.0.1 (bug fixes)"
    echo "  minor:      1.0.0 -> 1.1.0 (new features, backwards compatible)"
    echo "  major:      1.0.0 -> 2.0.0 (breaking changes)"
    echo "  prerelease: 1.0.0 -> 1.0.1-0 (pre-release version)"
    exit 1
fi

CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"
print_info "Version bump type: $VERSION_TYPE"

# ============================================================================
# 3. Run tests
# ============================================================================

print_info "Running tests..."
if npm test; then
    print_success "All tests passed"
else
    print_error "Tests failed. Please fix them before releasing."
    exit 1
fi

# ============================================================================
# 4. Run linter
# ============================================================================

print_info "Running linter..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting found issues. Continue anyway? (y/N): "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ============================================================================
# 5. Clean and build
# ============================================================================

print_info "Cleaning previous build..."
rm -rf dist/

print_info "Building project..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# ============================================================================
# 6. Bump version
# ============================================================================

print_info "Bumping version..."
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
print_success "Version bumped to $NEW_VERSION"

# ============================================================================
# 7. Update CHANGELOG
# ============================================================================

print_info "Updating CHANGELOG.md..."
DATE=$(date +%Y-%m-%d)
TEMP_FILE=$(mktemp)

# Add new version entry to CHANGELOG
{
    echo "## [$NEW_VERSION] - $DATE"
    echo ""
    echo "### Added"
    echo "- [Add new features here]"
    echo ""
    echo "### Changed"
    echo "- [Add changes here]"
    echo ""
    echo "### Fixed"
    echo "- [Add bug fixes here]"
    echo ""
    cat CHANGELOG.md
} > "$TEMP_FILE"

mv "$TEMP_FILE" CHANGELOG.md

print_warning "Please edit CHANGELOG.md to add release notes"
read -p "Press Enter when ready to continue..."

# ============================================================================
# 8. Commit changes
# ============================================================================

print_info "Committing changes..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"

# ============================================================================
# 9. Create git tag
# ============================================================================

print_info "Creating git tag..."
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"
print_success "Git tag $NEW_VERSION created"

# ============================================================================
# 10. Publish to npm
# ============================================================================

print_warning "Ready to publish $NEW_VERSION to npm"
read -p "Do you want to publish now? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Publishing to npm..."
    
    # Publish with public access (for scoped packages) or normal publish
    if npm publish --access public; then
        print_success "Successfully published $NEW_VERSION to npm!"
    else
        print_error "Failed to publish to npm"
        print_warning "Rolling back version..."
        git tag -d "$NEW_VERSION"
        git reset --hard HEAD~1
        exit 1
    fi
else
    print_warning "Skipping npm publish"
    print_info "You can publish later with: npm publish --access public"
fi

# ============================================================================
# 11. Push to git
# ============================================================================

print_warning "Ready to push changes to git"
read -p "Do you want to push to origin now? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Pushing to origin..."
    git push origin master
    git push origin "$NEW_VERSION"
    print_success "Changes pushed to git"
else
    print_warning "Skipping git push"
    print_info "Remember to push manually with:"
    echo "  git push origin master"
    echo "  git push origin $NEW_VERSION"
fi

# ============================================================================
# Summary
# ============================================================================

echo ""
print_success "═══════════════════════════════════════════════════════════"
print_success "Release $NEW_VERSION completed successfully!"
print_success "═══════════════════════════════════════════════════════════"
echo ""
print_info "Next steps:"
echo "  1. Verify the package on npm: https://www.npmjs.com/package/nodejs-nets-core"
echo "  2. Test installation: npm install nodejs-nets-core@$NEW_VERSION"
echo "  3. Create GitHub release with release notes"
echo ""
