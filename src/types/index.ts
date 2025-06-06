// D&D Beyond data types
export interface DDBCharacter {
  id: number;
  name: string;
  level: number;
  race?: {
    fullName: string;
    baseRaceName: string;
    subRaceShortName?: string;
    size?: string;
    weightSpeeds?: {
      normal?: {
        walk?: number;
      };
    };
    racialTraits?: Array<{
      definition: {
        id: number;
        name: string;
        description: string;
        snippet?: string;
        activation?: {
          activationType?: string;
          activationTime?: number;
        };
      };
    }>;
  };
  classes?: DDBClass[];
  stats?: DDBAbilityScore[];
  modifiers?: Record<string, DDBModifier[]>;
  inventory?: DDBItem[];
  spells?: Record<string, DDBSpell[]>;
  baseHitPoints?: number;
  bonusHitPoints?: number;
  overrideHitPoints?: number;
  removedHitPoints?: number;
  temporaryHitPoints?: number;
  currentXp?: number;
  alignmentId?: number;
  spellcastingAbilityId?: number;
  currencies?: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  background?: {
    definition?: {
      id?: number;
      name: string;
      featureName?: string;
      featureDescription?: string;
      languagesDescription?: string;
    };
  };
  notes?: {
    backstory?: string;
    appearance?: string;
    personalityTraits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
  };
  decorations?: {
    avatarUrl?: string;
  };
  avatarUrl?: string;
  feats?: Array<{
    definition: {
      id: number;
      name: string;
      description: string;
      snippet?: string;
      prerequisite?: string;
    };
  }>;
  optionalClassFeatures?: Array<{
    definition: {
      id: number;
      name: string;
      description: string;
      snippet?: string;
      prerequisite?: string;
    };
  }>;
  [key: string]: any;
}

export interface DDBClass {
  id: number;
  definition: {
    id: number;
    name: string;
    hitDie: number;
  };
  subclassDefinition?: {
    id: number;
    name: string;
    classFeatures?: DDBClassFeature[];
  };
  level: number;
  classFeatures?: DDBClassFeature[];
}

export interface DDBAbilityScore {
  id: number;
  value: number;
  bonus?: number;
}

export interface DDBModifier {
  id: string;
  entityId: number;
  entityTypeId: number;
  type: string;
  subType: string;
  value: number;
  friendlyTypeName: string;
  friendlySubtypeName: string;
}

export interface DDBItem {
  id: number;
  definition: {
    id: number;
    name: string;
    type: string;
    rarity: string;
    magic: boolean;
    description: string;
    snippet?: string;
    weight?: number;
    cost?: {
      quantity: number;
      unit: string;
    };
  };
  quantity: number;
  equipped: boolean;
  [key: string]: any;
}

export interface DDBSpell {
  id: number;
  definition: {
    id: number;
    name: string;
    level: number;
    school: string;
    duration: {
      durationInterval: number;
      durationUnit: string;
      durationType: string;
    };
    range: {
      aoeType?: string;
      aoeSize?: number;
      origin: string;
      rangeValue?: number;
    };
    components: {
      verbal: boolean;
      somatic: boolean;
      material: boolean;
      materialComponent?: string;
    };
    description: string;
    higherLevelDescription?: string;
    castingTime: string;
    ritualCastingTime?: string;
    ritual: boolean;
    concentration: boolean;
  };
  prepared: boolean;
  countsAsKnownSpell: boolean;
  usesSpellSlot: boolean;
  castAtLevel?: number;
  [key: string]: any;
}

export interface DDBClassFeature {
  id: number;
  name: string;
  description: string;
  snippet?: string;
  requiredLevel: number;
  prerequisite?: string;
  displayOrder?: number;
  activation?: {
    activationType?: string;
    activationTime?: number;
  };
  definition?: {
    id: number;
    name: string;
    description: string;
    snippet?: string;
    level: number;
    classId: number;
  };
}

