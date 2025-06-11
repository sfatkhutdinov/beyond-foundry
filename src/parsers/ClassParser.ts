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
    // Extract from proxyData if available
    const proxy = proxyData?.data ?? {};
    // Description: Prefer proxyData, fallback to empty string
    const description = proxy.features?.find(f => f.name === 'Hit Points')?.description ?? '';
    // Icon: Not available in DDBClass.definition, not in proxy, leave blank
    const img = '';
    // Proficiencies: Try to extract from proxyData
    const proficiencies = proxy.features?.find(f => f.name === 'Proficiencies')?.description ?? '';
    // Starting Equipment: Try to extract from proxyData
    const startingEquipment = proxy.features?.find(f => f.name === 'Equipment')?.description ?? '';
    // Spellcasting: Try to extract from proxyData
    const spellcastingFeature = proxy.features?.find(f => f.name === 'Spellcasting');
    const spellcasting = spellcastingFeature ? { description: spellcastingFeature.description } : {};
    // Advancement: Map features to advancement array (level, name, description)
    const advancement = (proxy.features ?? []).map(f => ({
      name: f.name,
      description: f.description,
      level: hasRequiredLevel(f) ? f.requiredLevel : undefined // Level not available in proxyData
    }));
    // Prerequisites: Use proxy.prerequisites if available
    const prerequisites: string[] = Array.isArray(proxy.prerequisites) ? proxy.prerequisites : [];
    // Properties/tags: Use proxy.tags if available, else feature names
    const properties = Array.isArray(proxy.tags) ? proxy.tags : (ddbClass.classFeatures ?? []).map(f => f.name);
    // Homebrew flag: Heuristic - id > 1000 or 'homebrew' in name (case-insensitive)
    const isHomebrew = ddbClass.id > 1000 || /homebrew/i.test(ddbClass.definition.name);
    // Subclass: Prefer DDBClass.subclassDefinition?.name
    const subclass = ddbClass.subclassDefinition?.name ?? '';
    // Features: Map all features (proxy or DDBClass)
    const features = (proxy.features ?? ddbClass.classFeatures ?? []).map(f => ({
      name: f.name,
      description: f.description,
      level: hasRequiredLevel(f) ? f.requiredLevel : undefined // Type guard for requiredLevel
    }));
    // Subclass features: Map from proxyData or DDBClass.subclassDefinition
    const subclassFeatures = (proxy.subclasses ?? ddbClass.subclassDefinition?.classFeatures ?? []).map(f => ({
      name: f.name,
      description: f.description,
      level: hasRequiredLevel(f) ? f.requiredLevel : undefined // Type guard for requiredLevel
    }));
    // Spell lists: Use proxy.spellLists if available
    const spellLists = Array.isArray(proxy.spellLists) ? proxy.spellLists : [];
    // Source: Use proxy.source if available
    const source = typeof proxy.source === 'string' ? proxy.source : '';
    // Compose FoundryVTT class item
    const foundryClass: Record<string, unknown> = {
      name: ddbClass.definition.name,
      type: 'class',
      img,
      system: {
        description: { value: description },
        source,
        identifier: ddbClass.definition.id,
        hd: {
          denomination: `d${ddbClass.definition.hitDie ?? 8}`,
          spent: 0,
          additional: '',
        },
        levels: ddbClass.level ?? 1,
        primaryAbility: {
          value: new Set<string>(), // Not available
          all: true,
        },
        properties: new Set(properties),
        spellcasting,
        advancement,
        prerequisites,
        subclass,
        features,
        subclassFeatures,
        proficiencies,
        startingEquipment,
        spellLists,
        // Add any additional system fields as needed
      },
      flags: {
        'beyond-foundry': {
          ddbId: ddbClass.id,
          isHomebrew,
          originalDDB: ddbClass,
          proxyEnrichment: !!proxyData,
        },
      },
      _id: undefined, // Let Foundry assign
    };
    // Log missing/partial data for debugging
    if (!description) console.warn(`[ClassParser] Missing description for class: ${ddbClass.definition.name}`);
    if (!proficiencies) console.warn(`[ClassParser] Missing proficiencies for class: ${ddbClass.definition.name}`);
    if (!startingEquipment) console.warn(`[ClassParser] Missing starting equipment for class: ${ddbClass.definition.name}`);
    if (!spellLists.length) console.warn(`[ClassParser] No spell lists found for class: ${ddbClass.definition.name}`);
    if (!properties.length) console.warn(`[ClassParser] No tags/properties found for class: ${ddbClass.definition.name}`);
    if (!source) console.warn(`[ClassParser] No source info found for class: ${ddbClass.definition.name}`);
    return foundryClass;
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

// Helper type guard for requiredLevel
function hasRequiredLevel(f: unknown): f is { name: string; description: string; requiredLevel: number } {
  return typeof f === 'object' && f !== null && 'requiredLevel' in f;
}
