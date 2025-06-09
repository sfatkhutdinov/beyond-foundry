# UI Components

## Key Interfaces
- [x] Import Wizard (CharacterImportDialog)
- [x] Authentication Settings (AuthDialog)
- [x] Spell Import Options (complete)
- [ ] Conflict Resolution Modal (planned)
- [x] Bulk Import Dialog (planned)

## Status
- Import and authentication dialogs are implemented and in use
- Spell import dialog supports preparation modes and bulk import
- UI follows Foundry's Application API and Handlebars templates
- Progress feedback and error handling are present
- Bulk import and conflict resolution UI are planned for future phases
- All UI tested with Docker-based deployment and robust endpoint integration

## Guidelines
- Use Foundry's Application API
- Provide user feedback for long tasks
- Follow accessibility and usability best practices
- Ensure robust error handling and progress reporting

## TODO
- Add screenshots or UI mockups for each dialog
- Document UI event flows and customization options

# User Interface (UI)

This document describes the current UI features and dialogs available in Beyond Foundry.

## Import Wizard
- Guides users through importing content from D&D Beyond.
- Allows selection of content type (characters, monsters, spells, items, etc.).
- Progress indicators for long-running imports.
- Spell import dialog supports preparation modes and bulk import.

## Authentication Dialog
- Prompts for authentication with D&D Beyond (via proxy or session cookie).
- Provides error feedback for failed authentication.

## Manual Character ID Input (New)
- Users can manually enter a D&D Beyond character ID for direct import.
- Useful for advanced users or troubleshooting import issues.

## Bulk Import Dialog (New)
- Allows batch import of multiple items, spells, or monsters.
- Supports filtering and selection of content to import in bulk.
- Displays progress and error reporting for each item in the batch.

## Sync Conflict Resolution
- UI for resolving conflicts when imported content differs from existing Foundry data.
- Options to overwrite, merge, or skip conflicting entries.

## Error Reporting
- All dialogs provide clear error messages and guidance for resolving issues.
- Robust error handling and logging for all endpoints.

## Settings & Configuration
- Module configuration dialog for authentication, import preferences, and advanced options.

---

## UI Walkthroughs & Screenshots (Planned)

Screenshots and step-by-step walkthroughs for all major UI dialogs will be added in a future update. This will include:
- Import Wizard: step-by-step import process
- Authentication Dialog: setup and troubleshooting
- Bulk Import Dialog: batch import workflow
- Conflict Resolution Modal: (planned)

For current UI status, see the [development-status.md](development-status.md) checklist.

---

## Notes
- All UI dialogs are implemented using the FoundryVTT Applications API and Handlebars templates.
- For UI extension or customization, see the templates/ directory and FoundryVTT API documentation.
- UI tested with Docker-based deployment and endpoint tests.
