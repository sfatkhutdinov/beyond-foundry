# Authentication

Beyond Foundry uses a proxy server (like ddb-proxy) to authenticate D&D Beyond users.

## Options:
- Cobalt cookie via settings
- Custom proxy backend
- Docker network internal access (ddb-proxy:3000)

## Troubleshooting
- **Invalid Token:** Ensure your CobaltSession cookie is current and copied correctly from D&D Beyond
- **Proxy Not Responding:** Check that ddb-proxy is running (`curl http://localhost:4000/ping`)
- **CORS Issues:** Use the recommended proxy URLs; browser-to-proxy should be http://localhost:4000
- **Authentication Fails:** Try logging out and back into D&D Beyond, then recopy the token
- **Multiple Users:** Each user must provide their own valid CobaltSession token

See [FOUNDRY_TESTING.md](FOUNDRY_TESTING.md) for more troubleshooting and test steps.
