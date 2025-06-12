// ClassParser.ts
// Stub for ClassParser

import type { DDBClass } from '../types/index.js';

// Extend proxyData type to include new fields
interface ProxyClassData {
  features?: Array<{ name: string; description: string; requiredLevel?: number }>;
  subclasses?: Array<{ name: string; description: string; requiredLevel?: number }>;
  spellLists?: Array<{ name: string; url: string }>;
  tags?: string[];
  prerequisites?: string[];
  source?: string;
  progression?: Array<{ level?: number; features?: string[]; columns?: string[] }>;
  coreTraits?: Record<string, string>;
  sidebars?: string[];
  name?: string; // Add name for proxy extraction
  additionalTables?: unknown; // Add additionalTables for flags
}

export class ClassParser {
  /**
   * Parse a D&D Beyond class into FoundryVTT class data (full schema mapping)
   * @param ddbClass - The D&D Beyond class data
   * @param proxyData - Optional: HTML/proxy output for enrichment (e.g., zzzOutputzzz/bard-class.json)
   * @returns Parsed FoundryVTT class data
   */
  public static parseClass(
    ddbClass: DDBClass,
    proxyData?: { data?: ProxyClassData }
  ): Record<string, unknown> {
    if (!ddbClass?.definition) throw new Error('Invalid DDBClass input');
    const proxy = proxyData?.data ?? {};

    // 1. Name: Prefer proxy (from <h1 class-heading>) if available, else DDB definition
    const name = proxy.coreTraits?.Name ?? proxy.name ?? ddbClass.definition.name;

    // 2. Description: Prefer a feature named 'Class Features', else first feature, else empty
    const description = proxy.features?.find(f => f.name === 'Class Features')?.description
      ?? proxy.features?.[0]?.description
      ?? '';
    // 3. Source, Tags, Prerequisites: Ensure correct types
    const source = typeof proxy.source === 'string' ? proxy.source : '';
    const tags = Array.isArray(proxy.tags) ? proxy.tags : [];
    const prerequisites = Array.isArray(proxy.prerequisites) ? proxy.prerequisites : [];

    // 4. Core Traits: Ensure split into keys (Armor, Weapons, Tools, etc.)
    let coreTraits: Record<string, string> = {};
    if (proxy.coreTraits && typeof proxy.coreTraits === 'object') {
      coreTraits = { ...proxy.coreTraits };
    } else if (Array.isArray(proxy.coreTraits)) {
      for (const row of proxy.coreTraits) {
        const [key, ...rest] = row.split(':');
        if (key && rest.length) coreTraits[key.trim()] = rest.join(':').trim();
      }
    }

    // 5. Hit Dice
    const hdDenomination = coreTraits["Hit Die"]?.replace(/^Hit Die:\s*/i, "") ?? "d8";
    const hdAdditional = coreTraits["Unarmored Movement"] ?? "";
    const hdSpent = 0;

    // 6. Levels
    const levels = ddbClass.level ?? 1;

    // 7. Primary Abilities
    const primAb = coreTraits["Primary Ability"] ?? "";
    const primList = primAb.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    const primaryAbility = {
      value: Array.from(new Set(primList)),
      all: true
    };

    // 8. Advancement for Saves & Skills
    type Advancement = {
      type: string;
      level: number;
      configuration: Record<string, unknown>;
      value: Record<string, unknown>;
    };
    const advancement: Advancement[] = [];
    if (coreTraits["Saving Throws"]) {
      const saves = coreTraits["Saving Throws"].split(/,\s*/);
      advancement.push({
        type: "Trait",
        level: 1,
        configuration: { grants: saves.map(s => `saves:${s}`) },
        value: { chosen: saves.map(s => `saves:${s}`) }
      });
    }
    if (coreTraits["Skill Proficiencies"]) {
      const match = /choose (\d+)/i.exec(coreTraits["Skill Proficiencies"]);
      const count = match ? parseInt(match[1]) : 0;
      const optionsRaw = coreTraits["Skill Proficiencies"];
      const optionsRegex = /\(([^)]+)\)/;
      const optionsMatch = optionsRegex.exec(optionsRaw);
      const options = optionsMatch ? optionsMatch[1].split(/,\s*/) : [];
      advancement.push({
        type: "Trait",
        level: 1,
        configuration: { choices: [{ count, pool: options.map(o => `skills:${o}`) }] },
        value: { chosen: [] }
      });
    }

