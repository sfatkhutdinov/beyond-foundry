/**
 * Type definitions for Beyond Foundry module
 */

/* -------------------------------------------- */
/*  D&D Beyond API Types                        */
/* -------------------------------------------- */

export interface DDBCharacter {
  id: number;
  name: string;
  avatarUrl?: string;
  frameAvatarUrl?: string;
  backdropAvatarUrl?: string;
  smallBackdropAvatarUrl?: string;
  largeBackdropAvatarUrl?: string;
  thumbnailBackdropAvatarUrl?: string;
  defaultBackdrop?: {
    backdropAvatarUrl?: string;
    smallBackdropAvatarUrl?: string;
    largeBackdropAvatarUrl?: string;
    thumbnailBackdropAvatarUrl?: string;
  };
  themeColor?: {
    themeColorId: number;
    backgroundColor: string;
    name: string;
  };
  campaign?: {
    id: number;
    name: string;
    description: string;
    link: string;
    publicNotes: string;
    dmUsername: string;
    dmUserId: number;
    players: Array<{
      userId: number;
      username: string;
      characterId: number;
      characterName: string;
      characterUrl: string;
    }>;
  };
  data: DDBCharacterData;
}

export interface DDBCharacterData {
  id: number;
  userId: number;
  username: string;
  isAssignedToPlayer: boolean;
  readonlyUrl: string;
  avatarUrl: string;
  frameAvatarUrl: string;
  backdropAvatarUrl: string;
  smallBackdropAvatarUrl: string;
  largeBackdropAvatarUrl: string;
  thumbnailBackdropAvatarUrl: string;
  defaultBackdrop: {
    backdropAvatarUrl: string;
    smallBackdropAvatarUrl: string;
    largeBackdropAvatarUrl: string;
    thumbnailBackdropAvatarUrl: string;
  };
  themeColor: {
    themeColorId: number;
    backgroundColor: string;
    name: string;
  };
  name: string;
  socialName: string;
  gender: string;
  faith: string;
  age: string;
  hair: string;
  eyes: string;
  skin: string;
  height: string;
  weight: string;
  inspiration: boolean;
  baseHitPoints: number;
  bonusHitPoints: number;
  overrideHitPoints: number;
  removedHitPoints: number;
  temporaryHitPoints: number;
  currentXp: number;
  alignmentId: number;
  lifestyleId: number;
  stats: DDBStat[];
  bonusStats: DDBStat[];
  overrideStats: DDBStat[];
  background: DDBBackground;
  race: DDBRace;
  notes: {
    allies: string;
    personalPossessions: string;
    otherHoldings: string;
    organizations: string;
    enemies: string;
    backstory: string;
    otherNotes: string;
  };
  traits: DDBTrait[];
  preferences: DDBPreferences;
  configuration: DDBConfiguration;
  lifestyle: DDBLifestyle;
  inventory: DDBInventoryItem[];
  currencies: DDBCurrency;
  classes: DDBClass[];
  feats: DDBFeat[];
  customItems: DDBCustomItem[];
  campaign: DDBCampaign;
  creatures: DDBCreature[];
  optionalClassFeatures: DDBOptionalClassFeature[];
  optionalOriginFeatures: DDBOptionalOriginFeature[];
  choices: DDBChoice[];
  actions: DDBAction[];
  modifiers: DDBModifier[];
  classSpells: DDBClassSpell[];
  spells: DDBSpell[];
  customDefenseAdjustments: DDBCustomDefenseAdjustment[];
  customSenses: DDBCustomSense[];
  customSpeeds: DDBCustomSpeed[];
  customProficiencies: DDBCustomProficiency[];
  customActions: DDBCustomAction[];
  characterValues: DDBCharacterValue[];
  conditions: DDBCondition[];
  deathSaves: DDBDeathSaves;
  adjustmentXp: number;
  spellSlots: DDBSpellSlot[];
  pactMagic: DDBPactMagic[];
  activeSourceCategories: number[];
  spellsKnown: DDBSpellsKnown;
  spellsAlwaysKnown: DDBSpellsAlwaysKnown;
  spellsPrepared: DDBSpellsPrepared;
  proficiencyBonus: number;
  explorationToolCheck: number;
  inspirationDice: DDBInspirationDice[];
  customBackgroundDefinition: DDBCustomBackgroundDefinition | null;
  customBackgroundFeatureDescription: string | null;
  customBackgroundCharacteristics: DDBCustomBackgroundCharacteristics | null;
  decorations: DDBDecoration;
  companionDefinitions: DDBCompanionDefinition[];
}

export interface DDBStat {
  id: number;
  entityTypeId: number;
  entityId: number;
  fixedValue: number;
  increment: number;
  value: number;
}

export interface DDBBackground {
  definition: {
    id: number;
    entityTypeId: number;
    name: string;
    description: string;
    snippet: string;
    shortDescription: string;
    skillProficienciesDescription: string;
    languageProficienciesDescription: string;
    equipmentDescription: string;
    featureName: string;
    featureDescription: string;
    avatarUrl: string;
    largeAvatarUrl: string;
    suggestedCharacteristicsDescription: string;
    suggestedPersonalityTraits: string;
    suggestedIdeals: string;
    suggestedBonds: string;
    suggestedFlaws: string;
    organization: string | null;
    contractsDescription: string | null;
    spellListIds: number[];
    isHomebrew: boolean;
    sources: DDBSource[];
    spellRules: DDBSpellRules | null;
    classRestrictions: DDBClassRestriction[];
    raceRestrictions: DDBRaceRestriction[];
    requiresVariant: boolean;
    languageDescription: string | null;
    skillDescription: string | null;
    toolDescription: string | null;
  };
  definitionId: number;
  customBackground: DDBCustomBackground;
}

