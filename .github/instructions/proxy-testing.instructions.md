---
applyTo: '**'
---
# Testing Beyond Foundry with Existing ddb-proxy

## Quick Start Testing Guide

Since you have ddb-proxy already running in Docker, here's how to immediately start testing:

### 1. First Test - Verify Proxy Connection

Add this to `BeyondFoundryAPI.ts`:

```typescript
export class BeyondFoundryAPI {
  private static instance: BeyondFoundryAPI;
  private apiEndpoint: string = '';
  private proxyEndpoint: string = '';
  private initialized: boolean = false;

  private init(): void {
    if (this.initialized) return;

    // Your existing ddb-proxy endpoint
    this.proxyEndpoint = 'http://localhost:3100';
    this.apiEndpoint = getModuleSetting('apiEndpoint') as string;
    this.initialized = true;
    
    // Test the connection immediately
    this.testProxyConnection();
    
    log('BeyondFoundryAPI initialized');
  }

  /**
   * Test connection to ddb-proxy
   */
  private async testProxyConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.proxyEndpoint}/ping`);
      if (response.ok) {
        const data = await response.text();
        log(`Connected to ddb-proxy: ${data}`, 'info');
        ui.notifications?.info('Connected to D&D Beyond Proxy!');
      } else {
        throw new Error(`Proxy returned ${response.status}`);
      }
    } catch (error) {
      log(`Failed to connect to ddb-proxy: ${error}`, 'error');
      ui.notifications?.error('Could not connect to D&D Beyond Proxy. Is it running?');
    }
  }
}
```

### 2. Authentication Test

Check ddb-proxy's authentication endpoint:

```typescript
/**
 * Authenticate with D&D Beyond through proxy
 * @param cobaltToken - The D&D Beyond Cobalt token
 */
public async authenticate(cobaltToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${this.proxyEndpoint}/proxy/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        cobaltToken: cobaltToken 
      })
    });

    if (response.ok) {
      const data = await response.json();
      log('Authentication successful', 'info');
      
      // Store auth data if needed
      await game.settings.set(MODULE_ID, 'authToken', data.token);
      
      return true;
    } else {
      const error = await response.text();
      log(`Authentication failed: ${error}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Authentication error: ${error}`, 'error');
    return false;
  }
}
```

### 3. Character List Test

Test fetching characters:

```typescript
/**
 * Get list of characters from D&D Beyond
 */
public async getCharacterList(): Promise<DDBCharacter[]> {
  try {
    // First, check if we're authenticated
    const authToken = game.settings.get(MODULE_ID, 'authToken');
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    // Check ddb-proxy's endpoint documentation for exact path
    const response = await fetch(`${this.proxyEndpoint}/proxy/api/character/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      log(`Found ${data.characters?.length || 0} characters`, 'info');
      return data.characters || [];
    } else {
      throw new Error(`Failed to fetch characters: ${response.statusText}`);
    }
  } catch (error) {
    log(`Failed to fetch character list: ${error}`, 'error');
    ui.notifications?.error('Could not fetch character list');
    return [];
  }
}
```

### 4. Character Import Test

Test importing a specific character:

```typescript
/**
 * Import a character using ddb-proxy
 */
public async importCharacter(
  characterId: string,
  options: Partial<ImportOptions> = {}
): Promise<ImportResult> {
  try {
    log(`Starting character import for ID: ${characterId}`);

    // Fetch character data through proxy
    const response = await fetch(`${this.proxyEndpoint}/proxy/api/character/get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${game.settings.get(MODULE_ID, 'authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        characterId: characterId 
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}`);
    }

    const characterData = await response.json();
    log(`Received character data for: ${characterData.name}`, 'debug');

    // Now you have real D&D Beyond data to work with!
    // Start implementing your parser using this real data
    
    // For now, just log the structure
    console.log('Character Data Structure:', characterData);
    
    ui.notifications?.info(`Character data received for ${characterData.name}. Check console for structure.`);

    return {
      success: true,
      characterId: characterId,
      errors: [],
      warnings: ['Parser not yet implemented - data logged to console'],
      imported: {
        character: false,
        spells: 0,
        equipment: 0,
        features: 0
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Character import failed: ${errorMessage}`, 'error');
    
    return {
      success: false,
      errors: [errorMessage],
      warnings: [],
      imported: {
        character: false,
        spells: 0,
        equipment: 0,
        features: 0
      }
    };
  }
}
```

## Testing Workflow

### Step 1: Manual Browser Test
1. Open your browser
2. Go to: `http://localhost:3100/ping`
3. You should see a response (likely "pong" or similar)

### Step 2: Get D&D Beyond Cobalt Token
1. Log into D&D Beyond in your browser
2. Open Developer Tools (F12)
3. Go to Application/Storage > Cookies
4. Find the `CobaltSession` cookie
5. Copy its value

### Step 3: Test in FoundryVTT Console
```javascript
// In FoundryVTT console (F12)
const api = game.modules.get('beyond-foundry').api;

// Test proxy connection
await api.testProxyConnection();

// Test authentication (replace with your token)
const token = "YOUR_COBALT_SESSION_TOKEN";
await api.authenticate(token);

// Test character list
const characters = await api.getCharacterList();
console.log(characters);

// Test character import (use a real character ID)
const result = await api.importCharacter("12345678");
console.log(result);
```

## Understanding ddb-proxy Endpoints

Study the proxy's endpoints to understand available functionality:

### Common Endpoints:
- `/ping` - Health check
- `/proxy/auth` - Authentication
- `/proxy/api/character/get` - Get character data
- `/proxy/api/character/list` - List characters
- `/proxy/api/campaign/get` - Get campaign data

### Request Pattern:
```javascript
// Most ddb-proxy endpoints follow this pattern:
const response = await fetch(`${proxyUrl}/proxy/api/${endpoint}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestData)
});
```

## Debugging Tips

### 1. Check Docker Logs
```bash
# Watch proxy logs
docker-compose logs -f ddb-proxy

# See what requests are being made
```

### 2. Use Browser Network Inspector
- Open FoundryVTT with Developer Tools
- Go to Network tab
- Watch requests to localhost:3100
- Check request/response details

### 3. Add Debug Logging
```typescript
// Wrap fetch calls with detailed logging
private async debugFetch(url: string, options?: RequestInit) {
  log(`Fetching: ${url}`, 'debug');
  log(`Options: ${JSON.stringify(options)}`, 'debug');
  
  try {
    const response = await fetch(url, options);
    log(`Response: ${response.status} ${response.statusText}`, 'debug');
    return response;
  } catch (error) {
    log(`Fetch error: ${error}`, 'error');
    throw error;
  }
}
```

## Next Steps

Once you can successfully:
1. ✅ Connect to the proxy
2. ✅ Authenticate with D&D Beyond
3. ✅ Fetch character data

Then you can:
1. Study the character data structure
2. Start implementing parsers
3. Compare with ddb-importer's approach
4. Build your character import functionality

The key advantage is you're working with **real data** from the start!