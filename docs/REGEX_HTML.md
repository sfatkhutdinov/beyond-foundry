Here’s a structured analysis of the Rogue class HTML (from D&D Beyond) with a focus on unique hooks, data structures, and regex patterns you can use for robust scraping and extraction. This is based on the visible HTML and common D&D Beyond patterns.

---

## 1. **Top-Level Structure**

- **DOCTYPE, html, head, meta, title**: Standard HTML5 document.
- **Meta tags**: Useful for og:title, og:description, and meta[name="description"] for summary data.
- **Body**: Contains all visible content, including navigation, main content, and embedded scripts.

---

## 2. **Class Page Content Structure**

### **A. Main Class Heading**
- `<h1>`: Usually contains the class name, e.g., `<h1>Rogue</h1>`
  - **Regex**: `<h1[^>]*>(.*?)</h1>`
  - **Hook**: Use as the canonical class name.

### **B. Class Summary / Description**
- `.class-summary` or first `<p>` after `<h1>`: Contains the class description.
  - **Regex**: `<div[^>]*class="class-summary"[^>]*>([\s\S]*?)</div>` or `<h1[^>]*>.*?</h1>\s*<p>(.*?)</p>`
  - **Hook**: Use for the main class description.

### **C. Core Traits Table**
- `<table class="table-compendium table--left-all">`: Core traits (hit dice, proficiencies, etc.)
  - **Regex**: `<table[^>]*class="table-compendium table--left-all"[^>]*>([\s\S]*?)</table>`
  - **Hook**: Each `<tr>` contains a trait; `<th>` is the label, `<td>` is the value.

### **D. Progression Table**
- `<table class="table-compendium table--left-col3">` (or similar): Level progression/features.
  - **Regex**: `<table[^>]*class="table-compendium table--left-col3"[^>]*>([\s\S]*?)</table>`
  - **Caption/Heading**: `<caption>.*?<h2[^>]*>(.*?)</h2>.*?</caption>`
  - **Rows**: `<tr>([\s\S]*?)</tr>`
  - **Cells**: `<t[dh][^>]*>(.*?)</t[dh]>`
  - **Hook**: Use caption/heading to confirm it's the features table.

### **E. Features and Subclasses**
- **Features**: Usually `<h3>` or `<h4>` with IDs, followed by `<p>` or content blocks.
  - **Regex**: `<h[34][^>]*id="([^"]+)"[^>]*>(.*?)</h[34]>([\s\S]*?)(?=<h[34][^>]*id=|$)`
  - **Hook**: Use ID and heading text for feature name, following content for description.

- **Subclasses**: Often grouped at the end, with headings like `<h3>Arcane Trickster</h3>`, etc.
  - **Regex**: `<h[34][^>]*>(.*?)</h[34]>([\s\S]*?)(?=<h[34][^>]*>|$)`
  - **Hook**: Heading is subclass name, following content is description.

### **F. Sidebars**
- `<aside class="text--rules-sidebar">`: Sidebar content, quick build, tips, etc.
  - **Regex**: `<aside[^>]*class="text--rules-sidebar"[^>]*>([\s\S]*?)</aside>`
  - **Hook**: Use for quick build and tips.

---

## 3. **Other Unique Hooks**

- **Data Attributes**: Some elements may have `data-` attributes for tooltips, IDs, etc.
- **Links**: `<a href="/spells/..."` for spell references, `<a href="/features/..."` for feature links.
- **Lists**: `<ul>` and `<li>` for equipment, skills, etc.

---

## 4. **Regex Patterns for Extraction**

- **Class Name**: `<h1[^>]*>([^<]+)</h1>`
- **Class Description**: `(?:<div[^>]*class="class-summary"[^>]*>|<h1[^>]*>.*?</h1>\s*)(<p>[\s\S]*?</p>)`
- **Core Traits Table**: `<table[^>]*class="table-compendium table--left-all"[^>]*>([\s\S]*?)</table>`
- **Progression Table**: `<table[^>]*class="table-compendium table--left-col3"[^>]*>([\s\S]*?)</table>`
- **Table Caption**: `<caption>([\s\S]*?)</caption>`
- **Table Rows**: `<tr>([\s\S]*?)</tr>`
- **Table Cells**: `<t[dh][^>]*>([\s\S]*?)</t[dh]>`
- **Feature Blocks**: `<h[34][^>]*id="([^"]+)"[^>]*>([^<]+)</h[34]>([\s\S]*?)(?=<h[34][^>]*id=|$)`
- **Sidebar**: `<aside[^>]*class="text--rules-sidebar"[^>]*>([\s\S]*?)</aside>`

---

## 5. **Potential Extraction Flow**

1. **Extract class name** from `<h1>`.
2. **Extract description** from `.class-summary` or first `<p>` after `<h1>`.
3. **Extract core traits** from the first `table.table-compendium.table--left-all`.
4. **Extract progression table** from `table.table-compendium.table--left-col3` (use caption/heading to confirm).
5. **Extract features** by iterating `<h3>/<h4>` with IDs and grabbing following content.
6. **Extract subclasses** by looking for subclass headings and their content.
7. **Extract sidebars** for quick build and tips.

---

## 6. **Special Notes**

- **Multiple Tables**: There may be more than one `table-compendium`—use captions/headings to distinguish.
- **Legacy/Variant Content**: Some headings or blocks may be marked as "Legacy" or "Doesn't reflect latest rules"—use heading text to filter.
- **Tooltips/Links**: Inline `<a>` tags may reference spells, features, or other classes—extract `href` for cross-linking.

---

## 7. **Summary Table of Hooks**

| Data Type         | HTML Hook/Pattern                                 | Regex Example/Selector                                      |
|-------------------|---------------------------------------------------|-------------------------------------------------------------|
| Class Name        | `<h1>`                                            | `<h1[^>]*>([^<]+)</h1>`                                     |
| Description       | `.class-summary` or `<p>` after `<h1>`            | `<div[^>]*class="class-summary"[^>]*>([\s\S]*?)</div>`      |
| Core Traits       | `table.table--left-all`                           | `<table[^>]*class="table-compendium table--left-all"[^>]*>` |
| Progression Table | `table.table--left-col3` + caption "Features"     | `<table[^>]*class="table-compendium table--left-col3"[^>]*>`|
| Features          | `<h3>/<h4>` with IDs, followed by content         | `<h[34][^>]*id="([^"]+)"[^>]*>([^<]+)</h[34]>...`           |
| Subclasses        | `<h3>/<h4>` with subclass names                   | `<h[34][^>]*>(.*?)</h[34]>...`                              |
| Sidebars          | `<aside class="text--rules-sidebar">`             | `<aside[^>]*class="text--rules-sidebar"[^>]*>...`           |

---

**Recommendation:**  
Use these regexes and hooks to build robust, version-tolerant scrapers. Always check for both class and caption/heading text to distinguish between similar tables. For features and subclasses, use heading IDs and text as anchors, and always extract the content up to the next heading of the same or higher level.