    // 9. Spellcasting: Map all fields if present
    let progression = 'none';
    let spellLists: Array<{ name: string; url: string }> = [];
    let spellcastingAbility = '';
    if (coreTraits["Spellcasting"] ?? proxy.features?.some(f => f.name === 'Spellcasting')) {
      const spellText = coreTraits["Spellcasting"] ?? proxy.features?.find(f => f.name === 'Spellcasting')?.description ?? '';
      if (/full[- ]?caster/i.test(spellText)) progression = 'full';
      else if (/half[- ]?caster/i.test(spellText)) progression = 'half';
      else if (/third[- ]?caster/i.test(spellText)) progression = 'third';
      else progression = 'full';
      spellcastingAbility = coreTraits["Spellcasting Ability"]?.trim() ?? '';
      if (Array.isArray(proxy.spellLists)) spellLists = proxy.spellLists;
    }
    const spellcasting = {
      progression,
      ability: spellcastingAbility,
      spellLists
    };

    // 10. Features: Assign requiredLevel, group by level in progression
    type Feature = { name: string; description: string; level?: number };
    let features: Feature[] = [];
    if (Array.isArray(proxy.features)) {
      features = proxy.features.map(f => ({
        name: f.name ?? '',
        description: f.description ?? '',
        level: typeof f.requiredLevel === 'number' ? f.requiredLevel : undefined
      }));
    }

    // 11. Subclasses: Include per-level features and requiredLevel
    type Subclass = { name: string; features: Feature[] };
    let subclass: Subclass = { name: '', features: [] };
    if (Array.isArray(proxy.subclasses) && proxy.subclasses.length > 0) {
      const sub = proxy.subclasses[0];
      subclass = {
        name: sub.name ?? '',
        features: sub.description ? [{
          name: sub.name ?? '',
          description: sub.description,
          level: typeof sub.requiredLevel === 'number' ? sub.requiredLevel : undefined
        }] : []
      };
    }

    // 12. Progression: Validate as array of level objects
    type ProgressionRow = { level?: number; features?: string[]; columns?: string[] };
    const progressionArr: ProgressionRow[] = Array.isArray(proxy.progression) ? proxy.progression.map((row): ProgressionRow => ({
      level: typeof row.level === 'number' ? row.level : undefined,
      features: Array.isArray(row.features) ? row.features : [],
      columns: Array.isArray(row.columns) ? row.columns : []
    })) : [];

    // 13. Sidebars: Pass through if present
    const sidebars = Array.isArray(proxy.sidebars) ? proxy.sidebars : [];

    // 14. Additional Tables: Store in flags if present
    const additionalTables = proxy.additionalTables ?? undefined;

    // 15. Compose FoundryVTT class item
    return {
      type: "class",
      name,
      img: "",
      system: {
        description:    { value: description },
        source,
        hd: {
          denomination: hdDenomination,
          additional:   hdAdditional,
          spent:        hdSpent
        },
        levels,
        primaryAbility,
        properties: Array.from(new Set(tags)),
        prerequisites,
        advancement,
        spellcasting,
        features,
        subclass,
        progression: progressionArr,
        coreTraits,
        sidebars,
      },
      flags: {
        "beyond-foundry": {
          originalDDB: ddbClass,
          ...proxy,
          ...(additionalTables ? { additionalTables } : {})
        }
      }
    };
  }

  /**
   * Parse an array of classes (static interface)
   * Batch class parsing with error aggregation
   */
  public static parseClassArray(classes: DDBClass[], proxyDataArr?: Array<{ data?: { features?: Array<{ name: string; description: string }>; subclasses?: Array<{ name: string; description: string }> } }>): unknown[] {
    return classes.map((cls, i) => {
      try {
        return this.parseClass(cls, proxyDataArr?.[i]);
      } catch (e) {
        return { error: (e as Error).message, classId: cls.id };
      }
    });
  }

  /**
   * Parse homebrew and custom class flags (stub: returns isHomebrew boolean)
   */
  private static parseHomebrewFlags(ddbClass: DDBClass): Record<string, unknown> {
    // Heuristic: id > 1000 or 'homebrew' in name
    return { isHomebrew: ddbClass.id > 1000 || /homebrew/i.test(ddbClass.definition.name) };
  }

  /**
   * Enhanced property parsing (stub: returns empty object)
   */
  private static parseEnhancedProperties(): Record<string, unknown> {
    // Extend for ddb-importer parity if needed
    return {};
  }

  /**
   * Additional system fields (stub: returns empty object)
   */
  private static parseAdditionalSystemFields(): Record<string, unknown> {
    // Extend for advanced class support if needed
    return {};
  }
}