// FoundryVTT data types
export interface FoundryCharacterData {
  name: string;
  type: 'character';
  system: {
    abilities: {
      [key: string]: {
        value: number;
        proficient?: number;
        bonuses?: {
          check?: string;
          save?: string;
        };
      };
    };
    attributes: {
      hp: {
        value: number;
        max: number;
        temp?: number;
        tempmax?: number;
      };
      ac: {
        flat?: number;
        calc?: string;
        formula?: string;
      };
      prof: number;
    };
    details: {
      biography: {
        value: string;
        public?: string;
      };
      alignment?: string;
      race?: string;
      background?: string;
      originalClass?: string;
      xp: {
        value: number;
      };
      level: number;
    };
    traits: {
      size: string;
      languages: {
        value: string[];
        custom?: string;
      };
      dr: {
        value: string[];
        custom?: string;
      };
      di: {
        value: string[];
        custom?: string;
      };
      dv: {
        value: string[];
        custom?: string;
      };
      ci: {
        value: string[];
        custom?: string;
      };
    };
    currency: {
      pp: number;
      gp: number;
      ep: number;
      sp: number;
      cp: number;
    };
  };
  items?: any[];
}

// FoundryVTT Actor data structure (comprehensive)
export interface FoundryActor {
  name: string;
  type: string;
  img?: string;
  system: {
    abilities: Record<string, {
      value: number;
      proficient: number;
      bonuses: {
        check: string;
        save: string;
      };
      min?: number;
      mod?: number;
    }>;
    attributes: {
      ac: {
        flat: number | null;
        calc: string;
        formula: string;
      };
      hp: {
        value: number;
        max: number;
        temp: number;
        tempmax: number;
        bonuses?: {
          level: string;
          overall: string;
        };
      };
      init?: {
        ability: string;
        bonus: number;
        mod?: number;
        prof?: number;
        total?: number;
      };
      movement: {
        walk: number;
        climb: number;
        swim: number;
        fly: number;
        burrow: number;
        hover: boolean;
        units: string;
      };
      senses: {
        darkvision: number;
        blindsight: number;
        tremorsense: number;
        truesight: number;
        units: string;
        special: string;
      };
      prof: number;
      spellcasting: string;
      spelldc: number;
      encumbrance?: {
        value: number;
        max: number;
        pct: number;
        encumbered: boolean;
      };
    };
    skills: Record<string, {
      value: number;
      proficient?: number;
      bonuses: {
        check: string;
        passive: string;
      };
      ability: string;
      label?: string;
      mod?: number;
      prof?: number;
      total?: number;
      passive?: number;
    }>;
    spells: Record<string, any>;
    resources: Record<string, any>;
    bonuses?: {
      mwak?: { attack: string; damage: string; };
      rwak?: { attack: string; damage: string; };
      msak?: { attack: string; damage: string; };
      rsak?: { attack: string; damage: string; };
      abilities?: { check: string; save: string; skill: string; };
      spell?: { dc: string; };
    };
    details: {
      biography: {
        value: string;
        public: string;
      };
      alignment: string;
      race: string;
      background: string;
      originalClass: string;
      xp: {
        value: number;
        max: number;
        pct: number;
      };
      level?: number;
      classes?: Record<string, {
        levels: number;
        subclass: string;
        hitDice: { used: number; max: number; };
        advancement: any[];
        spellcasting: string;
      }>;
      appearance?: string;
      trait?: string;
      ideal?: string;
      bond?: string;
      flaw?: string;
    };
    traits: {
      size: string;
      di: {
        value: string[];
        custom?: string;
      };
      dr: {
        value: string[];
        custom?: string;
      };
      dv: {
        value: string[];
        custom?: string;
      };
      ci: {
        value: string[];
        custom?: string;
      };
      languages?: {
        value: string[];
        custom?: string;
      };
      weaponProf?: {
        value: string[];
        custom?: string;
      };
      armorProf?: {
        value: string[];
        custom?: string;
      };
      toolProf?: {
        value: string[];
        custom?: string;
      };
    };
    currency: {
      pp: number;
      gp: number;
      ep: number;
      sp: number;
      cp: number;
    };
  };
  items?: any[];
  effects?: any[];
  flags?: {
    'beyond-foundry'?: {
      ddbCharacterId?: number;
      lastSync?: number;
      originalData?: any;
      parsingVersion?: string;
      features?: string[];
    };
  };
}

