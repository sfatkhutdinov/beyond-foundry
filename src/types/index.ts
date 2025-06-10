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
      description?: string; // Add missing description property
    };
    customBackground?: {
      featuresBackground?: unknown[];
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
  [key: string]: unknown;
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
    // Additional properties that are used in the codebase
    attackType?: number;
    properties?: unknown[];
    sourceBook?: string;
    baseItem?: string;
    avatarUrl?: string;
    largeAvatarUrl?: string;
    requiresAttunement?: boolean;
  };
  quantity: number;
  equipped: boolean;
  isAttuned?: boolean; // Added for attunement logic
  [key: string]: unknown;
}

export interface DDBFeature {
  id: number;
  definition: {
    id: number;
    name: string;
    description: string;
    snippet?: string;
    sources?: Array<{
      sourceId: number;
      sourceBook?: string;
    }>;
    activation?: {
      activationType?: number;
      activationTime?: number;
    };
    duration?: {
      durationType?: number;
      durationInterval?: number;
    };
    range?: {
      origin?: number;
      range?: number;
      longRange?: number;
      aoeType?: number;
      aoeSize?: number;
    };
    limitedUse?: {
      maxUses?: number;
      resetType?: number;
      resetDice?: {
        diceCount?: number;
        diceValue?: number;
        fixedValue?: number;
      };
    };
    damage?: Array<{
      diceCount?: number;
      diceValue?: number;
      fixedValue?: number;
      damageTypeId?: number;
    }>;
    saveType?: number;
    saveDc?: number;
    attackType?: number;
    attackBonus?: number;
    prerequisite?: string;
    sourceType?: string;
    sourceId?: number;
    entityTypeId?: number;
    spellCastingAbilityId?: number;
    formula?: string;
    concentration?: boolean;
  };
  levelScale?: {
    id: number;
    level: number;
    description: string;
    dice?: {
      diceCount: number;
      diceValue: number;
      fixedValue?: number;
    };
  };
  classId?: number;
  componentId?: number;
  componentTypeId?: number;
  isGranted?: boolean;
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
    sources?: Array<{
      sourceId: number;
      pageNumber?: number;
      sourceType?: string;
    }>;
  };
  prepared: boolean;
  countsAsKnownSpell: boolean;
  usesSpellSlot: boolean;
  castAtLevel?: number;
  spellListId?: number | null;
  alwaysPrepared?: boolean;
  restriction?: string | null;
  [key: string]: unknown;
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

// Minimal stubs for parser compatibility (expand as needed)
export interface DDBMonster {
  id: number;
  name: string;
  // Add more fields as needed for monster parsing
  [key: string]: unknown;
}

export interface DDBAdventure {
  id: number;
  name: string;
  // Add more fields as needed for adventure parsing
  [key: string]: unknown;
}

export interface DDBBackground {
  id: number;
  name: string;
  // Add more fields as needed for background parsing
  [key: string]: unknown;
}

export interface DDBRace {
  id: number;
  name: string;
  // Add more fields as needed for race parsing
  [key: string]: unknown;
}

export interface DDBRule {
  id: number;
  name: string;
  // Add more fields as needed for rule parsing
  [key: string]: unknown;
}

export interface DDBFeat {
  id: number;
  name: string;
  // Add more fields as needed for feat parsing
  [key: string]: unknown;
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
  items?: FoundryItemData[];
}

