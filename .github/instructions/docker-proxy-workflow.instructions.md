# Docker & Proxy Testing Workflow (Beyond Foundry)

## Overview
This document consolidates all instructions for Docker-based development, local proxy setup, and testing workflows for Beyond Foundry. Use this as the single source of truth for containerized and proxy-based development.

---

## 1. Docker Setup & Usage

### Build and Run Containers
```sh
docker-compose build
docker-compose up
```
- Use `docker-compose up -d` to run in detached mode.
- Use `docker-compose logs -f` to follow logs.

### Common Docker Compose Services
- **beyond-foundry**: Main app container
- **beyond-foundry-proxy**: D&D Beyond proxy server
- **db**: (Optional) Database for persistent storage

### Rebuilding After Code Changes
```sh
# For main app changes
docker-compose build beyond-foundry-proxy
docker-compose restart beyond-foundry-proxy

# For proxy changes (especially class.ts)
docker-compose build beyond-foundry-proxy
docker-compose restart beyond-foundry-proxy
```

### Stopping and Cleaning Up
```sh
docker-compose down -v
```

---

## 2. Proxy Testing Workflow

### Local Proxy Setup
- Ensure `beyond-foundry-proxy` service is running (see above).
- Configure Beyond Foundry to use the local proxy endpoint (see `docs/authentication.md`).
- For manual testing, set browser D&D Beyond requests to point to the proxy (e.g., via browser extension or `/etc/hosts`).

### Testing Endpoints
- Test `/auth` and `/import` endpoints using curl or Postman:
```sh
curl http://localhost:PORT/auth
curl http://localhost:PORT/import
```
- Check logs for errors or blocked requests.

### Troubleshooting
- If requests are blocked, check:
  - Proxy logs for error messages
  - Authentication tokens (see `docs/authentication.md`)
  - Network/firewall settings
  - Proxy directory structure (should be a regular directory, not a submodule)
- Restart containers if changes are made to proxy code or configuration
- After modifying `class.ts`, always rebuild the proxy container
- Check proxy logs for any HTML parsing or feature extraction errors

---

## 3. Best Practices
- Always rebuild containers after major code changes.
- Use environment variables for secrets and configuration.
- Clean up unused containers and volumes regularly.
- Document any custom proxy rules or test cases.
- After any changes to `class.ts`, rebuild the proxy container.

---

## 4. Additional Resources
- See `docs/authentication.md` for auth troubleshooting.
- See `README.md` for project overview and links.
- See `docs/quick-reference.md` for commands and test data.

---

*This document supersedes previous docker-instructions and proxy-testing instructions. Remove or mark as deprecated: docker-instructions.instructions.md, proxy-testing.instructions.md.*
