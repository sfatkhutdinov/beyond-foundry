# Beyond Foundry User Guide

Welcome to Beyond Foundry! This guide will help you get started importing your D&D Beyond content into FoundryVTT.

## Getting Started
1. Install the Beyond Foundry module in FoundryVTT.
2. (Recommended) Set up ddb-proxy using Docker (see [DOCKER_SETUP.md](./DOCKER_SETUP.md)).
3. Obtain your D&D Beyond authentication token (Cobalt cookie).
4. In FoundryVTT, open the Beyond Foundry settings:
   - Enter the proxy URL (default: `http://localhost:4000`)
   - Paste your authentication token
5. Save settings and reload FoundryVTT if prompted.

## Importing Content
- **Characters**: Use the import dialog to enter a character ID or select from your account.
- **Spells, Items, Monsters**: Use the bulk import interface to import by type or compendium.
- **Manual Import**: Enter IDs directly for advanced use cases.

## Troubleshooting
- Ensure your proxy is running and accessible.
- Double-check your authentication token is valid.
- See [testing.md](./testing.md) for more help.

## More Information
- [Development Status](./development-status.md)
- [Roadmap](./roadmap.md)
- [Automation](./automation.md)
