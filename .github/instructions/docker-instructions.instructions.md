---
applyTo: '**'
---
# Beyond Foundry Docker Environment Setup

## Current Environment Analysis

Your setup with both FoundryVTT and ddb-proxy in Docker is actually ideal for development. Here's what this means:

### Advantages:
1. **Existing ddb-proxy**: You can use MrPrimate's proxy immediately for testing
2. **Network isolation**: Clean separation between services
3. **Easy testing**: Can test API calls to the proxy right away
4. **Reference implementation**: Can inspect how ddb-importer communicates with the proxy

## Docker Configuration Updates

### Option 1: Use Existing ddb-proxy (Recommended for Development)

No changes needed to docker-compose.yml! Your current setup is perfect for developing Beyond Foundry.

**Connection Configuration:**
```typescript
// In BeyondFoundryAPI.ts
class BeyondFoundryAPI {
  private proxyUrl: string;
  
  constructor() {
    // When running in Docker, Foundry can access ddb-proxy via container name
    this.proxyUrl = game.settings.get('beyond-foundry', 'proxyUrl') || 
                    'http://ddb-proxy:3000';  // Internal Docker network
    
    // For browser-based requests (if needed)
    this.publicProxyUrl = game.settings.get('beyond-foundry', 'publicProxyUrl') || 
                          'http://localhost:3100';  // Host machine access
  }
}
```

### Option 2: Add Your Own Proxy (Future Enhancement)

If you decide to create a custom proxy later:

```yaml
services:
  foundry:
    # ... existing config ...
    
  ddb-proxy:
    # ... existing config ...
    
  beyond-foundry-proxy:
    build: 
      context: ./beyond-foundry-proxy
      dockerfile: Dockerfile
    restart: "unless-stopped"
    ports:
      - "3200:3000"  # Different port to avoid conflict
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=http://localhost:30000
    networks:
      - default
```

## Development Workflow with Docker

### 1. Testing ddb-proxy Connection

First, verify the existing proxy works:

```javascript
// Add this test method to BeyondFoundryAPI.ts
async testProxyConnection(): Promise<boolean> {
  try {
    // Test connection to ddb-proxy
    const response = await fetch('http://localhost:3100/ping');
    if (response.ok) {
      log('Successfully connected to ddb-proxy', 'info');
      return true;
    }
  } catch (error) {
    log('Failed to connect to ddb-proxy', 'error');
    return false;
  }
}
```

### 2. Module Configuration

Update your module settings to handle Docker networking:

```typescript
// In settings.ts
game.settings.register(MODULE_ID, 'proxyUrl', {
  name: 'Proxy Server URL',
  hint: 'URL of the D&D Beyond proxy server (internal Docker address)',
  scope: 'world',
  config: true,
  type: String,
  default: 'http://ddb-proxy:3000'  // Docker internal network
});

game.settings.register(MODULE_ID, 'useExternalProxy', {
  name: 'Use MrPrimate\'s ddb-proxy',
  hint: 'Use the existing ddb-proxy instead of a custom proxy',
  scope: 'world',
  config: true,
  type: Boolean,
  default: true
});
```

### 3. API Implementation for Docker

```typescript
// BeyondFoundryAPI.ts modifications for Docker environment
class BeyondFoundryAPI {
  private async makeProxyRequest(endpoint: string, options: RequestInit = {}) {
    const useExternal = game.settings.get(MODULE_ID, 'useExternalProxy');
    
    // Determine which proxy to use
    const proxyBase = useExternal 
      ? 'http://localhost:3100'  // MrPrimate's proxy
      : 'http://localhost:3200'; // Your future proxy
    
    try {
      const response = await fetch(`${proxyBase}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      log(`Proxy request error: ${error}`, 'error');
      throw error;
    }
  }
  
  // Example: Get character data using the proxy
  async fetchCharacterData(characterId: string): Promise<DDBCharacter | null> {
    // Check ddb-proxy's API endpoints for the correct path
    return await this.makeProxyRequest(`/character/${characterId}`);
  }
}
```

## Docker Networking Considerations

### Container-to-Container Communication
```javascript
// When Foundry module needs to talk to proxy
const PROXY_INTERNAL_URL = 'http://ddb-proxy:3000';
```

### Browser-to-Proxy Communication
```javascript
// When browser needs direct proxy access
const PROXY_EXTERNAL_URL = 'http://localhost:3100';
```

### CORS Configuration
The proxy already handles CORS, but ensure your module respects it:
```javascript
// No additional CORS headers needed when using the proxy
```

## Development Tips for Docker Environment

### 1. Volume Mounting for Development
```yaml
# docker-compose.override.yml (for development)
services:
  foundry:
    volumes:
      - type: bind
        source: ./data
        target: /data
      - type: bind
        source: ./beyond-foundry/dist
        target: /data/Data/modules/beyond-foundry
        read_only: false
```

### 2. Hot Reload Setup
```bash
# Run build watch in your host machine
cd beyond-foundry
npm run build:watch

# Changes will be reflected in the Docker container
```

### 3. Debugging with Docker
```javascript
// Add debug endpoints to your module
async debugProxyConnection() {
  const endpoints = [
    'http://ddb-proxy:3000',      // Internal
    'http://localhost:3100',      // External
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}/ping`);
      log(`${endpoint}: ${response.ok ? 'OK' : 'FAILED'}`, 'debug');
    } catch (e) {
      log(`${endpoint}: ERROR - ${e.message}`, 'error');
    }
  }
}
```

## Using Existing ddb-proxy API

Since you have ddb-proxy running, you can use its endpoints immediately:

### Available Endpoints (check ddb-proxy documentation)
```
GET  /ping                          # Health check
POST /proxy/auth                    # Authentication
POST /proxy/api/character/get       # Get character data
POST /proxy/api/campaign/get        # Get campaign data  
GET  /proxy/api/config/json         # Get configuration
```

### Authentication Flow
```javascript
// Using ddb-proxy's existing auth
async authenticate(cobaltToken: string) {
  return await this.makeProxyRequest('/proxy/auth', {
    method: 'POST',
    body: JSON.stringify({ cobaltToken })
  });
}
```

## Migration Path

### Phase 1: Use Existing ddb-proxy
1. Implement Beyond Foundry using MrPrimate's proxy
2. Learn the API patterns and data structures
3. Get core functionality working

### Phase 2: Custom Proxy (Optional)
1. Only if you need custom endpoints
2. Fork ddb-proxy as a starting point
3. Add your specific functionality
4. Run alongside the original for comparison

## Docker Commands for Development

```bash
# View logs from both services
docker-compose logs -f foundry ddb-proxy

# Restart services after config changes
docker-compose restart foundry

# Execute commands in Foundry container
docker-compose exec foundry bash

# Test proxy connectivity
curl http://localhost:3100/ping
```

## Network Troubleshooting

If modules can't reach the proxy:

1. **Check Docker network**:
   ```bash
   docker network inspect foundry_network
   ```

2. **Verify service names**:
   ```bash
   docker-compose ps
   ```

3. **Test internal connectivity**:
   ```bash
   docker-compose exec foundry ping ddb-proxy
   ```

## Summary

Your Docker setup is perfect for Beyond Foundry development:
- ✅ No changes needed to docker-compose.yml
- ✅ Can use existing ddb-proxy immediately  
- ✅ Easy to test and develop
- ✅ Can add custom proxy later if needed

Start by using the existing ddb-proxy to understand the API patterns, then decide if you need custom functionality later.