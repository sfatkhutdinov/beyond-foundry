#!/bin/bash

# GitHub Setup Automation Script for Beyond Foundry
# This script helps set up GitHub repository secrets and configuration

echo "🚀 Beyond Foundry - GitHub Setup Assistant"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found${NC}"
    echo "Please install GitHub CLI: https://cli.github.com/"
    echo "macOS: brew install gh"
    exit 1
fi

# Check if user is logged in
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not logged into GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}"

# Function to check if secret exists
check_secret() {
    local secret_name=$1
    if gh secret list | grep -q "$secret_name"; then
        echo -e "${GREEN}✅ Secret $secret_name already exists${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Secret $secret_name not found${NC}"
        return 1
    fi
}

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ Empty value for $secret_name${NC}"
        return 1
    fi
    
    echo "$secret_value" | gh secret set "$secret_name"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Set secret $secret_name${NC}"
    else
        echo -e "${RED}❌ Failed to set secret $secret_name${NC}"
    fi
}

echo ""
echo "🔐 Checking Repository Secrets..."

# Check for required secrets
check_secret "GH_PAT"

# If GH_PAT doesn't exist, help user create it
if ! check_secret "GH_PAT"; then
    echo ""
    echo -e "${YELLOW}📝 GH_PAT (Personal Access Token) Setup Required${NC}"
    echo ""
    echo "To create a Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select these scopes:"
    echo "   - repo (Full control of private repositories)"
    echo "   - write:packages (Write packages)"
    echo "   - workflow (Update GitHub Action workflows)"
    echo "4. Copy the generated token"
    echo ""
    read -p "Enter your Personal Access Token (or press Enter to skip): " pat_token
    
    if [ ! -z "$pat_token" ]; then
        set_secret "GH_PAT" "$pat_token"
    else
        echo -e "${YELLOW}⚠️ Skipped GH_PAT setup${NC}"
    fi
fi

echo ""
echo "🏷️ Setting up Repository Topics..."

# Set repository topics
gh repo edit --add-topic "foundry-vtt"
gh repo edit --add-topic "dnd-beyond"
gh repo edit --add-topic "dungeons-and-dragons"
gh repo edit --add-topic "typescript"
gh repo edit --add-topic "foundry-module"
gh repo edit --add-topic "dnd5e"

echo -e "${GREEN}✅ Repository topics updated${NC}"

echo ""
echo "📝 Setting Repository Description..."

# Update repository description
gh repo edit --description "Import your purchased D&D Beyond content into FoundryVTT with ease. Features character import, spell/item sync, and seamless integration with the D&D 5e system."

echo -e "${GREEN}✅ Repository description updated${NC}"

echo ""
echo "🔧 Repository Setup Commands..."
echo ""
echo "To complete setup, run these commands manually:"
echo ""
echo -e "${YELLOW}# Enable branch protection (requires admin access)${NC}"
echo "gh api repos/sfatkhutdinov/beyond-foundry/branches/main/protection \\"
echo "  --method PUT \\"
echo "  --field required_status_checks='{\"strict\":true,\"contexts\":[\"CI/CD Pipeline\"]}' \\"
echo "  --field enforce_admins=true \\"
echo "  --field required_pull_request_reviews='{\"required_approving_review_count\":1}' \\"
echo "  --field restrictions=null"
echo ""
echo -e "${YELLOW}# View current repository settings${NC}"
echo "gh repo view --web"

echo ""
echo -e "${GREEN}🎉 GitHub setup assistance complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Check GitHub Actions are working: https://github.com/sfatkhutdinov/beyond-foundry/actions"
echo "2. Review repository settings: https://github.com/sfatkhutdinov/beyond-foundry/settings"
echo "3. Set up branch protection rules manually if needed"
echo "4. Test workflows by creating a test PR"

echo ""
echo -e "${GREEN}✅ Your Beyond Foundry repository is ready for development!${NC}"
