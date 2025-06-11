# D&D Beyond Spell HTML Analysis

## Overview
Analyzed `spell.html` file containing the D&D Beyond page for "Tenser's Floating Disk" spell. This provides valuable insights into D&D Beyond's front-end structure and data representation.

## Key Findings

### 1. Spell Identification
- **Spell ID**: `2619169` (found in URL and cobaltVcmList)
- **Type ID**: `1118725998` (appears to be spell content type)
- **URL Pattern**: `/spells/[ID]-[slug]` format
- **Full URL**: `https://www.dndbeyond.com/spells/2619169-tensers-floating-disk`

### 2. HTML Structure Analysis

#### Main Spell Container
```html
<div class="spell-details 2619169-tensers-floating-disk-details">
```

#### Stat Block Structure
```html
<div class="ddb-statblock ddb-statblock-spell">
    <div class="ddb-statblock-item ddb-statblock-item-level">
        <div class="ddb-statblock-item-label">Level</div>
        <div class="ddb-statblock-item-value">1st</div>
    </div>
    <!-- Repeated pattern for all spell properties -->
</div>
```

### 3. Key CSS Classes for Parsing

#### Spell Properties
- `.ddb-statblock-spell` - Main stat block container
- `.ddb-statblock-item-level` - Spell level
- `.ddb-statblock-item-casting-time` - Casting time
- `.ddb-statblock-item-range-area` - Range information
- `.ddb-statblock-item-components` - Components (V, S, M)
- `.ddb-statblock-item-duration` - Duration
- `.ddb-statblock-item-school` - Magic school
- `.ddb-statblock-item-attack-save` - Attack/Save information
- `.ddb-statblock-item-damage-effect` - Damage/Effect type

#### Content Sections
- `.more-info-content` - Main spell description
- `.spell-tags` - Spell tags (Movement, Utility, etc.)
- `.available-for` - Available classes
- `.spell-source` - Source book information
- `.components-blurb` - Material component details

### 4. Spell Data Structure (from HTML)

```typescript
interface ParsedSpellFromHTML {
  id: number; // 2619169
  name: string; // "Tenser's Floating Disk"
  level: string; // "1st"
  castingTime: string; // "1 Action"
  isRitual: boolean; // true (has <i class="i-ritual">)
  range: string; // "30 ft."
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string; // "(a drop of mercury)"
  };
  duration: string; // "1 Hour"
  school: string; // "Conjuration"
  attackSave: string; // "None"
  damageEffect: string; // "Movement (...)"
  description: string; // Full HTML description
  tags: string[]; // ["Movement", "Utility"]
  classes: string[]; // ["Wizard (Legacy)", "Wizard"]
  source: string; // "Player's Handbook, pg. 332"
  image: string; // "//www.dndbeyond.com/attachments/2/708/conjuration.png"
}
```

### 5. JavaScript Data Points

#### Cobalt VCM List
```javascript
window.cobaltVcmList = window.cobaltVcmList || [];
window.cobaltVcmList.push({type:1118725998, id:2619169});
```

#### User Data
- User ID: `100113018`
- Session ID: `4761b5a9-0389-4a79-92a5-96bc2a98d5e3`
- Subscription: "D&D Beyond Master Annually"

### 6. Content Type Identification
- `body-rpgspell` - Indicates spell content type
- `body-rpgspell-details` - Indicates detail view

### 7. Parsing Opportunities for Beyond Foundry

#### DOM Parsing Strategy
1. **Primary Method**: Parse `.ddb-statblock-item` elements
2. **Fallback Method**: Parse individual CSS classes
3. **Validation**: Cross-reference with embedded JSON data

#### Extraction Points
```javascript
// Example parsing logic
function parseSpellFromDOM(doc) {
  const statblock = doc.querySelector('.ddb-statblock-spell');
  
  return {
    level: statblock.querySelector('.ddb-statblock-item-level .ddb-statblock-item-value').textContent,
    castingTime: statblock.querySelector('.ddb-statblock-item-casting-time .ddb-statblock-item-value').textContent,
    range: statblock.querySelector('.ddb-statblock-item-range-area .ddb-statblock-item-value').textContent,
    // ... etc
  };
}
```

### 8. Authentication Context
- Page shows user is authenticated (`user-authenticated` class)
- Contains authentication tokens in forms
- Has subscription level data

### 9. Recommendations for Beyond Foundry

#### Browser Extension Approach
- Target `.ddb-statblock-spell` for structured data
- Parse `.more-info-content` for description
- Extract tags from `.spell-tags .tag`
- Get classes from `.available-for .tag`

#### Proxy Server Approach
- Look for `window.cobaltVcmList` data
- Extract spell ID from URL pattern
- Use structured CSS classes for reliable parsing

#### Data Validation
- Cross-reference HTML content with API data
- Validate using spell ID `2619169`
- Check consistency across multiple spells

### 10. Missing API Data
- No embedded JSON spell data found
- No direct API endpoints visible
- Would need to reverse-engineer actual API calls

## Next Steps

1. **Test DOM Parsing**: Create parser for `.ddb-statblock-spell` structure
2. **Compare with API**: Test against fetched spell data from proxy
3. **Build CSS Selectors**: Create robust selectors for all spell properties
4. **Handle Edge Cases**: Test with different spell types (cantrips, higher levels, etc.)
5. **Validate Data**: Ensure parsed data matches FoundryVTT D&D 5e schema
