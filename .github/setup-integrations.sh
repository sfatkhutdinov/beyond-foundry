#!/bin/bash

# Third-party Integrations Setup Script
# This script helps configure external services for GitHub automation

set -e

echo "🔧 Setting up third-party integrations for Beyond Foundry..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this from your project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 This script will guide you through setting up integrations for:${NC}"
echo "   - Codecov (Code Coverage)"
echo "   - SonarCloud (Code Quality)"
echo "   - Discord/Slack (Notifications)"
echo ""

# Function to check if a secret exists
check_secret() {
    local secret_name=$1
    if gh secret list | grep -q "$secret_name"; then
        echo -e "${GREEN}✓ $secret_name already configured${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ $secret_name not configured${NC}"
        return 1
    fi
}

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo -e "${BLUE}Setting up $secret_name...${NC}"
    echo "$secret_description"
    echo -n "Enter the value for $secret_name (or press Enter to skip): "
    read -r secret_value
    
    if [ -n "$secret_value" ]; then
        gh secret set "$secret_name" --body "$secret_value"
        echo -e "${GREEN}✓ $secret_name configured successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped $secret_name${NC}"
    fi
    echo ""
}

echo -e "${BLUE}🔍 Checking current secret configuration...${NC}"

# Check existing secrets
check_secret "CODECOV_TOKEN"
check_secret "SONAR_TOKEN"
check_secret "PROJECT_TOKEN"
check_secret "NPM_TOKEN"
check_secret "DISCORD_WEBHOOK_URL"
check_secret "SLACK_WEBHOOK_URL"

echo ""
echo -e "${BLUE}🚀 Setting up integrations...${NC}"

# Codecov setup
if ! check_secret "CODECOV_TOKEN"; then
    echo -e "${BLUE}📊 Codecov Setup${NC}"
    echo "1. Visit https://codecov.io"
    echo "2. Sign in with GitHub"
    echo "3. Add your repository: sfatkhutdinov/beyond-foundry"
    echo "4. Copy the upload token from repository settings"
    set_secret "CODECOV_TOKEN" "Codecov upload token for code coverage reporting"
fi

# SonarCloud setup
if ! check_secret "SONAR_TOKEN"; then
    echo -e "${BLUE}🔍 SonarCloud Setup${NC}"
    echo "1. Visit https://sonarcloud.io"
    echo "2. Sign in with GitHub"
    echo "3. Create a new project for beyond-foundry"
    echo "4. Generate a token in User Settings > Security"
    set_secret "SONAR_TOKEN" "SonarCloud token for code quality analysis"
fi

# Project token setup
if ! check_secret "PROJECT_TOKEN"; then
    echo -e "${BLUE}📋 GitHub Project Token${NC}"
    echo "1. Go to GitHub Settings > Developer settings > Personal access tokens"
    echo "2. Create a token with 'repo' and 'project' scopes"
    set_secret "PROJECT_TOKEN" "GitHub Personal Access Token with project permissions"
fi

# NPM token setup (optional)
if ! check_secret "NPM_TOKEN"; then
    echo -e "${BLUE}📦 NPM Token (Optional)${NC}"
    echo "1. Visit https://www.npmjs.com"
    echo "2. Go to Account Settings > Access Tokens"
    echo "3. Generate a publish token"
    set_secret "NPM_TOKEN" "NPM publish token (optional, for package publishing)"
fi

# Discord webhook setup (optional)
if ! check_secret "DISCORD_WEBHOOK_URL"; then
    echo -e "${BLUE}💬 Discord Webhook (Optional)${NC}"
    echo "1. Open Discord server settings"
    echo "2. Go to Integrations > Webhooks"
    echo "3. Create a webhook and copy the URL"
    set_secret "DISCORD_WEBHOOK_URL" "Discord webhook URL for notifications (optional)"
fi

# Slack webhook setup (optional)
if ! check_secret "SLACK_WEBHOOK_URL"; then
    echo -e "${BLUE}💼 Slack Webhook (Optional)${NC}"
    echo "1. Go to your Slack workspace"
    echo "2. Create an incoming webhook app"
    echo "3. Copy the webhook URL"
    set_secret "SLACK_WEBHOOK_URL" "Slack webhook URL for notifications (optional)"
fi

echo -e "${GREEN}🎉 Integration setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Configure SonarCloud project settings if you added the token"
echo "2. Test workflows by creating a pull request"
echo "3. Monitor the Actions tab for workflow execution"
echo "4. Check integration dashboards (Codecov, SonarCloud, etc.)"
echo ""
echo -e "${BLUE}📚 For detailed setup instructions, see:${NC}"
echo "   .github/SECRETS_SETUP.md"
echo ""
echo -e "${GREEN}✅ Your repository is now fully configured for automated workflows!${NC}"