// Import options
export interface ImportOptions {
  importItems: boolean;
  importSpells: boolean;
  updateExisting: boolean;
  createCompendiumItems: boolean;
  spellPreparationMode?: 'prepared' | 'pact' | 'always' | 'atwill' | 'innate';
}

// API response types
export interface ImportResult {
  success: boolean;
  actor?: any; // FoundryVTT Actor - using any until we have proper types
  errors?: string[];
  warnings?: string[];
  importedItems?: number;
  importedSpells?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  userId?: string;
}

export interface CharacterListResponse {
  success: boolean;
  characters?: DDBCharacter[];
  error?: string;
}

// Settings types
export type ImportPolicy = 'ask' | 'update' | 'replace' | 'skip';

export interface ModuleSettings {
  proxyUrl: string;
  useDockerProxy: boolean;
  apiEndpoint: string;
  debugMode: boolean;
  autoImportItems: boolean;
  importPolicy: ImportPolicy;
  cobaltToken: string;
}

// Spell parsing types
export interface FoundrySpell {
  name: string;
  type: 'spell';
  img: string;
  system: {
    description: {
      value: string;
      chat: string;
      unidentified: string;
    };
    source: string;
    activation: {
      type: string;
      cost: number;
      condition: string;
    };
    duration: {
      value: number | null;
      units: string;
    };
    target: {
      value: number | null;
      width: number | null;
      units: string;
      type: string;
    };
    range: {
      value: number | null;
      long: number | null;
      units: string;
    };
    uses: {
      value: number | null;
      max: string;
      per: string | null;
      recovery: string;
    };
    consume: {
      type: string;
      target: string;
      amount: number;
      scale: boolean;
    };
    ability: string | null;
    actionType: string;
    attackBonus: string;
    chatFlavor: string;
    critical: {
      threshold: number | null;
      damage: string;
    };
    damage: {
      parts: [string, string][];
      versatile: string;
      value: string;
    };
    formula: string;
    save: {
      ability: string;
      dc: number | null;
      scaling: string;
    };
    level: number;
    school: string;
    components: {
      vocal: boolean;
      somatic: boolean;
      material: boolean;
      ritual: boolean;
      concentration: boolean;
    };
    materials: {
      value: string;
      consumed: boolean;
      cost: number;
      supply: number;
    };
    preparation: {
      mode: string;
      prepared: boolean;
    };
    scaling: {
      mode: string;
      formula: string;
    };
    properties: string[];
  };
  effects: any[];
  flags: {
    'beyond-foundry'?: {
      ddbId: number;
      sourceId: number;
      spellListId?: number;
      prepared: boolean;
      alwaysPrepared: boolean;
      usesSpellSlot: boolean;
      castAtLevel: number | null;
      restriction: string | null;
    };
    [key: string]: any;
  };
}

// FoundryVTT Actor interface for proper typing
declare global {
  interface Actor {
    items: any; // Collection of items
    createEmbeddedDocuments(type: string, data: any[]): Promise<any[]>;
    update(data: any): Promise<any>;
    getFlag(scope: string, key: string): any;
    name: string;
  }
}

export interface SpellParsingOptions {
  preparationMode?: 'prepared' | 'pact' | 'always' | 'atwill' | 'innate';
  includeUnprepared?: boolean;
  filterByLevel?: number[];
  filterBySchool?: string[];
  customIconMapping?: Record<string, string>;
}
