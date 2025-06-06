// D&D Beyond data types
export interface DDBCharacter {
  id: number;
  name: string;
  level: number;
  race?: {
    fullName: string;
    baseRaceName: string;
    subRaceShortName?: string;
  };
  classes?: DDBClass[];
  stats?: DDBAbilityScore[];
  modifiers?: DDBModifier[];
  inventory?: DDBItem[];
  spells?: DDBSpell[];
  [key: string]: any;
}

export interface DDBClass {
  id: number;
  definition: {
    id: number;
    name: string;
    hitDie: number;
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
  definition: {
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

// Import options
export interface ImportOptions {
  importItems: boolean;
  importSpells: boolean;
  updateExisting: boolean;
  createCompendiumItems: boolean;
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
}
