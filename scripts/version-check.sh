#!/bin/bash

# ============================================================================
# Check current version and suggest next version
# Usage: ./scripts/version-check.sh
# ============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

CURRENT_VERSION=$(node -p "require('./package.json').version")

echo ""
print_info "═══════════════════════════════════════════════════════════"
print_info "            Version Information"
print_info "═══════════════════════════════════════════════════════════"
echo ""
print_success "Current version: $CURRENT_VERSION"
echo ""

# Calculate next versions
PATCH=$(npm version patch --no-git-tag-version -w package.json 2>/dev/null | grep -oP '\d+\.\d+\.\d+')
git checkout package.json package-lock.json 2>/dev/null

MINOR=$(npm version minor --no-git-tag-version -w package.json 2>/dev/null | grep -oP '\d+\.\d+\.\d+')
git checkout package.json package-lock.json 2>/dev/null

MAJOR=$(npm version major --no-git-tag-version -w package.json 2>/dev/null | grep -oP '\d+\.\d+\.\d+')
git checkout package.json package-lock.json 2>/dev/null

print_info "Next versions:"
echo "  patch (bug fixes):              $PATCH"
echo "  minor (new features):           $MINOR"
echo "  major (breaking changes):       $MAJOR"
echo ""

# Check if published on npm
print_info "Checking npm registry..."
if npm view nodejs-nets-core version &>/dev/null; then
    NPM_VERSION=$(npm view nodejs-nets-core version)
    print_success "Published on npm: $NPM_VERSION"
    
    if [ "$NPM_VERSION" = "$CURRENT_VERSION" ]; then
        echo "  ✓ Local and npm versions match"
    else
        echo "  ⚠ Local version ($CURRENT_VERSION) differs from npm ($NPM_VERSION)"
    fi
else
    echo "  ⚠ Package not found on npm (not published yet)"
fi

echo ""
print_info "═══════════════════════════════════════════════════════════"
echo ""
print_info "To release a new version, run:"
echo "  ./scripts/release.sh patch   # for $PATCH"
echo "  ./scripts/release.sh minor   # for $MINOR"
echo "  ./scripts/release.sh major   # for $MAJOR"
echo ""
