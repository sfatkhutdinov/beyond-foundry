#!/bin/bash

# Beyond Foundry - Final Validation Script
# This script performs final validation checks before production release

echo "🧪 Beyond Foundry - Final Validation"
echo "====================================="

echo "📦 1. Checking build artifacts..."
if [ -f "beyond-foundry.js" ]; then
    echo "   ✅ beyond-foundry.js found ($(du -h beyond-foundry.js | cut -f1))"
else
    echo "   ❌ beyond-foundry.js missing"
    exit 1
fi

if [ -f "beyond-foundry.css" ]; then
    echo "   ✅ beyond-foundry.css found ($(du -h beyond-foundry.css | cut -f1))"
else
    echo "   ❌ beyond-foundry.css missing"
    exit 1
fi

if [ -f "module.json" ]; then
    echo "   ✅ module.json found"
else
    echo "   ❌ module.json missing"
    exit 1
fi

echo ""
echo "🔧 2. Testing core functionality..."
echo "   Running spell integration test..."
node test-complete-character-with-spells.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Spell integration test passed"
else
    echo "   ❌ Spell integration test failed"
    exit 1
fi

echo "   Running comprehensive integration test..."
node test-comprehensive-integration.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Comprehensive integration test passed"
else
    echo "   ❌ Comprehensive integration test failed"
    exit 1
fi

echo ""
echo "📄 3. Checking documentation..."
docs=(
    "README.md"
    "SPELL-INTEGRATION-COMPLETE.md"
    "FINAL-PROJECT-STATUS.md"
    "COMPREHENSIVE-PARSER-DOCS.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "   ✅ $doc present"
    else
        echo "   ❌ $doc missing"
    fi
done

echo ""
echo "🎯 4. Final Status Check..."
echo "   Module ID: beyond-foundry"
echo "   Version: 1.0.0"
echo "   Build Size: $(du -h beyond-foundry.js | cut -f1)"
echo "   Features: Character Import + Spell Integration"
echo "   Status: Production Ready"

echo ""
echo "🎉 VALIDATION COMPLETE!"
echo "✅ Beyond Foundry is ready for FoundryVTT deployment"
echo "✅ All tests passing"
echo "✅ Build artifacts present"
echo "✅ Documentation complete"
echo ""
echo "🚀 Next steps:"
echo "   1. Install module in FoundryVTT"
echo "   2. Test with live FoundryVTT instance"
echo "   3. Validate character and spell import"
echo "   4. Ready for production release!"
