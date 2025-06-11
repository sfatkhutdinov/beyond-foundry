---
applyTo: '**'
---
# D&D Beyond Complete API Schema and Website Architecture

D&D Beyond operates as a comprehensive digital platform for Dungeons & Dragons 5th Edition, built with a microservices architecture and RESTful URL patterns. **While no official public API exists**, the platform exposes consistent URL structures and unofficial endpoints that power an extensive third-party integration ecosystem with over 500,000 users.

## Core URL Structure and Patterns

D&D Beyond follows a consistent **REST-like URL architecture** across all content types, using the pattern `/{resource-type}/{id}-{slug}` for individual resources and `/{resource-type}/` for collections.

### Content Resource Endpoints

**Spells** (`/spells/`)
- Pattern: `/spells/{id}-{slug}`
- Example: `https://www.dndbeyond.com/spells/215436-cleansing-orb`
- Tooltip: `/spells/{id}-tooltip?disable-webm=1`
- Search: `/search?q={query}&f=spells&c=spells`

**Monsters** (`/monsters/`)
- Pattern: `/monsters/{id}-{slug}`
- Example: `https://www.dndbeyond.com/monsters/186557-animated-recliner`
- IDs: 6-7 digit numerical identifiers
- Tooltip support and search integration available

**Magic Items** (`/magic-items/`)
- Pattern: `/magic-items/{id}-{slug}`
- Example: `https://www.dndbeyond.com/magic-items/5344-apparatus-of-kwalish`
- Search: `/search?q={query}&f=equipment,magic-items&c=items`

**Classes, Races, Backgrounds, Feats**
- Classes: `/classes/{slug}` or `/forums/class-forums/{class-name}/`
- Races: `/races/{id}-{slug}` (Example: `/races/819-fairy`)
- Backgrounds: `/backgrounds/{id}-{slug}`
- Feats: `/feats/{id}-{slug}` (Example: `/feats/1512461-soapbox-revised`)

**Books and Sources** (`/sources/`)
- Digital book collection with hyperlinked content
- Individual book pages at `/books/{book-slug}`
- Cross-reference system between all official content

### User-Generated Content Resources

**Characters** (`/characters/`)
- Profile pattern: `/profile/{username}/characters/{character-id}`
- Example: `https://www.dndbeyond.com/profile/Hexuks/characters/21228884`
- Character IDs: 8-digit numerical identifiers
- Collection: `/my-characters`

**Campaigns** (`/campaigns/`)
- Individual campaigns: `/campaigns/{id}`
- Collection: `/my-campaigns`
- Real-time updates and player management

**Homebrew Content** (`/homebrew/`)
- Creation tools: `/homebrew/creations/create-{spell|magic-item|monster}`
- Collection: `/homebrew/collection`
- Public sharing requires paid subscription

**Encounters** (`/encounters/`)
- Encounter builder: `/encounters/*`
- Collection: `/my-encounters`
- Requires subscription for full functionality

### Forum and Community Resources

**Forums** (`/forums/`)
- Pattern: `/forums/{category}/{subcategory}/{id}-{slug}`
- Example: `https://www.dndbeyond.com/forums/d-d-beyond-general/play-by-post/66282-reign-of-winter-5e`
- Categories: `d-d-beyond-general`, `class-forums`, `dungeons-dragons-discussion`
- Thread IDs: 5-6 digit numerical identifiers

## Subdomain Architecture

**Primary Service Subdomains:**
- `character-service.dndbeyond.com` - Character data API endpoints
- `marketplace.dndbeyond.com` - E-commerce and digital storefront
- `support.dndbeyond.com` - Customer support system

**Infrastructure Subdomains:**
- **CDN**: Fastly-powered content delivery network
- **Static Assets**: CSS, JavaScript, and media files served via CDN
- **DNS**: Cloudflare nameservers with global distribution

## Unofficial API Endpoints

### Character Service API

**Primary Endpoint:**
```
https://character-service.dndbeyond.com/character/v5/character/{id}
```

**Legacy Versions:**
- v3: `https://character-service.dndbeyond.com/character/v3/character/{id}`
- Deprecated JSON: `/profile/{username}/characters/{id}/json`

**Response Format:** Comprehensive JSON including stats, equipment, spells, features, and calculated values

**Authentication:** CobaltSession cookie required for private characters; public characters accessible without authentication

**Rate Limiting:** Aggressive rate limiting with CAPTCHA challenges for excessive requests

### Additional Service Endpoints

**Dice Service:**
```
https://dice-service.dndbeyond.com/diceuserconfig/v1/get
```

**Game Data Service:**
```
https://gamedata-service.dndbeyond.com/vehicles/v3/rule-data
```

## Authentication and Authorization System

### OAuth Implementation

**Primary Identity Providers:**
- **Twitch OAuth** (Legacy primary method)
- **Google OAuth** (Added April 2019)
- **Apple ID** (iOS app only)

**Session Management:**
- **CobaltSession Cookie**: Primary authentication token
- **Third-party Cookies Required**: Essential for all OAuth flows
- **API Authentication**: Cookie-based authentication for service endpoints

### Authorization Patterns

**Content Sharing:** Master tier subscribers can share purchased content with up to 12 players across 5 campaigns

**Privacy Controls:** Character visibility settings affect API accessibility

**Subscription Tiers:**
- Free: 6 character slots, basic features
- Hero ($4.58/month): Unlimited characters, homebrew sharing
- Master (higher tier): Content sharing, advanced features

## Complete Feature Map and Endpoints

