Here is a detailed fix plan for the D&D Beyond class extraction logic, specifically addressing the issues with the druid class and similar classes that do not use the same table/sidebar structure as wizard:

---

## Druid Class Extraction Logic: Detailed Fix Plan

### 1. **Problem Recap**
- The current extraction logic expects tables (`table.table-compendium.table--features`, `table.table-compendium.table--left-all`) and sidebars (`aside.text--rules-sidebar`) for progression, core traits, and sidebars.
- The druid class HTML (and many others) does **not** use these structures. Instead, features, traits, and progression are presented as a sequence of headings and paragraphs, often within a single main content column.

---

### 2. **HTML Structure Analysis (Druid Example)**
- **Features**: Rendered as a series of `<h3>` or `<h4>` headings, each followed by one or more `<p>` or `<div>` elements containing the description.
- **Core Traits**: Sometimes listed at the top in a summary block, not in a table.
- **Progression Table**: May be missing entirely, or replaced by descriptive text.
- **Sidebars**: May not exist at all.
- **Subclasses**: Usually appear as their own heading/section, not in a sidebar.

---

### 3. **Fix Plan: Extraction Logic**

#### A. **Generalize Feature Extraction**
- **Current:** Only extracts from tables or specific containers.
- **Fix:**  
  - Parse the main content area for a sequence of headings (e.g., `<h3>`, `<h4>`) that represent feature names.
  - For each heading, collect all sibling `<p>`, `<div>`, or `<ul>` elements until the next heading of the same or higher level.
  - Build a feature object: `{ name: headingText, description: joinedParagraphs }`.

#### B. **Core Traits Extraction**
- **Current:** Looks for a specific table.
- **Fix:**  
  - At the top of the main content, look for a summary block (could be a `<div>`, `<section>`, or a set of `<p>`s) with key-value pairs (e.g., "Primary Ability: Wisdom").
  - Use regex or DOM traversal to extract these as `{ trait: value }` pairs.

#### C. **Progression Table Extraction**
- **Current:** Expects a table with a specific class.
- **Fix:**  
  - If the table is missing, look for a section with a heading like "Class Features by Level" or similar.
  - If not found, skip progression extraction for this class and log a warning (as some classes simply do not have a progression table).

#### D. **Sidebar Extraction**
- **Current:** Looks for `aside.text--rules-sidebar`.
- **Fix:**  
  - If not found, skip sidebar extraction.
  - Optionally, look for any `<aside>` or `<div>` with a class containing "sidebar" or "callout" as a fallback.

#### E. **Subclasses Extraction**
- **Current:** May expect a sidebar or table.
- **Fix:**  
  - Look for headings like "Subclasses" or "Circle of the Land" (for druid) in the main content.
  - Extract the heading and following paragraphs as the subclass description.

#### F. **Tags, Prerequisites, Source**
- **Current:** May expect a table or sidebar.
- **Fix:**  
  - Look for a section at the top or bottom of the page with "Tags", "Prerequisites", or "Source".
  - If not found, leave these fields empty.

---

### 4. **Implementation Steps**

1. **Update the main extraction function** to:
   - Detect which structure is present (table-based or heading-based).
   - Route to the appropriate extraction subroutine.

2. **Refactor feature extraction** to:
   - Use a generic "heading and content" parser for classes like druid.
   - Fallback to table-based extraction for classes like wizard.

3. **Add robust logging** to indicate which extraction path was used and what was found/missed.

4. **Test extraction** on multiple classes (druid, wizard, bard, etc.) to ensure both table-based and heading-based logic work.

5. **Document the new extraction logic** in the code and in the developer documentation.

---

### 5. **Edge Cases & Future-Proofing**

- Some classes may mix both structures; extraction logic should be able to handle both in a single pass.
- If D&D Beyond changes their HTML structure, log a warning and output as much as possible.
- Always validate extracted data against the expected FoundryVTT schema.

---

### 6. **References for Implementation**

- ddb-importer: `/src/parser/character/` and `/src/parser/classes/` for robust feature extraction patterns.
- Beyond20: DOM parsing strategies for dynamic web content.

---

**Summary:**  
The extraction logic must be made flexible to handle both table-based and heading-based class pages. For the druid and similar classes, parse features and traits from headings and their following content, not just tables. Add fallback logic, robust logging, and test across multiple class types.