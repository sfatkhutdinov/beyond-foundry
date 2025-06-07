# Manual GitHub Configuration Guide

Since some GitHub configurations require manual setup via the web interface, this guide provides step-by-step instructions for completing your repository setup.

## 🛡️ Branch Protection Rules (Manual Setup Required)

### Why Manual Setup?
The GitHub CLI has compatibility issues with the current branch protection API format. Manual setup ensures proper configuration.

### Steps to Configure:

1. **Navigate to Branch Protection**
   - Go to: https://github.com/sfatkhutdinov/beyond-foundry/settings/branches
   - Click "Add rule" or "Edit" for the `main` branch

2. **Configure Protection Rules**
   ```
   ✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale PR reviews when new commits are pushed
   ✅ Require review from code owners (if CODEOWNERS file exists)
   
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Status checks to require:
   - ci / test
   - coverage / upload
   - security / codeql
   
   ✅ Require conversation resolution before merging
   ✅ Restrict pushes that create files larger than 100 MB
   ✅ Do not allow bypassing the above settings
   ✅ Include administrators
   ```

3. **Save the Rule**
   - Click "Create" or "Save changes"

## 🔗 Third-Party Integrations

### 1. Codecov Setup (Code Coverage)

1. **Visit Codecov**
   - Go to: https://codecov.io
   - Sign in with your GitHub account

2. **Add Repository**
   - Find and select `sfatkhutdinov/beyond-foundry`
   - Copy the repository upload token

3. **Configure Secret**
   ```bash
   gh secret set CODECOV_TOKEN --body "YOUR_CODECOV_TOKEN"
   ```

### 2. SonarCloud Setup (Code Quality)

1. **Visit SonarCloud**
   - Go to: https://sonarcloud.io
   - Sign in with your GitHub account

2. **Import Repository**
   - Choose "Import a GitHub repository"
   - Select `sfatkhutdinov/beyond-foundry`
   - Choose "With GitHub Actions"

3. **Configure Secret**
   ```bash
   gh secret set SONAR_TOKEN --body "YOUR_SONAR_TOKEN"
   ```

4. **Add SonarCloud Properties**
   Create `sonar-project.properties`:
   ```properties
   sonar.projectKey=sfatkhutdinov_beyond-foundry
   sonar.organization=sfatkhutdinov
   sonar.sources=src
   sonar.tests=tests
   sonar.javascript.lcov.reportPaths=coverage/lcov.info
   sonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/node_modules/**
   ```

### 3. Snyk Setup (Security Scanning)

1. **Visit Snyk**
   - Go to: https://snyk.io
   - Sign in with your GitHub account

2. **Add Project**
   - Import `sfatkhutdinov/beyond-foundry`
   - Get your authentication token from account settings

3. **Configure Secret**
   ```bash
   gh secret set SNYK_TOKEN --body "YOUR_SNYK_TOKEN"
   ```

### 4. GitHub Projects Token

1. **Create Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes needed: `repo`, `project`, `read:org`

2. **Configure Secret**
   ```bash
   gh secret set PROJECT_TOKEN --body "YOUR_PAT_TOKEN"
   ```

## 🔔 Optional Notification Integrations

### Discord Webhook (Optional)
1. Create a webhook in your Discord server
2. Add the webhook URL:
   ```bash
   gh secret set DISCORD_WEBHOOK_URL --body "YOUR_DISCORD_WEBHOOK_URL"
   ```

### Slack Webhook (Optional)
1. Create a webhook in your Slack workspace
2. Add the webhook URL:
   ```bash
   gh secret set SLACK_WEBHOOK_URL --body "YOUR_SLACK_WEBHOOK_URL"
   ```

## ✅ Verification Steps

After completing setup:

1. **Test Branch Protection**
   - Create a test branch
   - Make a small change
   - Create a pull request
   - Verify protection rules are enforced

2. **Test Workflows**
   - Push a commit to trigger CI
   - Check workflow runs in Actions tab
   - Verify integrations are working

3. **Check Integration Dashboards**
   - Codecov: Coverage reports appearing
   - SonarCloud: Quality analysis running
   - Snyk: Security scans executing

## 🆘 Troubleshooting

### Common Issues:
- **Secrets not working**: Ensure exact secret names match workflow files
- **Status checks failing**: Verify secret tokens have correct permissions
- **Branch protection bypassed**: Check "Include administrators" is enabled

### Getting Help:
- Check workflow logs in GitHub Actions
- Review integration documentation
- Create an issue in the repository

## 📋 Completion Checklist

- [ ] Branch protection rules configured
- [ ] Codecov integration active
- [ ] SonarCloud analysis running
- [ ] Snyk security scanning enabled
- [ ] GitHub Projects token configured
- [ ] Test PR created and protection verified
- [ ] All workflow integrations tested

Once complete, your repository will have full automation and protection!