export interface DDBRace {
  isSubRace: boolean;
  baseRaceName: string;
  entityRaceId: number;
  entityRaceTypeId: number;
  fullName: string;
  baseRaceId: number;
  baseRaceTypeId: number;
  description: string;
  avatarUrl: string | null;
  largeAvatarUrl: string | null;
  portraitAvatarUrl: string | null;
  moreDetailsUrl: string;
  isHomebrew: boolean;
  isLegacy: boolean;
  groupIds: number[];
  type: number;
  supportsSubrace: boolean;
  subRaceShortName: string;
  baseName: string;
  racialTraits: DDBRacialTrait[];
  languageDescription: string | null;
  skillDescription: string | null;
  resistanceDescription: string | null;
  movementDescription: string | null;
  senseDescription: string | null;
  additionalSpellsDescription: string | null;
  proficiencyDescription: string | null;
  sourcePageNumber: number | null;
  sourceId: number | null;
  sourceUrl: string | null;
  sources: DDBSource[];
  colorDescription: string | null;
  weightSpeeds: DDBWeightSpeed;
  featIds: number[];
  size: string;
  sizeId: number;
  variants: DDBVariant[];
}

export interface DDBTrait {
  definition: {
    id: number;
    entityTypeId: number;
    name: string;
    description: string;
    snippet: string;
    activation: DDBActivation;
    multiUse: boolean;
    limitedUse: DDBLimitedUse[];
    sources: DDBSource[];
    spellListIds: number[];
    additionalDescription: string;
    entityTypeID: number;
    displayOrder: number;
  };
  definitionId: number;
  displayOrder: number;
}

/* -------------------------------------------- */
/*  Module Configuration Types                  */
/* -------------------------------------------- */

export interface BeyondFoundrySettings {
  debugMode: boolean;
  autoSync: boolean;
  syncInterval: number;
  apiEndpoint: string;
  defaultImportOptions: ImportOptions;
}

export interface ImportOptions {
  importSpells: boolean;
  importEquipment: boolean;
  importFeatures: boolean;
  importBiography: boolean;
  overrideExisting: boolean;
  createBackup: boolean;
}

/* -------------------------------------------- */
/*  Import Result Types                         */
/* -------------------------------------------- */

export interface ImportResult {
  success: boolean;
  characterId?: string;
  errors: string[];
  warnings: string[];
  imported: {
    character: boolean;
    spells: number;
    equipment: number;
    features: number;
  };
}

/* -------------------------------------------- */
/*  Socket Message Types                        */
/* -------------------------------------------- */

export interface SocketMessage {
  type: 'import-progress' | 'import-complete' | 'import-error';
  userId: string;
  data: unknown;
}

/* -------------------------------------------- */
/*  Utility Types                              */
/* -------------------------------------------- */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ModuleAPI {
  importCharacter: (characterUrl: string, options?: Partial<ImportOptions>) => Promise<ImportResult>;
  getCharacterList: () => Promise<DDBCharacter[]>;
  syncCharacter: (characterId: string) => Promise<ImportResult>;
}

// Additional placeholder interfaces that would need to be expanded
export interface DDBSource { id: number; name: string; }
export interface DDBSpellRules { }
export interface DDBClassRestriction { }
export interface DDBRaceRestriction { }
export interface DDBCustomBackground { }
export interface DDBRacialTrait { }
export interface DDBWeightSpeed { }
export interface DDBVariant { }
export interface DDBActivation { }
export interface DDBLimitedUse { }
export interface DDBPreferences { }
export interface DDBConfiguration { }
export interface DDBLifestyle { }
export interface DDBInventoryItem { }
export interface DDBCurrency { }
export interface DDBClass { }
export interface DDBFeat { }
export interface DDBCustomItem { }
export interface DDBCampaign { }
export interface DDBCreature { }
export interface DDBOptionalClassFeature { }
export interface DDBOptionalOriginFeature { }
export interface DDBChoice { }
export interface DDBAction { }
export interface DDBModifier { }
export interface DDBClassSpell { }
export interface DDBSpell { }
export interface DDBCustomDefenseAdjustment { }
export interface DDBCustomSense { }
export interface DDBCustomSpeed { }
export interface DDBCustomProficiency { }
export interface DDBCustomAction { }
export interface DDBCharacterValue { }
export interface DDBCondition { }
export interface DDBDeathSaves { }
export interface DDBSpellSlot { }
export interface DDBPactMagic { }
export interface DDBSpellsKnown { }
export interface DDBSpellsAlwaysKnown { }
export interface DDBSpellsPrepared { }
export interface DDBInspirationDice { }
export interface DDBCustomBackgroundDefinition { }
export interface DDBCustomBackgroundCharacteristics { }
export interface DDBDecoration { }
export interface DDBCompanionDefinition { }
