# GitHub Secrets Configuration

This document describes the GitHub secrets that need to be configured for the Beyond Foundry workflows to function properly.

## Required Secrets

### PROJECT_TOKEN
- **Used in**: `project-management.yml`
- **Purpose**: GitHub Personal Access Token for managing project boards
- **Permissions needed**: 
  - `project:write` - To update project boards
  - `repo:read` - To read repository information
- **Setup**: 
  1. Go to GitHub Settings > Developer settings > Personal access tokens
  2. Generate a new token with the required permissions
  3. Add it as a repository secret named `PROJECT_TOKEN`

## Optional Secrets

### DDB_COBALT_TOKEN
- **Used in**: Test files for integration testing
- **Purpose**: D&D Beyond authentication token for live API testing
- **Setup**: Extract from D&D Beyond session cookies
- **Note**: Only needed for running integration tests with real D&D Beyond data

### DDB_CHARACTER_ID
- **Used in**: Test files for character import testing
- **Purpose**: A valid D&D Beyond character ID for testing
- **Setup**: Get from a D&D Beyond character URL
- **Note**: Only needed for running integration tests

## Workflow Behavior Without Secrets

- **Without PROJECT_TOKEN**: Project management automation will be disabled
- **Without DDB tokens**: Integration tests will be skipped but unit tests will still run

## Security Considerations

- Never commit secrets to the repository
- Use repository secrets for sensitive tokens
- Consider using environment-specific secrets for different deployment stages
- Regularly rotate tokens and update secrets accordingly
