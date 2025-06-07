# Repository Settings Configuration
# This file documents the recommended GitHub repository settings
# These settings should be applied manually in the GitHub repository settings

## General Settings
- Repository name: beyond-foundry
- Description: "Import your purchased D&D Beyond content into FoundryVTT with ease"
- Website: https://your-username.github.io/beyond-foundry
- Topics: foundry, dnd, dnd-beyond, module, typescript, tabletop, rpg

## Features
- [x] Wikis
- [x] Issues  
- [x] Discussions
- [x] Projects
- [x] Preserve this repository
- [x] Sponsorships

## Pull Requests
- [x] Allow merge commits
- [x] Allow squash merging
- [x] Allow rebase merging
- [x] Always suggest updating pull request branches
- [x] Allow auto-merge
- [x] Automatically delete head branches

## Branch Protection Rules

### Main Branch (main)
- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale reviews when new commits are pushed
  - [x] Require review from code owners
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - CI/CD Pipeline / lint
    - CI/CD Pipeline / test  
    - CI/CD Pipeline / build
    - Security Analysis / codeql
    - Quality Assurance / code-quality
- [x] Require conversation resolution before merging
- [x] Require signed commits
- [x] Include administrators
- [x] Restrict pushes that create files that do not exist

### Develop Branch (develop)
- [x] Require a pull request before merging
  - [x] Require approvals: 1
- [x] Require status checks to pass before merging
  - Required status checks:
    - CI/CD Pipeline / lint
    - CI/CD Pipeline / test

## Repository Security

### Security Analysis
- [x] Dependency graph
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Code scanning alerts
- [x] Secret scanning alerts

### Secrets
Required secrets to add:
- CODECOV_TOKEN: Token for code coverage reporting
- SONAR_TOKEN: Token for SonarCloud analysis
- PROJECT_TOKEN: GitHub project management token
- NPM_TOKEN: NPM publishing token (if publishing to NPM)
- SLACK_WEBHOOK_URL: Slack notifications (optional)
- SNYK_TOKEN: Snyk security scanning token

## Pages
- Source: Deploy from a branch
- Branch: gh-pages / root
- Build and deployment: GitHub Actions

## Environments
Create the following environments:
1. **staging**
   - Required reviewers: [maintainer]
   - Deployment protection rules: [x] Required reviewers
   
2. **production**  
   - Required reviewers: [maintainer]
   - Deployment protection rules: [x] Required reviewers
   - Environment secrets: Production-specific tokens

## Labels
The following labels should be created:

### Type Labels
- bug (🐛): Something isn't working - #d73a4a
- enhancement (✨): New feature or request - #a2eeef  
- documentation (📚): Improvements or additions to documentation - #0075ca
- question (❓): Further information is requested - #d876e3
- wontfix (🚫): This will not be worked on - #ffffff

### Priority Labels  
- priority:low (🔵): Low priority - #0e8a16
- priority:medium (🟡): Medium priority - #fbca04
- priority:high (🔴): High priority - #b60205
- priority:critical (💥): Critical priority - #d93f0b

### Component Labels
- character-import (👤): Issues related to character importing - #1d76db
- spell-import (🪄): Issues related to spell importing - #5319e7
- monster-import (🐲): Issues related to monster importing - #0075ca
- authentication (🔐): Issues related to authentication - #f9d0c4
- ui (🎨): User interface related - #e99695
- api (⚙️): API related - #7057ff
- parser (🔧): Data parsing related - #ffffff

### Status Labels
- needs-triage (🏷️): Needs initial review - #ededed
- needs-review (👀): Needs code review - #fbca04
- in-progress (🚧): Currently being worked on - #0075ca
- blocked (🚫): Blocked by external dependency - #d93f0b
- ready-to-merge (✅): Ready to be merged - #0e8a16

### Version Labels
- foundry-v11: Compatible with FoundryVTT v11 - #c2e0c6
- foundry-v12: Compatible with FoundryVTT v12 - #bfdadc
- foundry-v13: Compatible with FoundryVTT v13 - #d4c5f9

### Special Labels
- good-first-issue (🌱): Good for newcomers - #7057ff
- help-wanted (🤝): Extra attention is needed - #008672
- dependencies (📦): Dependency updates - #0366d6
- automated (🤖): Automated issue/PR - #ffffff
- project-health (📊): Project health tracking - #0e8a16
