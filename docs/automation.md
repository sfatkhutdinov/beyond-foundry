# Automation and Issue Management

This project uses advanced automation to track, manage, and resolve TODO/FIXME comments and parser errors. The following features are provided:

- **Automatic GitHub Issue Creation** for actionable TODO/FIXME comments and parser errors
- **Deduplication** using a unique hash for each TODO
- **Automatic Issue Closing** when TODOs are removed
- **Contextual Labeling** of issues based on file path and content
- **Changelog Automation**: Resolved TODOs/FIXMEs are appended to the latest release in CHANGELOG.md
- **Summary Dashboard**: All open TODOs/FIXMEs are listed in TODO_SUMMARY.md, grouped by label
- **PR TODO Detection (Planned)**: PRs introducing new TODOs will be flagged in review comments

## Usage

- The automation runs on every push to main and can be triggered manually via GitHub Actions.
- To run locally, set the `GH_PAT` environment variable and execute:
  ```sh
  node scripts/auto-create-issues.js
  ```

## Extending Automation

- To customize actionable TODO patterns, edit the regex in `findTodos`.
- To add more labels, update `getLabelsForTodo`.
- For PR TODO detection, see the stub functions in the script for future workflow integration.

## PR TODO/FIXME Detection Workflow

Beyond Foundry uses a GitHub Actions workflow to detect actionable TODO/FIXME comments introduced in pull requests.

- **Supported file types:** .js, .ts, .jsx, .tsx, .cjs, .mjs, .py, .sh, .md
- **Fuzzy matching:** The detection script uses Levenshtein distance to catch edited TODOs, not just exact matches.
- **Workflow:**
  - On every PR, changed files are scanned for new actionable TODO/FIXME comments.
  - If any are found, a warning comment is posted on the PR and the check fails.
  - See `.github/workflows/pr-todo-detection.yml` and `scripts/pr-todo-detect.js` for implementation.
- **Customization:**
  - To add file types, edit the `supportedExtensions` array in `scripts/pr-todo-detect.js`.
  - To adjust fuzzy matching, change the threshold in the `fuzzyMatch` function.

This ensures all technical debt is visible and reviewed before merging.

## See Also
- [TODO_SUMMARY.md](./TODO_SUMMARY.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
