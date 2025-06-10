#!/bin/bash

# Quick Integration Setup Script
# Sets up basic integrations that can be configured via CLI

set -e

echo "🚀 Quick Integration Setup for Beyond Foundry"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this from your project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Setting up automated integrations...${NC}"

# Function to check if GitHub CLI is available
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI not found. Please install it first.${NC}"
        echo "   Install: brew install gh"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI not authenticated. Please run 'gh auth login' first.${NC}"
        exit 1
    fi
}

# Function to safely set a secret
set_secret_safe() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ] || [ "$secret_value" = "skip" ]; then
        echo -e "${YELLOW}⏭️  Skipping $secret_name${NC}"
        return
    fi
    
    echo -e "${BLUE}🔐 Setting secret: $secret_name${NC}"
    echo "$secret_value" | gh secret set "$secret_name"
    echo -e "${GREEN}✅ Secret $secret_name configured${NC}"
}

# Function to create a GitHub Projects token
create_projects_token() {
    echo -e "${YELLOW}📝 Creating GitHub Projects token...${NC}"
    echo ""
    echo "To enable GitHub Projects automation, you need a Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select scopes: repo, project, read:org"
    echo "4. Copy the generated token"
    echo ""
    read -p "Enter your GitHub Projects token (or 'skip' to skip): " projects_token
    set_secret_safe "PROJECT_TOKEN" "$projects_token"
}

# Main setup function
main() {
    check_gh_cli
    
    echo -e "${BLUE}🔧 Starting integration setup...${NC}"
    echo ""
    
    # GitHub Projects token (essential for automation)
    create_projects_token
    
    echo ""
    echo -e "${GREEN}✅ Basic integration setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Set up third-party integrations manually:"
    echo "   - Codecov: https://codecov.io"
    echo "   - SonarCloud: https://sonarcloud.io"
    echo ""
    echo "2. Configure branch protection via GitHub web interface:"
    echo "   - Visit: https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/settings/branches"
    echo ""
    echo "3. Review the manual setup guide:"
    echo "   - See: .github/MANUAL_SETUP_GUIDE.md"
    echo ""
    echo -e "${BLUE}🧪 Test your setup by creating a pull request!${NC}"
}

# Run main function
main
