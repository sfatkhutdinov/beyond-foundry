#!/bin/bash

# Beyond Foundry Project Cleanup Script
# Removes temporary files, build artifacts, and cache directories

echo "🧹 Starting Beyond Foundry project cleanup..."

# Remove build artifacts from wrong locations
echo "Removing misplaced build artifacts..."
rm -f beyond-foundry.js beyond-foundry.js.map
rm -f foundry-dev-package/beyond-foundry.js foundry-dev-package/beyond-foundry.js.map

# Clean temporary directories
echo "Cleaning temporary directories..."
rm -rf analysis/
rm -rf debug/
rm -rf .rollup.cache/

# Clean up old test results
echo "Cleaning test artifacts..."
rm -rf test-results/
rm -rf coverage/

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Clean TypeScript build info
echo "Cleaning TypeScript build artifacts..."
find . -name "*.tsbuildinfo" -not -path "./node_modules/*" -delete

# Show space saved
echo "📊 Cleanup complete! Current directory sizes:"
du -sh reference/ tests/ scripts/ build/ foundry-dev-package/ 2>/dev/null || true

echo "✅ Project cleanup finished!"
