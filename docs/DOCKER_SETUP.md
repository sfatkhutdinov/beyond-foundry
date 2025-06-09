# Docker Setup Guide for Beyond Foundry

This guide explains how to run Beyond Foundry and its required proxy (ddb-proxy) using Docker.

## Prerequisites
- Docker installed on your system
- D&D Beyond account with purchased content

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/sfatkhutdinov/beyond-foundry.git
   cd beyond-foundry
   ```
2. Start the services:
   ```bash
   docker-compose up -d
   ```
   This will start both Beyond Foundry and ddb-proxy containers.

3. Access FoundryVTT and configure the module:
   - Open FoundryVTT in your browser
   - Go to the Beyond Foundry module settings
   - Set the proxy URL to `http://localhost:4000`
   - Enter your D&D Beyond authentication token (Cobalt cookie)

## Customization
- Edit `docker-compose.yml` to change ports or volumes.
- For advanced proxy configuration, see `beyond-foundry-proxy/README.md`.

## Troubleshooting
- If you encounter issues, check logs with:
  ```bash
  docker-compose logs
  ```
- Ensure your D&D Beyond session is valid.

## References
- [ddb-proxy GitHub](https://github.com/MrPrimate/ddb-proxy)
- [FoundryVTT Documentation](https://foundryvtt.com/)