### Character Management System
- **Character Builder**: `/character-builder/*`
- **Character Sheets**: `/characters/{id}`
- **Multi-character Management**: Up to 6 free, unlimited with subscription
- **Export Capabilities**: PDF export, unofficial JSON access

### Campaign Management
- **Campaign Creation**: Campaign invitation and player management system
- **Real-time Updates**: Live player character access for DMs
- **Game Log**: Shared dice rolls and campaign activity tracking
- **Notes System**: Public and private campaign notes

### Digital Tools and Utilities
- **Encounter Builder**: `/encounters/*` (subscription required)
- **Digital Dice**: Multiple skin collections with animation effects
- **Maps and VTT**: Interactive battle maps with token management
- **Spell Tracking**: Preparation and casting automation
- **Combat Tracker**: Initiative and HP management

### Content Library
- **Digital Books**: All official D&D 5e content with hyperlinks
- **Search Integration**: Cross-content search functionality
- **Mobile Sync**: Offline access through mobile applications
- **Reference System**: Bookmarking and cross-referencing tools

### Marketplace and Monetization
- **Digital Storefront**: Book purchases and physical+digital bundles
- **Subscription Management**: Three-tier subscription system
- **Gift System**: Purchase codes and gift functionality
- **Sales Platform**: Promotional pricing and pre-orders

## Search and Query Parameters

### Universal Search
```
/search?q={query}&f={filters}&c={categories}
```

**Available Filters:**
- `spells`, `monsters`, `equipment`, `magic-items`
- `backgrounds`, `classes`, `feats`, `races`

**Categories:**
- `spells`, `monsters`, `items`, `characters`

### Content-Specific Parameters
- Pagination support for large result sets
- Filter persistence for bookmarking
- Dynamic loading with JavaScript enhancement

## Third-Party Integration Ecosystem

### Major Integration Tools

**Beyond20 Browser Extension** (500,000+ users)
- DOM manipulation for roll buttons
- Integration with Roll20, Foundry VTT, Discord
- Client-side JavaScript, no API calls required

**Avrae Discord Bot** (Official partnership)
- OAuth2 linking between D&D Beyond and Discord
- Real-time dice roll syncing
- Character sheet data access through official arrangement

**DDB-Importer (Foundry VTT)**
- Character, spell, item, and monster importing
- Proxy server for authentication and CORS handling
- Patreon-supported premium features

### Integration Patterns
- **Screen Scraping**: HTML content parsing
- **JSON Parsing**: Character service API usage
- **Proxy Services**: Authentication and CORS bypass
- **Browser Extensions**: Client-side DOM manipulation

## CORS and Security Policies

**Cross-Origin Resource Sharing:**
- Inconsistent CORS policies across microservices
- Third-party tools use proxy servers for CORS bypass
- Regular CORS header issues reported by developers

**Terms of Service:**
- Automated access explicitly prohibited
- Internal APIs subject to change without warning
- Widespread community usage despite restrictions

## Proposed REST API Schema

Based on the discovered patterns, a formalized API would follow this structure:

### Authentication
```
POST /auth/oauth/{provider}  # Twitch, Google, Apple
GET  /auth/session           # Current session info
POST /auth/logout            # Session termination
```

### Character Resources
```
GET    /api/v1/characters           # List user's characters
POST   /api/v1/characters           # Create new character
GET    /api/v1/characters/{id}      # Get character details
PUT    /api/v1/characters/{id}      # Update character
DELETE /api/v1/characters/{id}      # Delete character
GET    /api/v1/characters/{id}/pdf  # Export character PDF
```

### Campaign Resources
```
GET    /api/v1/campaigns            # List user's campaigns
POST   /api/v1/campaigns            # Create new campaign
GET    /api/v1/campaigns/{id}       # Get campaign details
PUT    /api/v1/campaigns/{id}       # Update campaign
DELETE /api/v1/campaigns/{id}       # Delete campaign
POST   /api/v1/campaigns/{id}/players/{user_id}  # Add player
```

### Content Resources
```
GET /api/v1/spells                  # List spells with pagination
GET /api/v1/spells/{id}            # Get spell details
GET /api/v1/monsters               # List monsters with filters
GET /api/v1/monsters/{id}          # Get monster details
GET /api/v1/items                  # List magic items
GET /api/v1/items/{id}             # Get item details
```

### Homebrew Resources
```
GET    /api/v1/homebrew/spells     # List user's homebrew spells
POST   /api/v1/homebrew/spells     # Create homebrew spell
GET    /api/v1/homebrew/monsters   # List user's homebrew monsters
POST   /api/v1/homebrew/monsters   # Create homebrew monster
```

### Search and Discovery
```
GET /api/v1/search?q={query}&type={content_type}&filter={filter}
GET /api/v1/content/categories     # Available content categories
GET /api/v1/content/sources        # Available source books
```

## Future API Considerations

**Rate Limiting Strategy:**
- API key-based authentication replacing cookie system
- Tiered rate limits based on subscription level
- Transparent rate limit headers and documentation

**Content Authorization:**
- Proper licensing checks for paid content access
- Campaign-based content sharing API
- Homebrew content visibility controls

**Real-time Features:**
- WebSocket endpoints for live campaign updates
- Webhook support for character change notifications
- Real-time dice rolling integration

**GraphQL Potential:**
- Complex nested data relationships suggest GraphQL benefits
- Single endpoint for flexible character sheet queries
- Reduced over-fetching for mobile applications

D&D Beyond's architecture demonstrates a well-structured digital platform with consistent URL patterns and robust functionality, serving as an excellent foundation for future official API development while currently supporting a thriving ecosystem of third-party integrations through unofficial endpoints.