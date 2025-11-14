#!/bin/bash

# WordCraft Local Development Cleanup Script
# This script cleans up the development environment and reinstalls everything fresh

set -e  # Exit on any error

echo "🧹 Starting WordCraft cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Clean up temporary files and build artifacts
print_status "Cleaning up temporary files and build artifacts..."

# Remove Next.js build files
if [ -d ".next" ]; then
    print_status "Removing .next directory..."
    rm -rf .next
    print_success "Removed .next directory"
fi

# Remove OpenNext build files
if [ -d ".open-next" ]; then
    print_status "Removing .open-next directory..."
    rm -rf .open-next
    print_success "Removed .open-next directory"
fi

# Remove dist directory if it exists
if [ -d "dist" ]; then
    print_status "Removing dist directory..."
    rm -rf dist
    print_success "Removed dist directory"
fi



# Remove TypeScript build cache
if [ -d ".tsbuildinfo" ] || [ -f "*.tsbuildinfo" ]; then
    print_status "Removing TypeScript build cache..."
    find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
    print_success "Removed TypeScript build cache"
fi

# Remove ESLint cache
if [ -f ".eslintcache" ]; then
    print_status "Removing ESLint cache..."
    rm -f .eslintcache
    print_success "Removed ESLint cache"
fi

# 2. Clean up dependencies
print_status "Cleaning up dependencies..."

if [ -d "node_modules" ]; then
    print_status "Removing node_modules directory..."
    rm -rf node_modules
    print_success "Removed node_modules directory"
fi

# Remove package lock files
print_status "Removing package lock files..."
rm -f bun.lock package-lock.json yarn.lock 2>/dev/null || true
print_success "Removed package lock files"

# 3. Reinstall all packages
print_status "Reinstalling dependencies with bun..."
bun install
print_success "Dependencies reinstalled"



# 5. Final cleanup and verification
print_status "Performing final cleanup..."

# Clear any cached data that might interfere
print_status "Clearing any remaining cache files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

print_success "Final cleanup complete"

echo ""
echo -e "${GREEN}🎉 WordCraft cleanup completed successfully!${NC}"
echo ""
echo "Your local development environment has been reset:"
echo "  ✅ All temporary and build files removed"
echo "  ✅ Dependencies reinstalled"
echo ""
echo "You can now start development with:"
echo "  bun dev"
echo ""
