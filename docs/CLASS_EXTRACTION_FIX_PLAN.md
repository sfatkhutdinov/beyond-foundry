# Class Extraction Fix Recommendations
*Generated: June 11, 2025*

## Immediate Action Plan

Based on the comprehensive analysis and testing, here are the specific steps to fix the class extraction issues:

## Step 1: HTML Structure Analysis (URGENT)

Before fixing any CSS selectors, we need to analyze the current D&D Beyond HTML structure. 

**Action Required:**
```bash
# Save current druid page HTML for analysis
curl -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
     "https://www.dndbeyond.com/classes/druid" > /tmp/druid-current.html

# Analyze the HTML to find correct selectors for:
# - Class tags/metadata
# - Prerequisites  
# - Source information
# - Progression table
# - Core traits table
# - Sidebar elements
```

## Step 2: Fix Source Info Extraction (HIGH PRIORITY)

**Current Issue:** Extracting 6547 characters of footer/CSS instead of book source

**Files to Update:** `beyond-foundry-proxy/src/class.ts`

**Function:** `extractMetadata()`

**Current Broken Code:**
```typescript
// Source: look for footer or header with book/page info
root('footer, .source, .ddb-statblock-source, .book-source').each((_, el) => {
    const text = root(el).text().trim();
    if (text && !source) source = text;
});
```

**Expected Fix:** Need to find the actual source element selector from HTML analysis.

## Step 3: Fix Tags and Prerequisites (HIGH PRIORITY)

**Current Issue:** Both return empty arrays consistently

**Current Broken Code:**
```typescript
// Tags: look for elements with class 'tag' or similar
root('.tag, .ddb-tag').each((_, el) => {
    const text = root(el).text().trim();
    if (text) tags.push(text);
});

// Prerequisites: look for text like 'Prerequisite:'
root('li, p, span').each((_, el) => {
    const text = root(el).text().trim();
    if (text.startsWith('Prerequisite:') || text.startsWith('Prerequisites:')) {
        prerequisites.push(text.replace('Prerequisite:', '').replace('Prerequisites:', '').trim());
    }
});
```

**Expected Fix:** Need correct selectors from HTML analysis.

## Step 4: Fix Progression Table (MEDIUM PRIORITY)

**Current Issue:** Returns empty array - `extractProgressionTable()` not finding table

**Current Broken Code:**
```typescript
function extractProgressionTable(root: cheerio.Root): any[] {
    const table = root('table.table-compendium.table--features');
    // ...
}
```

**Expected Fix:** Update selector to match current D&D Beyond progression table structure.

## Step 5: Fix Core Traits (MEDIUM PRIORITY)

**Current Issue:** Returns empty object - `extractCoreTraits()` not finding traits table

**Current Broken Code:**
```typescript
function extractCoreTraits(root: cheerio.Root): Record<string, string> {
    const table = root('table.table-compendium.table--left-all');
    // ...
}
```

**Expected Fix:** Update selector to match current D&D Beyond traits table structure.

## Step 6: Fix Sidebars (MEDIUM PRIORITY)

**Current Issue:** Returns empty array - `extractSidebars()` not finding sidebar elements

**Current Broken Code:**
```typescript
function extractSidebars(root: cheerio.Root): string[] {
    const sidebars: string[] = [];
    root('aside.text--rules-sidebar').each((_, aside) => {
        sidebars.push(sanitizeText(root(aside).text().trim()));
    });
    return sidebars;
}
```

**Expected Fix:** Update selector to match current D&D Beyond sidebar structure.

## Step 7: Improve Subclass Quality (LOW PRIORITY)

**Current Issue:** Subclasses extract but include legacy warnings and poor formatting

**Example Current Output:**
```json
{
  "name": "Circle of the Land \n    \n        Legacy\n    \n    \n        This doesn't reflect the latest rules and lore.\n        Learn More",
  "description": "The Circle of the Land is made up of..."
}
```

**Expected Fix:** Clean up name extraction and filter out legacy warnings.

## Testing Strategy

After each fix, test with multiple classes:

```bash
# Test extraction for each class
curl -X POST http://localhost:4000/proxy/classes/1-druid \
  -H "Content-Type: application/json" \
  -d '{"cobalt": "test_session"}' | jq '.data | {tags, prerequisites, source: (.source | length), progression: (.progression | length)}'

curl -X POST http://localhost:4000/proxy/classes/2-wizard \
  -H "Content-Type: application/json" \
  -d '{"cobalt": "test_session"}' | jq '.data | {tags, prerequisites, source: (.source | length), progression: (.progression | length)}'

curl -X POST http://localhost:4000/proxy/classes/3-bard \
  -H "Content-Type: application/json" \
  -d '{"cobalt": "test_session"}' | jq '.data | {tags, prerequisites, source: (.source | length), progression: (.progression | length)}'
```