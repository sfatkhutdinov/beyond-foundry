# D&D Beyond HTML Structure Analysis
*Generated: June 11, 2025*

## Analysis of Wizard Class Page Structure

Based on examination of the Wizard class HTML file, here are the correct CSS selectors for class extraction:

## ✅ WORKING SELECTORS (Confirmed)

### Core Traits Table
**Current Selector:** `table.table-compendium.table--left-all` ✅ **CORRECT**
**HTML Structure:**
```html
<table class="table-compendium table--left-all">
    <caption>
        <h2 id="CoreWizardTraits" class="compendium-hr">Core Wizard Traits</h2>
    </caption>
    <tbody>
        <tr>
            <th>Primary Ability</th>
            <td>Intelligence</td>
        </tr>
        <tr>
            <th>Hit Point Die</th>
            <td>D6 per Wizard level</td>
        </tr>
        <!-- ... more traits -->
    </tbody>
</table>
```

### Progression Table  
**Current Selector:** `table.table-compendium.table--features` ✅ **CORRECT**
**HTML Structure:**
```html
<table class="table-compendium table--features">
    <caption>
        <h2 id="WizardFeatures" class="compendium-hr">Wizard Features</h2>
    </caption>
    <thead>
        <tr>
            <th>Level</th>
            <th>Proficiency Bonus</th>
            <th>Class Features</th>
            <th>Cantrips</th>
            <th>Prepared Spells</th>
            <th>1</th><th>2</th><!-- spell slots -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>+2</td>
            <td>Spellcasting, Ritual Adept, Arcane Recovery</td>
            <td>3</td>
            <td>4</td>
            <td>2</td><!-- spell slots continue -->
        </tr>
        <!-- ... more levels -->
    </tbody>
</table>
```

### Sidebars
**Current Selector:** `aside.text--rules-sidebar` ✅ **CORRECT**
**HTML Structure:**
```html
<aside id="ExpandingandReplacingaSpellbook" class="text--rules-sidebar">
    <p>Expanding and Replacing a Spellbook</p>
    <p>The spells you add to your spellbook as you gain levels reflect...</p>
    <!-- ... sidebar content -->
</aside>
```

## ❌ PROBLEMATIC AREAS

### Tags
**Issue:** No visible class tags in the HTML structure
**Current Selector:** `.tag, .ddb-tag` ❌ **NOT FOUND**
**Analysis:** Classes may not have traditional "tags" like spells do. Need to investigate if tags exist for classes or if this field should be removed.

### Prerequisites  
**Issue:** No prerequisite information found for base classes
**Current Selector:** Text search for "Prerequisite:" ❌ **NOT FOUND**
**Analysis:** Base classes typically don't have prerequisites (only multiclassing has prerequisites). This extraction may be unnecessary for classes.

### Source Information
**Issue:** No clear source metadata in the HTML structure  
**Current Selector:** `footer, .source, .ddb-statblock-source, .book-source` ❌ **WRONG CONTENT**
**Analysis:** The current selector is picking up the page footer, not the content source. Classes may not have explicit source markup, or it's embedded differently.

## 🔧 RECOMMENDED FIXES

### Fix 1: Core Traits Extraction (HIGH PRIORITY)
**Status:** Selector is correct, but extraction may have parsing issues
**Action:** Debug the `extractCoreTraits()` function - the selector should work

### Fix 2: Progression Table Extraction (HIGH PRIORITY)  
**Status:** Selector is correct, but extraction may have parsing issues
**Action:** Debug the `extractProgressionTable()` function - the selector should work

### Fix 3: Sidebars Extraction (MEDIUM PRIORITY)
**Status:** Selector is correct, but extraction may have parsing issues  
**Action:** Debug the `extractSidebars()` function - the selector should work

### Fix 4: Remove/Modify Tags Extraction (LOW PRIORITY)
**Status:** Classes may not have tags
**Action:** Either remove tags field or find alternative metadata

### Fix 5: Remove/Modify Prerequisites Extraction (LOW PRIORITY)
**Status:** Base classes don't have prerequisites
**Action:** Either remove prerequisites field or only extract for multiclassing context

### Fix 6: Fix Source Extraction (LOW PRIORITY)
**Status:** No clear source markup found
**Action:** May need to extract from page metadata or remove this field

## 🚨 CRITICAL FINDING

**The CSS selectors for the main failing extractions (Core Traits, Progression, Sidebars) are actually CORRECT!**

This suggests the issue is not with CSS selectors but with:
1. **Function logic bugs** in the extraction functions
2. **HTML parsing issues** in the proxy 
3. **Different HTML structure** on the druid page vs wizard page
4. **JavaScript-rendered content** that's not in the initial HTML

## Next Steps

1. **Debug the extraction functions** - The selectors are correct, so check the parsing logic
2. **Test with wizard class** - Use the wizard class to verify if extraction works
3. **Compare druid vs wizard HTML** - Check if druid page has different structure
4. **Check for JavaScript rendering** - Some content might be loaded dynamically

## Updated Assessment

| Field | Selector Status | Extraction Status | Priority |
|-------|----------------|-------------------|----------|
| Core Traits | ✅ Correct | ❌ Debug needed | High |
| Progression | ✅ Correct | ❌ Debug needed | High |
| Sidebars | ✅ Correct | ❌ Debug needed | Medium |
| Tags | ❌ No tags found | ❌ Remove field? | Low |
| Prerequisites | ❌ N/A for classes | ❌ Remove field? | Low |
| Source | ❌ No clear markup | ❌ Alternative needed | Low |
