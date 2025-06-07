# GitHub Features Setup Script
#!/bin/bash

# This script helps set up GitHub features for the Beyond Foundry repository
# Run this after creating your GitHub repository

set -e

echo "🚀 Setting up GitHub features for Beyond Foundry..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this from your project root."
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Please authenticate with GitHub CLI first:"
    gh auth login
fi

# Get repository info
REPO_OWNER=$(gh repo view --json owner --jq .owner.login)
REPO_NAME=$(gh repo view --json name --jq .name)

echo "📋 Setting up repository: $REPO_OWNER/$REPO_NAME"

# Enable repository features
echo "🔧 Enabling repository features..."
gh repo edit --enable-issues=true
gh repo edit --enable-wiki=true
gh repo edit --enable-projects=true
gh repo edit --enable-discussions=true

# Create labels
echo "🏷️  Creating labels..."

# Type labels
gh label create "bug" --description "Something isn't working" --color "d73a4a" --force
gh label create "enhancement" --description "New feature or request" --color "a2eeef" --force
gh label create "documentation" --description "Improvements or additions to documentation" --color "0075ca" --force
gh label create "question" --description "Further information is requested" --color "d876e3" --force

# Priority labels
gh label create "priority:low" --description "Low priority" --color "0e8a16" --force
gh label create "priority:medium" --description "Medium priority" --color "fbca04" --force
gh label create "priority:high" --description "High priority" --color "b60205" --force
gh label create "priority:critical" --description "Critical priority" --color "d93f0b" --force

# Component labels
gh label create "character-import" --description "Issues related to character importing" --color "1d76db" --force
gh label create "spell-import" --description "Issues related to spell importing" --color "5319e7" --force
gh label create "monster-import" --description "Issues related to monster importing" --color "0075ca" --force
gh label create "authentication" --description "Issues related to authentication" --color "f9d0c4" --force
gh label create "ui" --description "User interface related" --color "e99695" --force
gh label create "api" --description "API related" --color "7057ff" --force
gh label create "parser" --description "Data parsing related" --color "ffffff" --force

# Status labels
gh label create "needs-triage" --description "Needs initial review" --color "ededed" --force
gh label create "needs-review" --description "Needs code review" --color "fbca04" --force
gh label create "in-progress" --description "Currently being worked on" --color "0075ca" --force
gh label create "blocked" --description "Blocked by external dependency" --color "d93f0b" --force
gh label create "ready-to-merge" --description "Ready to be merged" --color "0e8a16" --force

# Version labels
gh label create "foundry-v11" --description "Compatible with FoundryVTT v11" --color "c2e0c6" --force
gh label create "foundry-v12" --description "Compatible with FoundryVTT v12" --color "bfdadc" --force
gh label create "foundry-v13" --description "Compatible with FoundryVTT v13" --color "d4c5f9" --force

# Special labels
gh label create "good-first-issue" --description "Good for newcomers" --color "7057ff" --force
gh label create "help-wanted" --description "Extra attention is needed" --color "008672" --force
gh label create "dependencies" --description "Dependency updates" --color "0366d6" --force
gh label create "automated" --description "Automated issue/PR" --color "ffffff" --force
gh label create "project-health" --description "Project health tracking" --color "0e8a16" --force

# Create milestones
echo "🎯 Creating milestones..."
gh api repos/$REPO_OWNER/$REPO_NAME/milestones -f title="v1.0.0 - Core Features" -f description="Basic character and spell importing functionality" -f due_on="$(date -v +3m -u +%Y-%m-%dT%H:%M:%SZ)" || true
gh api repos/$REPO_OWNER/$REPO_NAME/milestones -f title="v1.1.0 - Enhanced Features" -f description="Monster importing, advanced character features" -f due_on="$(date -v +6m -u +%Y-%m-%dT%H:%M:%SZ)" || true
gh api repos/$REPO_OWNER/$REPO_NAME/milestones -f title="v2.0.0 - Adventure Support" -f description="Full adventure importing and advanced features" -f due_on="$(date -v +9m -u +%Y-%m-%dT%H:%M:%SZ)" || true

# Create a project
echo "📊 Creating project..."
gh project create --title "Beyond Foundry Development" || true

# Set up branch protection
echo "🛡️  Setting up branch protection..."
gh api repos/$REPO_OWNER/$REPO_NAME/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI/CD Pipeline / lint","CI/CD Pipeline / test","CI/CD Pipeline / build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null || true

# Create environments
echo "🌍 Creating environments..."
gh api repos/$REPO_OWNER/$REPO_NAME/environments/staging --method PUT --field wait_timer=0 || true
gh api repos/$REPO_OWNER/$REPO_NAME/environments/production --method PUT --field wait_timer=0 || true

# Enable Pages
echo "📄 Enabling GitHub Pages..."
gh api repos/$REPO_OWNER/$REPO_NAME/pages --method POST --raw-field source='{"branch":"gh-pages","path":"/"}' || true

# Create initial discussion categories
echo "💬 Setting up discussions..."
gh api graphql -f query='
mutation {
  createDiscussionCategory(input: {
    repositoryId: "'$(gh repo view --json id --jq .id)'"
    name: "General"
    description: "General discussions about Beyond Foundry"
    emoji: ":speech_balloon:"
  }) {
    discussionCategory {
      id
    }
  }
}' || true

gh api graphql -f query='
mutation {
  createDiscussionCategory(input: {
    repositoryId: "'$(gh repo view --json id --jq .id)'"
    name: "Help & Support"
    description: "Get help with using Beyond Foundry"
    emoji: ":question:"
  }) {
    discussionCategory {
      id
    }
  }
}' || true

gh api graphql -f query='
mutation {
  createDiscussionCategory(input: {
    repositoryId: "'$(gh repo view --json id --jq .id)'"
    name: "Feature Requests"
    description: "Suggest new features for Beyond Foundry"
    emoji: ":bulb:"
  }) {
    discussionCategory {
      id
    }
  }
}' || true

# Set repository topics
echo "🏷️  Setting repository topics..."
gh repo edit --add-topic foundry,dnd,dnd-beyond,module,typescript,tabletop,rpg

echo "✅ GitHub features setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add required secrets in repository settings:"
echo "   - CODECOV_TOKEN"
echo "   - SONAR_TOKEN"
echo "   - PROJECT_TOKEN"
echo "   - NPM_TOKEN (if publishing to NPM)"
echo ""
echo "2. Enable Dependabot in repository settings"
echo "3. Set up SonarCloud integration"
echo "4. Configure Codecov integration"
echo "5. Review and adjust branch protection rules"
echo ""
echo "🎉 Your repository is now ready for maximum GitHub productivity!"
