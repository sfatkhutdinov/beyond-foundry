# ddb-proxy

This proxy allows for communication with DDB for use integrating content into Foundry VTT.

It provides the following backend functionality for [ddb-importer](https://github.com/MrPrimate/ddb-importer)

* Characters
* Spells
* Items
* Monsters


## Setup

This proxy is updated to work with the latest version of DDB Importer as quickly as possible.

Run this as a [nodeJS](https://nodejs.org/en/) app the standard way.

Install:

```
yarn install
```

Run:

```
node index.js
```

You can also run this as a docker image, for details see [Docker instructions](docker/README.md)

It _must_ be proxied behind a service providing an SSL/TLS encryption if you are not running on your local machine. I would recommend [Caddy](https://caddyserver.com/).

If using DDB Importer v3.1.26 or higher you can enable the custom proxy and change the endpoint address in the settings menu.
> Note: the endpoint address should not have a forward slash at the end. For example: http://example.com:3000 rather than http://exampole.com:3000/

If using an earlier version, in Foundry's developer console or the web browser's developer console (depending on how you're hosting Foundry) run the following commands:

```javascript
game.settings.set("ddb-importer", "custom-proxy", true);
game.settings.set("ddb-importer", "api-endpoint", "YOUR_URL_HERE");
```

e.g. running locally

```javascript
game.settings.set("ddb-importer", "custom-proxy", true);
game.settings.set("ddb-importer", "api-endpoint", "http://localhost:3000");
```

To revert to MrPrimate's proxy:
```javascript
game.settings.set("ddb-importer", "api-endpoint", "https://proxy.ddb.mrprimate.co.uk");
game.settings.set("ddb-importer", "custom-proxy", false);
```

## How can I see if the server is running?

Visit `YOUR_URL_HERE/ping` e.g. `https://myddbproxy.example.com/ping`

## Why is x feature missing

This is a cut down, MVP implementation of the proxy, it is meant for individual use and does not implement caching. It should not be run as a service for others.

It does not include and features in development.


## Support

No support is provided for this software.

# Beyond Foundry Proxy

## Project State (as of June 8, 2025)

### Overview
This proxy server is a Dockerized, extensible API gateway for Beyond Foundry, based on MrPrimate's ddb-proxy, but customized for the Beyond Foundry import workflow. It is designed to run on localhost:3000 and supports all major D&D Beyond content types required by the module.

### Implemented Features
- Dockerized Node.js server (Node 18-alpine)
- Docker Compose integration for local development
- Endpoints for all major D&D Beyond content types:
  - `/proxy/class`
  - `/proxy/spells`
  - `/proxy/feats`
  - `/proxy/backgrounds`
  - `/proxy/races`
  - `/proxy/rules`
  - `/proxy/adventures`
  - Plus: `/proxy/character`, `/proxy/items`, `/proxy/monsters`, `/proxy/campaigns`, etc.
- All new endpoints are registered in `index.js` and have stub handlers
- Plan for structured logging (winston), schema validation (ajv), and robust error handling

### Migration Plan: JavaScript to TypeScript
- The project will be migrated to TypeScript for type safety, maintainability, and future-proofing
- Steps:
  1. Add a `tsconfig.json` to `beyond-foundry-proxy/`
  2. Rename all `.js` files to `.ts`
  3. Update all imports/exports to ES module syntax
  4. Add type annotations and interfaces for request/response bodies
  5. Update Dockerfile and build process to compile TypeScript before running
  6. Test all endpoints for correct registration and stub responses
- This migration will ensure the proxy is modern, robust, and easy to extend

### Next Steps
- Complete TypeScript migration
- Implement logging, validation, and error handling in all endpoints
- Begin implementing real data fetching logic for each endpoint
- Add unit and integration tests

---

*This file will be updated as the migration and feature work progresses.*
