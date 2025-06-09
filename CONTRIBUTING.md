# Contributing Guide

## Code Standards
- TypeScript required
- Modular, documented code
- Error handling is mandatory

## Process
1. Fork the repo
2. Branch off `main`
3. Open a PR with clear description

## Automated Issue Management

This project uses automation to:
- Create GitHub issues for actionable TODO/FIXME comments and parser errors
- Deduplicate and close issues as TODOs are resolved
- Label and assign issues based on file path and CODEOWNERS
- Update the changelog and generate a TODO summary dashboard

### How It Works
- On every push to main, the automation script scans the codebase for actionable TODO/FIXME comments and parser errors.
- Issues are created, labeled, and assigned automatically.
- When a TODO is removed, the corresponding issue is closed and the changelog is updated.
- A summary dashboard is generated in `TODO_SUMMARY.md`.

### Customization
- To change what counts as an actionable TODO, edit the regex in `scripts/auto-create-issues.js`.
- To add or change labels, update the `getLabelsForTodo` function.
- To change assignment, edit `.github/CODEOWNERS`.

### Running Locally
- Set the `GH_PAT` environment variable.
- Run: `node scripts/auto-create-issues.js`

### PR TODO Detection
- On every PR, the workflow scans all changed files for actionable TODO/FIXME comments.
- Supports: .js, .ts, .jsx, .tsx, .cjs, .mjs, .py, .sh, .md
- Uses fuzzy matching to detect edited TODOs (not just exact matches).
- If new actionable TODOs/FIXMEs are found, a warning comment is posted on the PR and the check fails.
- See `.github/workflows/pr-todo-detection.yml` and `scripts/pr-todo-detect.js` for details.

### Questions?
See [docs/automation.md](./docs/automation.md) or open an issue.
