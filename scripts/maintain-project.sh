#!/bin/bash

# Beyond Foundry - Project Maintenance Script
# This script helps maintain the organized directory structure

echo "🧹 Beyond Foundry Project Maintenance"
echo "======================================"

# Function to show directory sizes
show_sizes() {
    echo "📊 Directory Sizes:"
    echo "  build/: $(du -sh build/ 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "  debug/: $(du -sh debug/ 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "  analysis/: $(du -sh analysis/ 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "  tests/: $(du -sh tests/ 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "  node_modules/: $(du -sh node_modules/ 2>/dev/null | cut -f1 || echo 'N/A')"
    echo ""
}

# Function to clean temporary files
clean_temp() {
    echo "🗑️  Cleaning temporary files..."
    
    # Clean build artifacts
    if [ -d "build" ]; then
        rm -rf build/*
        echo "  ✅ Cleaned build directory"
    fi
    
    # Clean debug temp files
    find debug/ -name "*.tmp" -delete 2>/dev/null
    find debug/ -name "temp-*" -delete 2>/dev/null
    echo "  ✅ Cleaned debug temp files"
    
    # Clean test outputs
    find tests/ -name "test-output-*" -delete 2>/dev/null
    echo "  ✅ Cleaned test outputs"
    
    # Clean npm cache
    npm cache clean --force > /dev/null 2>&1
    echo "  ✅ Cleaned npm cache"
    
    echo ""
}

# Function to validate structure
validate_structure() {
    echo "🔍 Validating directory structure..."
    
    required_dirs=("src" "tests" "docs" "build" "analysis" "debug" "scripts" "tools")
    missing_dirs=()
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            missing_dirs+=("$dir")
        fi
    done
    
    if [ ${#missing_dirs[@]} -eq 0 ]; then
        echo "  ✅ All required directories present"
    else
        echo "  ❌ Missing directories: ${missing_dirs[*]}"
        echo "  Creating missing directories..."
        for dir in "${missing_dirs[@]}"; do
            mkdir -p "$dir"
            echo "    ✅ Created $dir/"
        done
    fi
    echo ""
}

# Function to check for misplaced files
check_misplaced() {
    echo "🔎 Checking for misplaced files..."
    
    # Check for test files in root
    test_files_in_root=(test-*.js test-*.cjs validate-*.sh)
    misplaced_tests=()
    for pattern in "${test_files_in_root[@]}"; do
        if ls $pattern 1> /dev/null 2>&1; then
            misplaced_tests+=($(ls $pattern))
        fi
    done
    
    if [ ${#misplaced_tests[@]} -gt 0 ]; then
        echo "  ⚠️  Test files in root: ${misplaced_tests[*]}"
        echo "     Run: mv test-*.js test-*.cjs validate-*.sh tests/"
    else
        echo "  ✅ No misplaced test files"
    fi
    
    # Check for build files in root
    build_files_in_root=(beyond-foundry.js beyond-foundry.js.map beyond-foundry.css)
    misplaced_builds=()
    for file in "${build_files_in_root[@]}"; do
        if [ -f "$file" ]; then
            misplaced_builds+=("$file")
        fi
    done
    
    if [ ${#misplaced_builds[@]} -gt 0 ]; then
        echo "  ⚠️  Build files in root: ${misplaced_builds[*]}"
        echo "     Run: mv beyond-foundry.* build/"
    else
        echo "  ✅ No misplaced build files"
    fi
    
    echo ""
}

# Function to show file counts
show_counts() {
    echo "📈 File Counts:"
    echo "  Source files: $(find src/ -name "*.ts" -o -name "*.js" | wc -l | tr -d ' ')"
    echo "  Test files: $(find tests/ -name "*.js" -o -name "*.cjs" -o -name "*.sh" | wc -l | tr -d ' ')"
    echo "  Documentation: $(find docs/ -name "*.md" | wc -l | tr -d ' ')"
    echo "  Templates: $(find templates/ -name "*.hbs" | wc -l | tr -d ' ')"
    echo "  Scripts: $(find scripts/ -name "*.js" | wc -l | tr -d ' ')"
    echo ""
}

# Main menu
while true; do
    echo "Choose an action:"
    echo "1) Show directory sizes"
    echo "2) Clean temporary files"
    echo "3) Validate structure"
    echo "4) Check for misplaced files"
    echo "5) Show file counts"
    echo "6) Full maintenance (all of the above)"
    echo "0) Exit"
    echo ""
    
    read -p "Enter your choice (0-6): " choice
    echo ""
    
    case $choice in
        1) show_sizes ;;
        2) clean_temp ;;
        3) validate_structure ;;
        4) check_misplaced ;;
        5) show_counts ;;
        6) 
            show_sizes
            validate_structure
            check_misplaced
            clean_temp
            show_counts
            echo "🎉 Full maintenance completed!"
            echo ""
            ;;
        0) 
            echo "👋 Goodbye!"
            exit 0
            ;;
        *) 
            echo "❌ Invalid choice. Please try again."
            echo ""
            ;;
    esac
done
