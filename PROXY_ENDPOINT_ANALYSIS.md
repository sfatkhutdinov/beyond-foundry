# Beyond Foundry Proxy Endpoint Analysis Summary

## ✅ Proxy Server Status
- **Container**: Running successfully on port 4000
- **Health Check**: ✅ PASS - `GET /` returns "Beyond Foundry Proxy is running!"
- **Configuration**: ✅ PASS - `GET /proxy/config` returns 16 D&D classes and URLs

## 🔧 Endpoint Corrections Made

### 1. Character Import Endpoint
**❌ Before**: Main module used `POST /proxy/character` with body auth
**✅ After**: Fixed to use `GET /proxy/character/:id` with header auth

```typescript
// Fixed in BeyondFoundryAPI.ts
const response = await fetch(`${this.proxyEndpoint}/proxy/character/${characterId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-cobalt-id': cobaltToken,
  },
});
```

### 2. Spell Import Endpoint
**❌ Before**: Used incorrect URL format and GET method
**✅ After**: Fixed to use `POST /proxy/spells/class/spells` with body auth

```typescript
// Fixed in BeyondFoundryAPI.ts
const response = await fetch(`${this.proxyEndpoint}/proxy/spells/class/spells`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    className: classInfo.name,
    cobaltToken: cobaltId,
  }),
});
```

## 📋 Complete Endpoint Mapping

### Available Proxy Endpoints
```
Health & Config:
GET  /                           - Health check
GET  /proxy/config               - Configuration & class mappings

Authentication:
POST /proxy/auth/token           - Authentication (needs id + cobalt)

Character Data:
GET  /proxy/character/:id        - Character data (needs x-cobalt-id header)

Spell Data:
POST /proxy/spells/spells        - Bulk spell import
POST /proxy/spells/class/spells  - Class-specific spells

Content Import:
POST /proxy/backgrounds/backgrounds - Background import
POST /proxy/races/races            - Race import
POST /proxy/feats/feats            - Feat import (needs debugging)
POST /proxy/rules                  - Rules import
POST /proxy/adventures             - Adventure import
POST /proxy/campaign               - Campaign data
```

### Endpoint Test Results
| Endpoint | Method | Status | Auth Type | Notes |
|----------|--------|--------|-----------|-------|
| Health | GET | ✅ WORKING | None | Always available |
| Config | GET | ✅ WORKING | None | Returns class mappings |
| Auth Token | POST | ✅ EXPECTED_FAIL | Body (id+cobalt) | Fails with invalid token |
| Character | GET | ✅ EXPECTED_FAIL | Header (x-cobalt-id) | Fails with invalid token |
| Spells (Class) | POST | ⚠️ NEEDS_AUTH | Body (className+cobaltToken) | 500 error without auth |
| Spells (Bulk) | POST | ✅ WORKING | Body (cobalt) | Returns empty array |
| Backgrounds | POST | ✅ WORKING | Body (cobalt) | Returns data |
| Races | POST | ✅ WORKING | Body (cobalt) | Returns data |
| Feats | POST | ⚠️ NEEDS_DEBUG | Body (cobalt) | 500 error |
| Rules | POST | ✅ WORKING | Body (cobalt) | Returns data |
| Adventures | POST | ✅ WORKING | Body (cobalt) | Returns data |

## 🔐 Authentication Pattern Analysis

### Two Authentication Patterns Identified:

1. **Header-based Auth** (Character endpoint only):
   ```bash
   curl -X GET http://localhost:4000/proxy/character/123456 \
     -H "x-cobalt-id: YOUR_COBALT_TOKEN"
   ```

2. **Body-based Auth** (All other endpoints):
   ```bash
   curl -X POST http://localhost:4000/proxy/spells/spells \
     -H "Content-Type: application/json" \
     -d '{"cobalt": "YOUR_COBALT_TOKEN"}'
   ```

## 🐳 Docker Configuration

### Current Setup:
- **Container Name**: `beyond-foundry-proxy`
- **Port Mapping**: `4000:4000`
- **Network**: Default Docker network
- **Environment**: Production mode

### Environment Variables:
```yaml
# In beyond-foundry-proxy/.env
COBALT_COOKIE=your_cobalt_session_token_here
```

## 🔄 Module Settings Configuration

### Proxy URL Settings:
```typescript
// Default configurations in constants.ts
export const DEFAULT_PROXY_URL = 'http://localhost:4000';
export const DOCKER_PROXY_URL = 'http://ddb-proxy:4000';
```

### Settings Registration:
- `proxyUrl`: Configurable proxy endpoint
- `useDockerProxy`: Toggle for Docker network access
- `cobaltToken`: User's D&D Beyond session token

## ✅ Testing Instructions

### 1. Basic Connectivity Test:
```bash
curl http://localhost:4000/
# Expected: "Beyond Foundry Proxy is running!"
```

### 2. Configuration Test:
```bash
curl http://localhost:4000/proxy/config | jq '.classMap[0]'
# Expected: {"name":"Barbarian","spells":"SPELLS","id":9}
```

### 3. Authentication Test (with real token):
```bash
curl -X POST http://localhost:4000/proxy/auth/token \
  -H "Content-Type: application/json" \
  -d '{"id": "your_username", "cobalt": "YOUR_REAL_COBALT_TOKEN"}'
```

### 4. Character Import Test (with real data):
```bash
curl -X GET http://localhost:4000/proxy/character/YOUR_CHARACTER_ID \
  -H "x-cobalt-id: YOUR_REAL_COBALT_TOKEN"
```

### 5. FoundryVTT Module Test:
```javascript
// In FoundryVTT console
const api = game.modules.get('beyond-foundry').api;
await api.testProxyConnection();
// Expected: true
```

## 🚨 Known Issues & Fixes

### Issue 1: Feats Endpoint Returns 500
- **Status**: Needs investigation
- **Workaround**: Use other content import endpoints
- **Priority**: Medium

### Issue 2: Some endpoints require specific auth format
- **Status**: ✅ FIXED
- **Solution**: Updated main module to match proxy expectations

### Issue 3: Response parsing mismatches
- **Status**: ✅ FIXED
- **Solution**: Updated response handling in main module

## 🎯 Next Steps

1. **Set up real authentication**: Configure valid COBALT_COOKIE
2. **Test with real data**: Import actual D&D Beyond characters
3. **Debug failing endpoints**: Investigate feats endpoint 500 error
4. **Performance testing**: Test with large character imports
5. **Documentation update**: Update user guides with correct endpoints

## 📝 Files Modified

1. `src/module/api/BeyondFoundryAPI.ts`:
   - Fixed character endpoint to use GET with header auth
   - Fixed spell endpoint to use correct POST path
   - Updated response parsing

2. Created test files:
   - `test-proxy-endpoints.mjs`: Comprehensive endpoint testing
   - `test-api-alignment.mjs`: API alignment verification

## 🔗 Useful Commands

```bash
# Check Docker container status
docker ps

# View proxy logs
docker logs beyond-foundry-proxy

# Restart proxy container
docker-compose restart beyond-foundry-proxy

# Run endpoint tests
node test-proxy-endpoints.mjs
node test-api-alignment.mjs
```

---

**Status**: ✅ Proxy endpoints analyzed and main module API aligned. Ready for authentication testing with real D&D Beyond data.