// FoundryVTT Actor data structure (comprehensive)
export interface FoundryActor {
  name: string;
  type: string;
  img?: string;
  system: {
    abilities: Record<
      string,
      {
        value: number;
        proficient: number;
        bonuses: {
          check: string;
          save: string;
        };
        min?: number;
        mod?: number;
      }
    >;
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
    skills: Record<
      string,
      {
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
      }
    >;
    spells: Record<string, FoundrySpellSlot>;
    resources: Record<string, FoundryResource>;
    bonuses?: {
      mwak?: { attack: string; damage: string };
      rwak?: { attack: string; damage: string };
      msak?: { attack: string; damage: string };
      rsak?: { attack: string; damage: string };
      abilities?: { check: string; save: string; skill: string };
      spell?: { dc: string };
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
      classes?: Record<
        string,
        {
          levels: number;
          subclass: string;
          hitDice: { used: number; max: number };
          advancement: unknown[];
          spellcasting: string;
        }
      >;
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
  items?: FoundryItemData[];
  effects?: unknown[];
  flags?: {
    'beyond-foundry'?: {
      ddbCharacterId?: number;
      lastSync?: number;
      originalData?: unknown;
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
  spellCompendiumName?: string; // Added for compendium spell linking
  itemCompendiumName?: string; // Added for compendium item linking
}

// API response types
export interface ImportResult {
  success: boolean;
  actor?: FoundryActor;
  errors?: string[];
  warnings?: string[];
  importedItems?: number;
  importedSpells?: number;
  endpoint: string; // Required to match APIResponse
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
  effects: unknown[];
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
    [key: string]: unknown;
  };
}

export interface SpellParsingOptions {
  preparationMode?: 'prepared' | 'pact' | 'always' | 'atwill' | 'innate';
  includeUnprepared?: boolean;
  filterByLevel?: number[];
  filterBySchool?: string[];
  customIconMapping?: Record<string, string>;
}

// API Response types for endpoints
export interface APIResponse {
  success: boolean;
  endpoint: string;
  error?: string;
}

export interface CharacterEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    ddbCharacter: DDBCharacter;
    foundryActor: FoundryActor;
    metadata: {
      sourceId: string;
      importedAt: string;
      version: string;
    };
  };
  totalItems?: number;
  totalSpells?: number;
  totalFeatures?: number;
}

export interface ItemEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    items: FoundryItemData[];
    categories?: ItemCategory;
    containers?: FoundryItemData[];
    inventory?: {
      equipped: FoundryItemData[];
      backpack: FoundryItemData[];
      containers: FoundryItemData[];
    };
    encumbrance?: EncumbranceData;
    summary: {
      totalItems?: number;
      equipped?: number;
      magical?: number;
      totalWeight?: number;
      totalValue?: number;
    };
  };
}

export interface SpellEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    spells: FoundrySpell[];
    spellsByLevel: Record<number, FoundrySpell[]>;
    summary: {
      totalSpells: number;
      preparedSpells: number;
      knownSpells: number;
      cantrips: number;
      highestLevel: number;
    };
  };
}

export interface FeatureEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    features: FoundryFeature[];
    categories: {
      classFeatures: FoundryFeature[];
      raceFeatures: FoundryFeature[];
      feats: FoundryFeature[];
      backgroundFeatures: FoundryFeature[];
    };
    summary: {
      totalFeatures: number;
      withUses: number;
      passive: number;
    };
  };
}

export interface ActionsEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    actions: CharacterAction[];
    categories: {
      attacks: CharacterAction[];
      spellAttacks: CharacterAction[];
      other: CharacterAction[];
    };
    summary: {
      totalActions: number;
      weaponAttacks: number;
      spellAttacks: number;
    };
  };
}

export interface CurrencyEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    raw: Record<string, number>;
    foundryFormat: Record<string, number>;
    summary: {
      totalGoldValue: number;
      currencies: number;
    };
  };
}

export interface StoryEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    background: {
      name: string;
      description: string;
      feature: string;
      featureDescription: string;
    };
    personality: {
      traits: string[];
      ideals: string[];
      bonds: string[];
      flaws: string[];
    };
    biography: {
      appearance: string;
      backstory: string;
      allies: string;
    };
    notes: string;
    foundryJournalEntry: any;
  };
}

export interface DebugStatusResponse extends APIResponse {
  data?: {
    module: {
      id: string;
      version: string;
      active: boolean;
    };
    proxy: {
      url: string;
      connected: boolean;
      lastTest: string;
    };
    foundry: {
      version: string;
      system: string;
      world: string;
    };
    authentication: {
      hasToken: boolean;
      tokenValid: boolean;
    };
  };
}

export interface ExportResponse extends APIResponse {
  characterId: string;
  data?: any;
  downloadUrl?: string;
}

// Additional types for RouteHandler methods
export interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img?: string;
  system: FoundryItemSystemData;
  flags?: Record<string, unknown>;
  toObject(): FoundryItemData;
}

