# GitHub Secrets Configuration Guide

This guide walks you through setting up all required secrets for the Beyond Foundry GitHub automation features.

## Required Secrets

### 1. Code Coverage - Codecov
```bash
# Visit https://codecov.io and connect your GitHub repository
# Copy the repository token from the settings page
CODECOV_TOKEN=your_codecov_token_here
```

### 2. Code Quality - SonarCloud
```bash
# Visit https://sonarcloud.io and create a new project
# Generate a token in User Settings > Security
SONAR_TOKEN=your_sonar_token_here
SONAR_PROJECT_KEY=sfatkhutdinov_beyond-foundry  # Usually org_repo format
```

### 3. Security Scanning - Snyk (Optional)
```bash
# Visit https://snyk.io and get your API token
SNYK_TOKEN=your_snyk_token_here
```

### 4. Project Management Token
```bash
# Create a GitHub Personal Access Token with project permissions
# Required scopes: repo, project
PROJECT_TOKEN=your_project_token_here
```

### 5. Package Publishing (Optional)
```bash
# NPM publishing token if you want to publish to NPM registry
NPM_TOKEN=your_npm_token_here
```

### 6. Discord Notifications (Optional)
```bash
# Discord webhook URL for notifications
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
```

### 7. Slack Notifications (Optional)
```bash
# Slack webhook URL for notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

## Adding Secrets to GitHub

### Using GitHub CLI (Recommended)
```bash
# Add secrets using GitHub CLI
gh secret set CODECOV_TOKEN --body "your_token_here"
gh secret set SONAR_TOKEN --body "your_token_here"
gh secret set PROJECT_TOKEN --body "your_token_here"
```

### Using GitHub Web Interface
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add each secret name and value

## Environment Setup

The workflows are configured to use these environments:
- **staging**: For testing deployments
- **production**: For live releases

You can add environment-specific secrets by:
1. Going to **Settings** > **Environments**
2. Selecting the environment (staging/production)
3. Adding secrets specific to that environment

## Integration Setup

### Codecov Setup
1. Visit [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token
5. Add as `CODECOV_TOKEN` secret

### SonarCloud Setup
1. Visit [sonarcloud.io](https://sonarcloud.io)
2. Sign in with GitHub
3. Create new project
4. Choose "With GitHub Actions"
5. Follow the setup instructions
6. Add the token as `SONAR_TOKEN`

### Snyk Setup (Optional)
1. Visit [snyk.io](https://snyk.io)
2. Sign up and connect GitHub
3. Get your API token from settings
4. Add as `SNYK_TOKEN` secret

## Verification

After adding secrets, you can verify the setup by:

1. **Triggering a workflow**: Push a change or manually trigger a workflow
2. **Checking workflow logs**: Look for successful authentication with services
3. **Monitoring integrations**: Check that coverage reports, security scans work

## Troubleshooting

### Common Issues

1. **Invalid Token**: Make sure tokens haven't expired
2. **Wrong Permissions**: Ensure tokens have required scopes
3. **Service Integration**: Check that services are properly connected to your repository

### Getting Help

- Check workflow logs for specific error messages
- Review service documentation for token setup
- Create an issue in the repository for additional support

## Security Best Practices

1. **Regular Rotation**: Rotate tokens periodically
2. **Minimal Permissions**: Use tokens with minimal required permissions
3. **Monitor Usage**: Review secret usage in workflow logs
4. **Environment Separation**: Use different tokens for staging/production

---

**Next Steps**: After setting up secrets, test the workflows by creating a pull request or pushing changes to verify all integrations work correctly.