export interface FoundryItemData {
  name: string;
  type: string;
  img?: string;
  system: FoundryItemSystemData;
  flags?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ItemCategory {
  weapons: FoundryItemData[];
  armor: FoundryItemData[];
  equipment: FoundryItemData[];
  consumables: FoundryItemData[];
  tools: FoundryItemData[];
  containers: FoundryItemData[];
  loot: FoundryItemData[];
  [key: string]: FoundryItemData[];
}

export interface EncumbranceData {
  current: number;
  max: number;
  percentage: number;
  encumbered: boolean;
  heavily: boolean;
  total: {
    value: number;
    weight: number;
  };
}

export interface CharacterAction {
  id: string;
  name: string;
  type: string;
  actionType: string;
  description: string;
  activation?: {
    type: string;
    cost: number;
    condition?: string;
  };
  range?: {
    value: number | null;
    long?: number | null;
    units: string;
  };
  target?: {
    value: number | null;
    width?: number | null;
    units: string;
    type: string;
  };
  damage?: {
    parts: [string, string][];
    versatile?: string;
  };
  save?: {
    ability: string;
    dc: number | null;
    scaling: string;
  };
  [key: string]: any;
}

export interface WeaponDamage {
  parts: [string, string][];
  versatile: string;
  value: string;
}

export interface WeaponRange {
  value: number | null;
  long: number | null;
  units: string;
}

export interface DDBCurrency {
  id: number;
  name: string;
  value: number;
  abbreviation?: string;
}

export interface CharacterStory {
  background: {
    name: string;
    description: string;
    feature: string;
    featureDescription: string;
  };
  personality: {
    traits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
  };
  biography: {
    appearance: string;
    backstory: string;
    allies: string;
  };
  notes: string;
}

export interface JournalEntry {
  id: string;
  name: string;
  content: string;
  folder?: string;
  sort?: number;
  ownership?: Record<string, number>;
  flags?: Record<string, any>;
}

export interface FileData {
  content: string;
  mimeType?: string;
  encoding?: string;
  metadata?: Record<string, unknown>;
}

// Additional system data interfaces
export interface FoundryItemSystemData {
  description?: {
    value: string;
    chat?: string;
    unidentified?: string;
  };
  source?: string;
  quantity?: number;
  weight?: number;
  price?: {
    value: number;
    denomination?: string;
  };
  equipped?: boolean;
  identified?: boolean;
  activation?: {
    type: string;
    cost: number;
    condition?: string;
  };
  duration?: {
    value: number | null;
    units: string;
  };
  target?: {
    value: number | null;
    width?: number | null;
    units: string;
    type: string;
  };
  range?: {
    value: number | null;
    long?: number | null;
    units: string;
  };
  uses?: {
    value: number | null;
    max: string | number;
    per: string | null;
    recovery?: string;
  };
  consume?: {
    type: string;
    target: string;
    amount: number;
    scale?: boolean;
  };
  ability?: string | null;
  actionType?: string;
  attackBonus?: string;
  chatFlavor?: string;
  critical?: {
    threshold: number | null;
    damage: string;
  };
  damage?: {
    parts: [string, string][];
    versatile?: string;
    value?: string;
  };
  formula?: string;
  save?: {
    ability: string;
    dc: number | null;
    scaling?: string;
  };
  rarity?: string;
  requirements?: string;
  recharge?: {
    value: number | null;
    charged: boolean;
  };
  type?: {
    value: string;
    subtype?: string;
  };
  [key: string]: unknown;
}

export interface FoundryFeature {
  id: string;
  name: string;
  type: 'feat';
  img?: string;
  system: {
    description: {
      value: string;
      chat?: string;
      unidentified?: string;
    };
    source?: string;
    activation?: {
      type: string;
      cost: number;
      condition?: string;
    };
    duration?: {
      value: number | null;
      units: string;
    };
    target?: {
      value: number | null;
      width?: number | null;
      units: string;
      type: string;
    };
    range?: {
      value: number | null;
      long?: number | null;
      units: string;
    };
    uses?: {
      value: number | null;
      max: string | number;
      per: string | null;
      recovery?: string;
    };
    consume?: {
      type: string;
      target: string;
      amount: number;
      scale?: boolean;
    };
    requirements?: string;
    recharge?: {
      value: number | null;
      charged: boolean;
    };
    type?: {
      value: string;
      subtype?: string;
    };
    [key: string]: unknown;
  };
  effects?: unknown[];
  flags?: Record<string, unknown>;
}

export interface FoundrySpellSlot {
  value: number;
  max: number;
  override?: number | null;
}

export interface FoundryResource {
  value: number;
  max: number;
  sr?: boolean; // short rest
  lr?: boolean; // long rest
  label?: string;
}
