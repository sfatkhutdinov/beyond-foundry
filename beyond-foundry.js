// Module constants
const MODULE_ID = 'beyond-foundry';
const MODULE_NAME = 'Beyond Foundry';
// API endpoints - configured for Docker environment
const DEFAULT_PROXY_URL = 'http://localhost:3100';
const DOCKER_PROXY_URL = 'http://ddb-proxy:3000';
// Settings keys
const SETTINGS = {
    PROXY_URL: 'proxyUrl',
    USE_DOCKER_PROXY: 'useDockerProxy',
    API_ENDPOINT: 'apiEndpoint',
    DEBUG_MODE: 'debugMode',
    AUTO_IMPORT_ITEMS: 'autoImportItems',
    IMPORT_POLICY: 'importPolicy',
    COBALT_TOKEN: 'cobaltToken'
};
// Default import options
const DEFAULT_IMPORT_OPTIONS = {
    importItems: true,
    importSpells: true,
    updateExisting: false,
    createCompendiumItems: true
};

/**
 * Register all module settings
 */
function registerSettings() {
    // Proxy configuration
    game.settings.register(MODULE_ID, SETTINGS.PROXY_URL, {
        name: 'beyond-foundry.settings.proxyUrl.name',
        hint: 'beyond-foundry.settings.proxyUrl.hint',
        scope: 'world',
        config: true,
        type: String,
        default: DEFAULT_PROXY_URL,
        onChange: () => window.location.reload()
    });
    game.settings.register(MODULE_ID, SETTINGS.USE_DOCKER_PROXY, {
        name: 'beyond-foundry.settings.useDockerProxy.name',
        hint: 'beyond-foundry.settings.useDockerProxy.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            if (value) {
                game.settings.set(MODULE_ID, SETTINGS.PROXY_URL, DOCKER_PROXY_URL);
            }
            else {
                game.settings.set(MODULE_ID, SETTINGS.PROXY_URL, DEFAULT_PROXY_URL);
            }
        }
    });
    // API configuration  
    game.settings.register(MODULE_ID, SETTINGS.API_ENDPOINT, {
        name: 'beyond-foundry.settings.apiEndpoint.name',
        hint: 'beyond-foundry.settings.apiEndpoint.hint',
        scope: 'world',
        config: true,
        type: String,
        default: '',
        onChange: () => window.location.reload()
    });
    // Debug mode
    game.settings.register(MODULE_ID, SETTINGS.DEBUG_MODE, {
        name: 'beyond-foundry.settings.debugMode.name',
        hint: 'beyond-foundry.settings.debugMode.hint',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });
    // Import options
    game.settings.register(MODULE_ID, SETTINGS.AUTO_IMPORT_ITEMS, {
        name: 'beyond-foundry.settings.autoImportItems.name',
        hint: 'beyond-foundry.settings.autoImportItems.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register(MODULE_ID, SETTINGS.IMPORT_POLICY, {
        name: 'beyond-foundry.settings.importPolicy.name',
        hint: 'beyond-foundry.settings.importPolicy.hint',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'ask': 'beyond-foundry.settings.importPolicy.ask',
            'update': 'beyond-foundry.settings.importPolicy.update',
            'replace': 'beyond-foundry.settings.importPolicy.replace',
            'skip': 'beyond-foundry.settings.importPolicy.skip'
        },
        default: 'ask'
    });
    // Authentication
    game.settings.register(MODULE_ID, SETTINGS.COBALT_TOKEN, {
        name: 'beyond-foundry.settings.cobaltToken.name',
        hint: 'beyond-foundry.settings.cobaltToken.hint',
        scope: 'world',
        config: false, // Hidden from UI - managed by auth dialog
        type: String,
        default: ''
    });
}
/**
 * Get a module setting value
 */
function getModuleSetting(settingKey) {
    return game.settings.get(MODULE_ID, settingKey);
}
/**
 * Get all module settings as a typed object
 */
function getModuleSettings() {
    return {
        proxyUrl: getModuleSetting(SETTINGS.PROXY_URL),
        useDockerProxy: getModuleSetting(SETTINGS.USE_DOCKER_PROXY),
        apiEndpoint: getModuleSetting(SETTINGS.API_ENDPOINT),
        debugMode: getModuleSetting(SETTINGS.DEBUG_MODE),
        autoImportItems: getModuleSetting(SETTINGS.AUTO_IMPORT_ITEMS),
        importPolicy: getModuleSetting(SETTINGS.IMPORT_POLICY),
        cobaltToken: getModuleSetting(SETTINGS.COBALT_TOKEN)
    };
}

/**
 * Logger utility for Beyond Foundry module
 */
class Logger {
    static moduleId = MODULE_ID;
    static log(message, level = 'info') {
        const prefix = `${this.moduleId} |`;
        switch (level) {
            case 'info':
                console.log(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            case 'error':
                console.error(prefix, message);
                break;
            case 'debug':
                if (game.settings.get(MODULE_ID, 'debugMode')) {
                    console.log(`${prefix} [DEBUG]`, message);
                }
                break;
        }
    }
    static info(message) {
        this.log(message, 'info');
    }
    static warn(message) {
        this.log(message, 'warn');
    }
    static error(message) {
        this.log(message, 'error');
    }
    static debug(message) {
        this.log(message, 'debug');
    }
}
// Convenience export
Logger.log.bind(Logger);
/**
 * Safely extract error message from unknown error type
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Comprehensive Character Parser for D&D Beyond to FoundryVTT D&D 5e system
 *
 * This parser implements advanced features including:
 * - Enhanced abilities with saving throw proficiencies from modifiers
 * - Skills with proficiency detection and passive scores
 * - Proper HP calculation with Constitution modifier
 * - Equipment parsing (weapons, armor, gear, magical items)
 * - Spell system with slot calculation and spellcasting attributes
 * - Movement and senses parsing (darkvision, etc.)
 * - Currency and encumbrance calculations
 * - Complete FoundryVTT D&D 5e actor structure
 */
class CharacterParser {
    /**
     * Parse a complete D&D Beyond character into FoundryVTT actor data
     * @param ddbCharacter - The D&D Beyond character data
     * @returns Foundry actor data with comprehensive parsing
     */
    static parseCharacter(ddbCharacter) {
        Logger.info(`🔮 Comprehensive parsing: ${ddbCharacter.name}`);
        const actorData = {
            name: ddbCharacter.name,
            type: 'character',
            img: ddbCharacter.decorations?.avatarUrl || 'icons/svg/mystery-man.svg',
            system: {
                abilities: this.parseAbilities(ddbCharacter),
                attributes: this.parseEnhancedAttributes(ddbCharacter),
                details: this.parseDetails(ddbCharacter),
                traits: this.parseTraits(ddbCharacter),
                currency: this.parseCurrency(ddbCharacter),
                skills: this.parseSkills(ddbCharacter),
                spells: this.parseSpells(ddbCharacter),
                resources: this.parseResources(ddbCharacter),
                bonuses: this.parseBonuses(ddbCharacter)
            },
            items: this.parseAllItems(ddbCharacter),
            effects: this.parseActiveEffects(ddbCharacter),
            flags: {
                'beyond-foundry': {
                    ddbCharacterId: ddbCharacter.id,
                    lastSync: Date.now(),
                    originalData: ddbCharacter,
                    parsingVersion: '2.0.0',
                    features: [
                        'enhanced-abilities',
                        'equipment-parsing',
                        'spell-integration',
                        'modifier-system',
                        'comprehensive-traits'
                    ]
                }
            }
        };
        Logger.info(`✅ Comprehensive parsing complete: ${actorData.name}`);
        return actorData;
    }
    /**
     * Parse abilities with all modifiers and proficiencies
     */
    static parseAbilities(ddbCharacter) {
        const abilities = {};
        const abilityMap = {
            1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
        };
        // Initialize abilities
        Object.values(abilityMap).forEach(key => {
            abilities[key] = {
                value: 10,
                proficient: 0,
                bonuses: { check: '', save: '' },
                min: 3,
                mod: 0
            };
        });
        // Apply base stats
        if (ddbCharacter.stats) {
            ddbCharacter.stats.forEach(stat => {
                const abilityKey = abilityMap[stat.id];
                if (abilityKey) {
                    abilities[abilityKey].value = stat.value || 10;
                    abilities[abilityKey].mod = this.getAbilityModifier(stat.value || 10);
                }
            });
        }
        // Apply saving throw proficiencies
        this.applySavingThrowProficiencies(ddbCharacter, abilities);
        return abilities;
    }
    /**
     * Apply saving throw proficiencies from modifiers
     */
    static applySavingThrowProficiencies(ddbCharacter, abilities) {
        const modifiers = ddbCharacter.modifiers || {};
        const abilityMap = { 1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha' };
        Object.values(modifiers).forEach(modifierArray => {
            if (Array.isArray(modifierArray)) {
                modifierArray.forEach(modifier => {
                    if (modifier.type === 'proficiency' && modifier.subType === 'saving-throws') {
                        const abilityKey = abilityMap[modifier.entityId];
                        if (abilityKey && abilities[abilityKey]) {
                            abilities[abilityKey].proficient = 1;
                            Logger.debug(`💾 Save proficiency: ${abilityKey.toUpperCase()}`);
                        }
                    }
                });
            }
        });
    }
    /**
     * Parse character attributes (HP, AC, etc.)
     */
    static parseAttributes(ddbCharacter) {
        return {
            ac: {
                flat: null,
                calc: 'default',
                formula: ''
            },
            hp: {
                value: ddbCharacter.baseHitPoints || 0,
                max: ddbCharacter.baseHitPoints || 0,
                temp: 0,
                tempmax: 0,
                bonuses: {
                    level: '',
                    overall: ''
                }
            },
            init: {
                ability: 'dex',
                bonus: 0
            },
            movement: this.parseMovement(ddbCharacter),
            senses: this.parseSenses(ddbCharacter),
            spellcasting: ddbCharacter.spellcastingAbilityId ? this.getAbilityKey(ddbCharacter.spellcastingAbilityId) : '',
            prof: this.calculateProficiencyBonus(ddbCharacter.classes || []),
            spelldc: 8 // Will be calculated based on spellcasting ability
        };
    }
    /**
     * Parse character details with comprehensive class and level information
     */
    static parseDetails(ddbCharacter) {
        const totalLevel = this.getTotalLevel(ddbCharacter);
        const primaryClass = this.getPrimaryClass(ddbCharacter);
        return {
            biography: {
                value: ddbCharacter.notes?.backstory || '',
                public: ''
            },
            alignment: ddbCharacter.alignmentId ? this.parseAlignment(ddbCharacter.alignmentId) : '',
            race: ddbCharacter.race?.fullName || '',
            background: ddbCharacter.background?.definition?.name || '',
            originalClass: primaryClass,
            level: totalLevel,
            classes: this.parseClassDetails(ddbCharacter),
            xp: {
                value: ddbCharacter.currentXp || 0,
                max: this.getXpForLevel(totalLevel + 1),
                pct: 0
            },
            appearance: ddbCharacter.notes?.appearance || '',
            trait: ddbCharacter.notes?.personalityTraits || '',
            ideal: ddbCharacter.notes?.ideals || '',
            bond: ddbCharacter.notes?.bonds || '',
            flaw: ddbCharacter.notes?.flaws || ''
        };
    }
    /**
     * Parse detailed class information
     */
    static parseClassDetails(ddbCharacter) {
        if (!ddbCharacter.classes)
            return {};
        const classDetails = {};
        ddbCharacter.classes.forEach(cls => {
            const className = cls.definition.name.toLowerCase();
            classDetails[className] = {
                levels: cls.level,
                subclass: cls.subclassDefinition?.name || '',
                hitDie: cls.definition.hitDie
            };
        });
        return classDetails;
    }
    /**
     * Parse character traits with enhanced resistances, languages, and proficiencies
     */
    static parseTraits(ddbCharacter) {
        return {
            size: this.parseSize(ddbCharacter.race?.size || 'medium'),
            senses: '',
            languages: {
                value: this.parseLanguages(ddbCharacter),
                custom: ''
            },
            di: { value: [], custom: '' }, // Damage immunities
            dr: { value: [], custom: '' }, // Damage resistances  
            dv: { value: [], custom: '' }, // Damage vulnerabilities
            ci: { value: [], custom: '' }, // Condition immunities
            weaponProf: {
                value: this.parseWeaponProficiencies(ddbCharacter),
                custom: ''
            },
            armorProf: {
                value: this.parseArmorProficiencies(ddbCharacter),
                custom: ''
            },
            toolProf: {
                value: this.parseToolProficiencies(ddbCharacter),
                custom: ''
            }
        };
    }
    /**
     * Parse weapon proficiencies from modifiers
     */
    static parseWeaponProficiencies(ddbCharacter) {
        const proficiencies = [];
        const modifiers = ddbCharacter.modifiers || {};
        Object.values(modifiers).forEach(modifierArray => {
            if (Array.isArray(modifierArray)) {
                modifierArray.forEach(modifier => {
                    if (modifier.type === 'proficiency' &&
                        modifier.subType &&
                        modifier.subType.includes('weapon')) {
                        proficiencies.push(modifier.friendlySubtypeName || modifier.subType);
                    }
                });
            }
        });
        return proficiencies;
    }
    /**
     * Parse armor proficiencies from modifiers
     */
    static parseArmorProficiencies(ddbCharacter) {
        const proficiencies = [];
        const modifiers = ddbCharacter.modifiers || {};
        Object.values(modifiers).forEach(modifierArray => {
            if (Array.isArray(modifierArray)) {
                modifierArray.forEach(modifier => {
                    if (modifier.type === 'proficiency' &&
                        modifier.subType &&
                        modifier.subType.includes('armor')) {
                        proficiencies.push(modifier.friendlySubtypeName || modifier.subType);
                    }
                });
            }
        });
        return proficiencies;
    }
    /**
     * Parse tool proficiencies from modifiers
     */
    static parseToolProficiencies(ddbCharacter) {
        const proficiencies = [];
        const modifiers = ddbCharacter.modifiers || {};
        Object.values(modifiers).forEach(modifierArray => {
            if (Array.isArray(modifierArray)) {
                modifierArray.forEach(modifier => {
                    if (modifier.type === 'proficiency' &&
                        modifier.subType &&
                        (modifier.subType.includes('tool') || modifier.subType.includes('kit'))) {
                        proficiencies.push(modifier.friendlySubtypeName || modifier.subType);
                    }
                });
            }
        });
        return proficiencies;
    }
    /**
     * Parse currency from D&D Beyond
     */
    static parseCurrency(ddbCharacter) {
        const currencies = ddbCharacter.currencies || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
        return {
            pp: currencies.pp || 0,
            gp: currencies.gp || 0,
            ep: currencies.ep || 0,
            sp: currencies.sp || 0,
            cp: currencies.cp || 0
        };
    }
    /**
     * Parse skills and proficiencies with comprehensive proficiency detection
     */
    static parseSkills(ddbCharacter) {
        const skills = {};
        // D&D 5e system skills
        const skillList = [
            'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins', 'itm', 'inv',
            'med', 'nat', 'prc', 'prf', 'per', 'rel', 'slt', 'ste', 'sur'
        ];
        skillList.forEach(skill => {
            skills[skill] = {
                value: 0, // 0 = not proficient, 1 = proficient, 2 = expertise
                ability: this.getSkillAbility(skill),
                bonuses: {
                    check: '',
                    passive: ''
                }
            };
        });
        // Apply skill proficiencies from modifiers
        this.applySkillProficiencies(ddbCharacter, skills);
        return skills;
    }
    /**
     * Apply skill proficiencies from D&D Beyond modifiers
     */
    static applySkillProficiencies(ddbCharacter, skills) {
        const modifiers = ddbCharacter.modifiers || {};
        Object.values(modifiers).forEach(modifierArray => {
            if (Array.isArray(modifierArray)) {
                modifierArray.forEach(modifier => {
                    if (modifier.type === 'proficiency' && modifier.subType) {
                        const skillKey = this.getSkillKeyFromModifier(modifier);
                        if (skillKey && skills[skillKey]) {
                            skills[skillKey].value = 1; // Proficient
                            Logger.debug(`🎯 Skill proficiency: ${skillKey}`);
                        }
                    }
                    if (modifier.type === 'expertise' && modifier.subType) {
                        const skillKey = this.getSkillKeyFromModifier(modifier);
                        if (skillKey && skills[skillKey]) {
                            skills[skillKey].value = 2; // Expertise
                            Logger.debug(`⭐ Skill expertise: ${skillKey}`);
                        }
                    }
                });
            }
        });
    }
    /**
     * Parse spell-related attributes with comprehensive spell slot calculation
     */
    static parseSpells(ddbCharacter) {
        const primaryClass = this.getPrimarySpellcastingClass(ddbCharacter);
        const spellSlots = primaryClass ?
            this.calculateSpellSlots(primaryClass.definition.name, primaryClass.level) : {};
        return {
            spell1: { value: spellSlots.spell1 || 0, override: null, max: spellSlots.spell1 || 0 },
            spell2: { value: spellSlots.spell2 || 0, override: null, max: spellSlots.spell2 || 0 },
            spell3: { value: spellSlots.spell3 || 0, override: null, max: spellSlots.spell3 || 0 },
            spell4: { value: spellSlots.spell4 || 0, override: null, max: spellSlots.spell4 || 0 },
            spell5: { value: spellSlots.spell5 || 0, override: null, max: spellSlots.spell5 || 0 },
            spell6: { value: spellSlots.spell6 || 0, override: null, max: spellSlots.spell6 || 0 },
            spell7: { value: spellSlots.spell7 || 0, override: null, max: spellSlots.spell7 || 0 },
            spell8: { value: spellSlots.spell8 || 0, override: null, max: spellSlots.spell8 || 0 },
            spell9: { value: spellSlots.spell9 || 0, override: null, max: spellSlots.spell9 || 0 },
            pact: { value: 0, override: null, max: 0, level: 1 },
            spells0: { value: 0, max: 0 },
            spells1: { value: 0, max: 0 },
            spells2: { value: 0, max: 0 },
            spells3: { value: 0, max: 0 },
            spells4: { value: 0, max: 0 },
            spells5: { value: 0, max: 0 },
            spells6: { value: 0, max: 0 },
            spells7: { value: 0, max: 0 },
            spells8: { value: 0, max: 0 },
            spells9: { value: 0, max: 0 }
        };
    }
    /**
     * Parse character resources (inspiration, etc.)
     */
    static parseResources(ddbCharacter) {
        return {
            primary: { value: 0, max: 0, sr: false, lr: false, label: '' },
            secondary: { value: 0, max: 0, sr: false, lr: false, label: '' },
            tertiary: { value: 0, max: 0, sr: false, lr: false, label: '' }
        };
    }
    // Helper methods
    static isProficientInSave(ddbCharacter, abilityId) {
        // Check if character is proficient in this saving throw
        // This would need to be implemented based on D&D Beyond data structure
        return 0;
    }
    static parseMovement(ddbCharacter) {
        return {
            burrow: 0,
            climb: 0,
            fly: 0,
            swim: 0,
            walk: ddbCharacter.race?.weightSpeeds?.normal?.walk || 30,
            units: 'ft',
            hover: false
        };
    }
    static parseSenses(ddbCharacter) {
        return {
            darkvision: 0,
            blindsight: 0,
            tremorsense: 0,
            truesight: 0,
            units: 'ft',
            special: ''
        };
    }
    static calculateProficiencyBonus(classes) {
        const totalLevel = classes.reduce((sum, cls) => sum + (cls.level || 0), 0);
        return Math.ceil(totalLevel / 4) + 1;
    }
    static getAbilityKey(abilityId) {
        const map = {
            1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
        };
        return map[abilityId] || '';
    }
    static parseAlignment(alignmentId) {
        const alignments = {
            1: 'lg', 2: 'ln', 3: 'le', 4: 'ng', 5: 'n', 6: 'ne', 7: 'cg', 8: 'cn', 9: 'ce'
        };
        return alignments[alignmentId] || 'n';
    }
    static parseSize(size) {
        const sizeMap = {
            'tiny': 'tiny',
            'small': 'sm',
            'medium': 'med',
            'large': 'lg',
            'huge': 'huge',
            'gargantuan': 'grg'
        };
        return sizeMap[size.toLowerCase()] || 'med';
    }
    static parseLanguages(ddbCharacter) {
        const languages = [];
        try {
            // Check for language racial traits
            if (ddbCharacter.race?.racialTraits && Array.isArray(ddbCharacter.race.racialTraits)) {
                for (const trait of ddbCharacter.race.racialTraits) {
                    const definition = trait.definition;
                    if (definition && definition.name === 'Languages' && definition.description) {
                        // Extract language names from the description
                        const languageMatches = definition.description.match(/\b(Common|Elvish|Dwarvish|Halfling|Draconic|Giant|Gnomish|Goblin|Orcish|Abyssal|Celestial|Deep Speech|Infernal|Primordial|Sylvan|Undercommon|Druidic)\b/gi);
                        if (languageMatches) {
                            languages.push(...languageMatches.map(lang => lang.toLowerCase()));
                        }
                    }
                }
            }
            // Check background languages
            if (ddbCharacter.background?.definition?.languagesDescription) {
                const bgLanguages = ddbCharacter.background.definition.languagesDescription;
                // If it says "Two of your choice" or similar, we can't extract specific languages
                if (!bgLanguages.includes('choice') && !bgLanguages.includes('any')) {
                    const languageMatches = bgLanguages.match(/\b(Common|Elvish|Dwarvish|Halfling|Draconic|Giant|Gnomish|Goblin|Orcish|Abyssal|Celestial|Deep Speech|Infernal|Primordial|Sylvan|Undercommon|Druidic)\b/gi);
                    if (languageMatches) {
                        languages.push(...languageMatches.map(lang => lang.toLowerCase()));
                    }
                }
            }
            // Check for language proficiencies in modifiers
            if (ddbCharacter.modifiers && typeof ddbCharacter.modifiers === 'object') {
                for (const [key, modifierArray] of Object.entries(ddbCharacter.modifiers)) {
                    if (Array.isArray(modifierArray)) {
                        for (const modifier of modifierArray) {
                            if (modifier.type === 'language' && modifier.subType) {
                                const langName = modifier.subType.toLowerCase();
                                if (!languages.includes(langName)) {
                                    languages.push(langName);
                                }
                            }
                        }
                    }
                }
            }
            // Remove duplicates and ensure Druidic is included for druids
            const uniqueLanguages = [...new Set(languages)];
            // Check if character is a druid and add Druidic if not already present
            if (ddbCharacter.classes && Array.isArray(ddbCharacter.classes)) {
                const isDruid = ddbCharacter.classes.some(cls => cls.definition?.name?.toLowerCase().includes('druid'));
                if (isDruid && !uniqueLanguages.includes('druidic')) {
                    uniqueLanguages.push('druidic');
                }
            }
            return uniqueLanguages;
        }
        catch (error) {
            Logger.error(`Error parsing languages: ${error}`);
            return ['common']; // Return at least Common as fallback
        }
    }
    static getSkillAbility(skill) {
        const skillAbilities = {
            'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str', 'dec': 'cha',
            'his': 'int', 'ins': 'wis', 'itm': 'cha', 'inv': 'int', 'med': 'wis',
            'nat': 'int', 'prc': 'wis', 'prf': 'cha', 'per': 'cha', 'rel': 'int',
            'slt': 'dex', 'ste': 'dex', 'sur': 'wis'
        };
        return skillAbilities[skill] || 'int';
    }
    // ========== COMPREHENSIVE PARSING UTILITY METHODS ==========
    static getAbilityModifier(score) {
        return Math.floor((score - 10) / 2);
    }
    static getTotalLevel(ddbCharacter) {
        if (!ddbCharacter.classes)
            return 1;
        return ddbCharacter.classes.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
    }
    static getProficiencyBonus(level) {
        return Math.max(2, Math.ceil(level / 4) + 1);
    }
    static getAbilityScore(ddbCharacter, statId) {
        if (!ddbCharacter.stats)
            return 10;
        const stat = ddbCharacter.stats.find(s => s.id === statId);
        return stat ? stat.value : 10;
    }
    static getStatIdForAbility(ability) {
        const map = { 'str': 1, 'dex': 2, 'con': 3, 'int': 4, 'wis': 5, 'cha': 6 };
        return map[ability] || 4;
    }
    static getPrimaryClass(ddbCharacter) {
        if (!ddbCharacter.classes || ddbCharacter.classes.length === 0)
            return '';
        const primaryClass = ddbCharacter.classes.reduce((prev, current) => (current.level || 0) > (prev.level || 0) ? current : prev);
        return primaryClass.definition?.name || '';
    }
    static getPrimarySpellcastingClass(ddbCharacter) {
        if (!ddbCharacter.classes)
            return null;
        const spellcastingClasses = ddbCharacter.classes.filter(cls => cls.definition && this.isSpellcastingClass(cls.definition.name));
        if (spellcastingClasses.length === 0)
            return null;
        return spellcastingClasses.reduce((prev, current) => (current.level || 0) > (prev.level || 0) ? current : prev);
    }
    static getSpellcastingAbility(classObj) {
        if (!classObj || !classObj.definition)
            return 'int';
        const abilities = {
            'druid': 'wis', 'cleric': 'wis', 'ranger': 'wis',
            'bard': 'cha', 'sorcerer': 'cha', 'warlock': 'cha', 'paladin': 'cha',
            'wizard': 'int', 'artificer': 'int'
        };
        return abilities[classObj.definition.name.toLowerCase()] || 'int';
    }
    static isSpellcastingClass(className) {
        return ['Artificer', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'].includes(className);
    }
    static calculateSpellSlots(className, level) {
        const slots = {};
        // Druid spell slot progression (full caster)
        if (className === 'Druid') {
            if (level >= 1)
                slots.spell1 = Math.min(4, Math.max(2, level === 1 ? 2 : level + 1));
            if (level >= 3)
                slots.spell2 = Math.min(3, Math.floor((level + 1) / 2));
            if (level >= 5)
                slots.spell3 = Math.min(3, Math.floor(level / 2) - 1);
            if (level >= 7)
                slots.spell4 = Math.min(3, Math.floor(level / 4));
            if (level >= 9)
                slots.spell5 = Math.min(2, Math.floor(level / 6));
            if (level >= 11)
                slots.spell6 = 1;
            if (level >= 13)
                slots.spell7 = 1;
            if (level >= 15)
                slots.spell8 = 1;
            if (level >= 17)
                slots.spell9 = 1;
        }
        return slots;
    }
    static getAlignment(ddbCharacter) {
        if (!ddbCharacter.alignmentId)
            return '';
        return this.parseAlignment(ddbCharacter.alignmentId);
    }
    static getRaceSize(race) {
        if (!race)
            return 'med';
        // Would parse from race data
        return 'med';
    }
    static getXpForLevel(level) {
        const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
        return xpTable[Math.min(level - 1, xpTable.length - 1)] || 355000;
    }
    static getSkillKeyFromModifier(modifier) {
        const skillMapping = {
            'acrobatics': 'acr', 'animal-handling': 'ani', 'arcana': 'arc',
            'athletics': 'ath', 'deception': 'dec', 'history': 'his',
            'insight': 'ins', 'intimidation': 'inti', 'investigation': 'inv',
            'medicine': 'med', 'nature': 'nat', 'perception': 'per',
            'performance': 'prf', 'persuasion': 'per', 'religion': 'rel',
            'sleight-of-hand': 'slt', 'stealth': 'ste', 'survival': 'sur'
        };
        return skillMapping[modifier.subType] || null;
    }
    static getFoundryItemType(definition) {
        const typeMap = {
            'Weapon': 'weapon', 'Armor': 'equipment', 'Shield': 'equipment',
            'Gear': 'loot', 'Tool': 'tool', 'Potion': 'consumable'
        };
        return typeMap[definition.filterType] || 'loot';
    }
    static getDefaultIcon(itemType) {
        const iconMap = {
            weapon: 'icons/weapons/swords/sword-broad-silver.webp',
            equipment: 'icons/equipment/chest/breastplate-scale-grey.webp',
            loot: 'icons/containers/bags/pack-leather-brown.webp'
        };
        return iconMap[itemType] || 'icons/svg/item-bag.svg';
    }
    // ========== COMPREHENSIVE PARSING METHODS ==========
    /**
     * Parse enhanced attributes with spellcasting and encumbrance
     */
    static parseEnhancedAttributes(ddbCharacter) {
        const totalLevel = this.getTotalLevel(ddbCharacter);
        const constitutionMod = this.getAbilityModifier(this.getAbilityScore(ddbCharacter, 3));
        // Enhanced HP calculation
        const baseHP = ddbCharacter.baseHitPoints || 0;
        const bonusHP = ddbCharacter.bonusHitPoints || 0;
        const overrideHP = ddbCharacter.overrideHitPoints;
        const removedHP = ddbCharacter.removedHitPoints || 0;
        let maxHP;
        if (overrideHP !== null && overrideHP !== undefined) {
            maxHP = overrideHP;
        }
        else {
            maxHP = baseHP + (constitutionMod * totalLevel) + bonusHP;
        }
        const currentHP = Math.max(0, maxHP - removedHP);
        // Spellcasting attributes
        const primaryClass = this.getPrimarySpellcastingClass(ddbCharacter);
        const spellcastingAbility = this.getSpellcastingAbility(primaryClass);
        const spellcastingMod = this.getAbilityModifier(this.getAbilityScore(ddbCharacter, this.getStatIdForAbility(spellcastingAbility)));
        const profBonus = this.getProficiencyBonus(totalLevel);
        return {
            ac: { flat: null, calc: 'default', formula: '' },
            hp: {
                value: currentHP,
                max: maxHP,
                temp: ddbCharacter.temporaryHitPoints || 0,
                tempmax: 0
            },
            init: {
                ability: 'dex',
                bonus: 0,
                mod: this.getAbilityModifier(this.getAbilityScore(ddbCharacter, 2)),
                prof: 0,
                total: this.getAbilityModifier(this.getAbilityScore(ddbCharacter, 2))
            },
            movement: this.parseMovement(ddbCharacter),
            senses: this.parseSenses(ddbCharacter),
            spellcasting: spellcastingAbility,
            prof: profBonus,
            spelldc: 8 + profBonus + spellcastingMod,
            encumbrance: this.parseEncumbrance(ddbCharacter)
        };
    }
    /**
     * Parse encumbrance system
     */
    static parseEncumbrance(ddbCharacter) {
        const strengthScore = this.getAbilityScore(ddbCharacter, 1); // Strength ID = 1
        const carryingCapacity = strengthScore * 15;
        return {
            value: 0, // Current encumbrance - would need to calculate from inventory
            max: carryingCapacity,
            pct: 0,
            encumbered: false
        };
    }
    /**
     * Parse all items (equipment, spells, features)
     */
    static parseAllItems(ddbCharacter) {
        const items = [];
        // Parse equipment
        items.push(...this.parseEquipment(ddbCharacter));
        // Parse spells as items
        items.push(...this.parseSpellItems(ddbCharacter));
        // Parse features (simplified for now)
        items.push(...this.parseFeatures(ddbCharacter));
        Logger.info(`📦 Parsed ${items.length} total items`);
        return items;
    }
    /**
     * Parse active effects (simplified for now)
     */
    static parseActiveEffects(ddbCharacter) {
        return [];
    }
    /**
     * Parse character bonuses
     */
    static parseBonuses(ddbCharacter) {
        return {
            mwak: { attack: '', damage: '' },
            rwak: { attack: '', damage: '' },
            msak: { attack: '', damage: '' },
            rsak: { attack: '', damage: '' },
            abilities: { check: '', save: '', skill: '' },
            spell: { dc: '' }
        };
    }
    /**
     * Parse equipment items
     */
    static parseEquipment(ddbCharacter) {
        const items = [];
        if (ddbCharacter.inventory) {
            ddbCharacter.inventory.forEach(item => {
                try {
                    const foundryItem = this.parseInventoryItem(item);
                    if (foundryItem) {
                        items.push(foundryItem);
                    }
                }
                catch (error) {
                    Logger.error(`Equipment parsing error: ${error.message}`);
                }
            });
        }
        Logger.debug(`⚔️ Parsed ${items.length} equipment items`);
        return items;
    }
    /**
     * Parse individual inventory item
     */
    static parseInventoryItem(ddbItem) {
        if (!ddbItem.definition)
            return null;
        const definition = ddbItem.definition;
        const itemType = this.getFoundryItemType(definition);
        return {
            name: definition.name,
            type: itemType,
            img: definition.avatarUrl || this.getDefaultIcon(itemType),
            system: {
                description: { value: definition.description || '' },
                quantity: ddbItem.quantity || 1,
                weight: (definition.weight || 0) * (definition.weightMultiplier || 1),
                price: { value: definition.cost?.quantity || 0, denomination: 'gp' },
                equipped: ddbItem.equipped || false,
                rarity: definition.rarity?.toLowerCase() || 'common',
                identified: true,
                attuned: ddbItem.isAttuned || false
            },
            flags: {
                'beyond-foundry': {
                    ddbId: definition.id,
                    ddbType: definition.type,
                    isHomebrew: definition.isHomebrew || false
                }
            }
        };
    }
    /**
     * Parse spell items
     */
    static parseSpellItems(ddbCharacter) {
        const spellItems = [];
        if (ddbCharacter.spells) {
            Object.values(ddbCharacter.spells).forEach(spellArray => {
                if (Array.isArray(spellArray)) {
                    spellArray.forEach(spell => {
                        try {
                            const spellItem = this.parseSpellItem(spell);
                            if (spellItem) {
                                spellItems.push(spellItem);
                            }
                        }
                        catch (error) {
                            Logger.error(`Spell parsing error: ${error.message}`);
                        }
                    });
                }
            });
        }
        Logger.debug(`🔮 Parsed ${spellItems.length} spell items`);
        return spellItems;
    }
    /**
     * Parse individual spell item
     */
    static parseSpellItem(ddbSpell) {
        if (!ddbSpell.definition)
            return null;
        const definition = ddbSpell.definition;
        return {
            name: definition.name,
            type: 'spell',
            img: 'icons/magic/symbols/rune-sigil-black-pink.webp',
            system: {
                description: { value: definition.description || '' },
                level: definition.level || 0,
                school: definition.school?.toLowerCase() || 'evocation',
                components: {
                    vocal: definition.components?.verbal || false,
                    somatic: definition.components?.somatic || false,
                    material: definition.components?.material || false,
                    ritual: definition.ritual || false,
                    concentration: definition.concentration || false
                },
                materials: { value: definition.components?.materialComponent || '' },
                preparation: { mode: 'prepared', prepared: ddbSpell.prepared || false },
                scaling: { mode: 'none', formula: '' },
                range: { value: null, units: 'ft' },
                target: { value: null, width: null, units: '', type: '' },
                duration: { value: null, units: '' },
                activation: { type: 'action', cost: 1, condition: '' }
            },
            flags: {
                'beyond-foundry': {
                    ddbId: definition.id,
                    spellListId: ddbSpell.spellListId
                }
            }
        };
    }
    /**
     * Parse features (simplified for now)
     */
    static parseFeatures(ddbCharacter) {
        const features = [];
        try {
            // Parse class features
            if (ddbCharacter.classes && Array.isArray(ddbCharacter.classes)) {
                for (const ddbClass of ddbCharacter.classes) {
                    if (ddbClass.classFeatures && Array.isArray(ddbClass.classFeatures)) {
                        for (const feature of ddbClass.classFeatures) {
                            features.push({
                                name: feature.name || 'Unknown Feature',
                                type: 'feat',
                                img: 'systems/dnd5e/icons/skills/light_01.jpg',
                                system: {
                                    description: {
                                        value: feature.description || '',
                                        chat: '',
                                        unidentified: ''
                                    },
                                    source: `${ddbClass.definition?.name || 'Class'} Level ${feature.requiredLevel || 1}`,
                                    activation: { type: '', cost: 0, condition: '' },
                                    duration: { value: null, units: '' },
                                    target: { value: null, width: null, units: '', type: '' },
                                    range: { value: null, long: null, units: '' },
                                    uses: { value: null, max: '', per: null, recovery: '' },
                                    consume: { type: '', target: null, amount: null },
                                    ability: null,
                                    actionType: '',
                                    attackBonus: '',
                                    chatFlavor: '',
                                    critical: { threshold: null, damage: '' },
                                    damage: { parts: [], versatile: '' },
                                    formula: '',
                                    save: { ability: '', dc: null, scaling: 'spell' },
                                    requirements: feature.prerequisite || '',
                                    recharge: { value: null, charged: false }
                                },
                                effects: [],
                                folder: null,
                                sort: 0,
                                ownership: { default: 0 },
                                flags: {
                                    'beyond-foundry': {
                                        type: 'classFeature',
                                        class: ddbClass.definition?.name || 'Unknown',
                                        level: feature.requiredLevel || 1,
                                        id: feature.id
                                    }
                                }
                            });
                        }
                    }
                    // Parse subclass features
                    if (ddbClass.subclassDefinition?.classFeatures && Array.isArray(ddbClass.subclassDefinition.classFeatures)) {
                        for (const feature of ddbClass.subclassDefinition.classFeatures) {
                            features.push({
                                name: feature.name || 'Unknown Subclass Feature',
                                type: 'feat',
                                img: 'systems/dnd5e/icons/skills/light_02.jpg',
                                system: {
                                    description: {
                                        value: feature.description || '',
                                        chat: '',
                                        unidentified: ''
                                    },
                                    source: `${ddbClass.subclassDefinition?.name || 'Subclass'} Level ${feature.requiredLevel || 1}`,
                                    activation: { type: '', cost: 0, condition: '' },
                                    duration: { value: null, units: '' },
                                    target: { value: null, width: null, units: '', type: '' },
                                    range: { value: null, long: null, units: '' },
                                    uses: { value: null, max: '', per: null, recovery: '' },
                                    consume: { type: '', target: null, amount: null },
                                    ability: null,
                                    actionType: '',
                                    attackBonus: '',
                                    chatFlavor: '',
                                    critical: { threshold: null, damage: '' },
                                    damage: { parts: [], versatile: '' },
                                    formula: '',
                                    save: { ability: '', dc: null, scaling: 'spell' },
                                    requirements: feature.prerequisite || '',
                                    recharge: { value: null, charged: false }
                                },
                                effects: [],
                                folder: null,
                                sort: 0,
                                ownership: { default: 0 },
                                flags: {
                                    'beyond-foundry': {
                                        type: 'subclassFeature',
                                        subclass: ddbClass.subclassDefinition?.name || 'Unknown',
                                        level: feature.requiredLevel || 1,
                                        id: feature.id
                                    }
                                }
                            });
                        }
                    }
                }
            }
            // Parse racial traits
            if (ddbCharacter.race?.racialTraits && Array.isArray(ddbCharacter.race.racialTraits)) {
                for (const trait of ddbCharacter.race.racialTraits) {
                    const definition = trait.definition;
                    if (definition) {
                        features.push({
                            name: definition.name || 'Unknown Racial Trait',
                            type: 'feat',
                            img: 'systems/dnd5e/icons/skills/yellow_03.jpg',
                            system: {
                                description: {
                                    value: definition.description || '',
                                    chat: definition.snippet || '',
                                    unidentified: ''
                                },
                                source: ddbCharacter.race?.fullName || 'Racial Trait',
                                activation: definition.activation ? {
                                    type: definition.activation.activationType || '',
                                    cost: definition.activation.activationTime || 0,
                                    condition: ''
                                } : { type: '', cost: 0, condition: '' },
                                duration: { value: null, units: '' },
                                target: { value: null, width: null, units: '', type: '' },
                                range: { value: null, long: null, units: '' },
                                uses: { value: null, max: '', per: null, recovery: '' },
                                consume: { type: '', target: null, amount: null },
                                ability: null,
                                actionType: '',
                                attackBonus: '',
                                chatFlavor: '',
                                critical: { threshold: null, damage: '' },
                                damage: { parts: [], versatile: '' },
                                formula: '',
                                save: { ability: '', dc: null, scaling: 'spell' },
                                requirements: '',
                                recharge: { value: null, charged: false }
                            },
                            effects: [],
                            folder: null,
                            sort: 0,
                            ownership: { default: 0 },
                            flags: {
                                'beyond-foundry': {
                                    type: 'racialTrait',
                                    race: ddbCharacter.race?.fullName || 'Unknown',
                                    id: definition.id
                                }
                            }
                        });
                    }
                }
            }
            // Parse background feature
            if (ddbCharacter.background?.definition?.featureName) {
                features.push({
                    name: ddbCharacter.background.definition.featureName,
                    type: 'feat',
                    img: 'systems/dnd5e/icons/skills/green_01.jpg',
                    system: {
                        description: {
                            value: ddbCharacter.background.definition.featureDescription || '',
                            chat: '',
                            unidentified: ''
                        },
                        source: ddbCharacter.background.definition.name || 'Background',
                        activation: { type: '', cost: 0, condition: '' },
                        duration: { value: null, units: '' },
                        target: { value: null, width: null, units: '', type: '' },
                        range: { value: null, long: null, units: '' },
                        uses: { value: null, max: '', per: null, recovery: '' },
                        consume: { type: '', target: null, amount: null },
                        ability: null,
                        actionType: '',
                        attackBonus: '',
                        chatFlavor: '',
                        critical: { threshold: null, damage: '' },
                        damage: { parts: [], versatile: '' },
                        formula: '',
                        save: { ability: '', dc: null, scaling: 'spell' },
                        requirements: '',
                        recharge: { value: null, charged: false }
                    },
                    effects: [],
                    folder: null,
                    sort: 0,
                    ownership: { default: 0 },
                    flags: {
                        'beyond-foundry': {
                            type: 'backgroundFeature',
                            background: ddbCharacter.background.definition.name || 'Unknown',
                            id: ddbCharacter.background.definition.id
                        }
                    }
                });
            }
            // Parse feats (from various sources)
            if (ddbCharacter.feats && Array.isArray(ddbCharacter.feats)) {
                for (const feat of ddbCharacter.feats) {
                    if (feat.definition) {
                        features.push({
                            name: feat.definition.name || 'Unknown Feat',
                            type: 'feat',
                            img: 'systems/dnd5e/icons/skills/red_01.jpg',
                            system: {
                                description: {
                                    value: feat.definition.description || '',
                                    chat: feat.definition.snippet || '',
                                    unidentified: ''
                                },
                                source: 'Feat',
                                activation: { type: '', cost: 0, condition: '' },
                                duration: { value: null, units: '' },
                                target: { value: null, width: null, units: '', type: '' },
                                range: { value: null, long: null, units: '' },
                                uses: { value: null, max: '', per: null, recovery: '' },
                                consume: { type: '', target: null, amount: null },
                                ability: null,
                                actionType: '',
                                attackBonus: '',
                                chatFlavor: '',
                                critical: { threshold: null, damage: '' },
                                damage: { parts: [], versatile: '' },
                                formula: '',
                                save: { ability: '', dc: null, scaling: 'spell' },
                                requirements: feat.definition.prerequisite || '',
                                recharge: { value: null, charged: false }
                            },
                            effects: [],
                            folder: null,
                            sort: 0,
                            ownership: { default: 0 },
                            flags: {
                                'beyond-foundry': {
                                    type: 'feat',
                                    id: feat.definition.id
                                }
                            }
                        });
                    }
                }
            }
            // Parse optional class features if enabled
            if (ddbCharacter.optionalClassFeatures && Array.isArray(ddbCharacter.optionalClassFeatures)) {
                for (const feature of ddbCharacter.optionalClassFeatures) {
                    if (feature.definition) {
                        features.push({
                            name: feature.definition.name || 'Unknown Optional Feature',
                            type: 'feat',
                            img: 'systems/dnd5e/icons/skills/blue_01.jpg',
                            system: {
                                description: {
                                    value: feature.definition.description || '',
                                    chat: feature.definition.snippet || '',
                                    unidentified: ''
                                },
                                source: 'Optional Class Feature',
                                activation: { type: '', cost: 0, condition: '' },
                                duration: { value: null, units: '' },
                                target: { value: null, width: null, units: '', type: '' },
                                range: { value: null, long: null, units: '' },
                                uses: { value: null, max: '', per: null, recovery: '' },
                                consume: { type: '', target: null, amount: null },
                                ability: null,
                                actionType: '',
                                attackBonus: '',
                                chatFlavor: '',
                                critical: { threshold: null, damage: '' },
                                damage: { parts: [], versatile: '' },
                                formula: '',
                                save: { ability: '', dc: null, scaling: 'spell' },
                                requirements: feature.definition.prerequisite || '',
                                recharge: { value: null, charged: false }
                            },
                            effects: [],
                            folder: null,
                            sort: 0,
                            ownership: { default: 0 },
                            flags: {
                                'beyond-foundry': {
                                    type: 'optionalClassFeature',
                                    id: feature.definition.id
                                }
                            }
                        });
                    }
                }
            }
        }
        catch (error) {
            Logger.error(`Error parsing features: ${error}`);
        }
        Logger.debug(`🎪 Parsed ${features.length} features`);
        return features;
    }
}

/**
 * Comprehensive Spell Parser for D&D Beyond to FoundryVTT D&D 5e system
 *
 * This parser handles:
 * - Complete spell data structure conversion
 * - Spell school mapping and validation
 * - Component parsing (verbal, somatic, material, focus)
 * - Duration, range, and area of effect calculations
 * - Scaling formulas and higher level effects
 * - Ritual and concentration mechanics
 * - Class spell list associations
 * - Custom spell descriptions and effects
 */
class SpellParser {
    /**
     * Parse a D&D Beyond spell into FoundryVTT spell data
     * @param ddbSpell - The D&D Beyond spell data
     * @param options - Parsing options for customization
     * @returns Foundry spell item data
     */
    static parseSpell(ddbSpell, options = {}) {
        const definition = ddbSpell.definition;
        if (!definition) {
            Logger.warn(`Spell missing definition: ${ddbSpell.id}`);
            return this.createEmptySpell();
        }
        Logger.debug(`📜 Parsing spell: ${definition.name} (Level ${definition.level})`);
        const foundrySpell = {
            name: definition.name,
            type: 'spell',
            img: this.getSpellIcon(definition),
            system: {
                description: {
                    value: this.parseDescription(definition),
                    chat: this.parseChatDescription(definition),
                    unidentified: ''
                },
                source: this.parseSource(definition),
                activation: this.parseActivation(definition),
                duration: this.parseDuration(definition),
                target: this.parseTarget(definition),
                range: this.parseRange(definition),
                uses: this.parseUses(ddbSpell),
                consume: this.parseConsume(definition),
                ability: this.parseAbility(ddbSpell),
                actionType: this.parseActionType(definition),
                attackBonus: this.parseAttackBonus(definition),
                chatFlavor: '',
                critical: this.parseCritical(definition),
                damage: this.parseDamage(definition),
                formula: this.parseFormula(definition),
                save: this.parseSave(definition),
                level: definition.level,
                school: this.parseSchool(definition.school),
                components: this.parseComponents(definition),
                materials: this.parseMaterials(definition),
                preparation: this.parsePreparation(ddbSpell, options),
                scaling: this.parseScaling(definition),
                properties: this.parseProperties(definition)
            },
            effects: this.parseActiveEffects(definition),
            flags: {
                'beyond-foundry': {
                    ddbId: definition.id,
                    sourceId: ddbSpell.id,
                    spellListId: ddbSpell.spellListId,
                    prepared: ddbSpell.prepared || false,
                    alwaysPrepared: ddbSpell.alwaysPrepared || false,
                    usesSpellSlot: ddbSpell.usesSpellSlot !== false,
                    castAtLevel: ddbSpell.castAtLevel || null,
                    restriction: ddbSpell.restriction || null
                }
            }
        };
        return foundrySpell;
    }
    /**
     * Parse spell description with enhanced formatting
     */
    static parseDescription(definition) {
        let description = definition.description || '';
        // Add spell tags for better organization
        const tags = [];
        if (definition.ritual)
            tags.push('Ritual');
        if (definition.concentration)
            tags.push('Concentration');
        if (definition.components?.material)
            tags.push('Material Component');
        if (definition.componentsDescription)
            tags.push('Focus');
        if (tags.length > 0) {
            description = `<p><strong>Tags:</strong> ${tags.join(', ')}</p>${description}`;
        }
        // Add higher level information if available
        if (definition.higherLevelDescription) {
            description += `<h3>At Higher Levels</h3><p>${definition.higherLevelDescription}</p>`;
        }
        return description;
    }
    /**
     * Parse chat description for spell card display
     */
    static parseChatDescription(definition) {
        // Create a shorter version for chat display
        const desc = definition.description || '';
        const sentences = desc.split('.').slice(0, 2); // First two sentences
        return sentences.join('.') + (sentences.length < desc.split('.').length ? '...' : '');
    }
    /**
     * Parse spell source information
     */
    static parseSource(definition) {
        if (definition.sources && definition.sources.length > 0) {
            const source = definition.sources[0];
            return `${source.sourceType === 1 ? 'PHB' : 'Supplement'} ${source.pageNumber || ''}`.trim();
        }
        return '';
    }
    /**
     * Parse spell activation details
     */
    static parseActivation(definition) {
        const activation = definition.activation || {};
        const typeMap = {
            1: 'action', // Action
            2: 'bonus', // Bonus Action
            3: 'reaction', // Reaction
            4: 'minute', // Minute
            5: 'hour', // Hour
            6: 'minute', // Special (often represents longer casting times)
            7: 'day' // Day
        };
        return {
            type: typeMap[activation.activationType] || 'action',
            cost: activation.activationTime || 1,
            condition: activation.activationCondition || ''
        };
    }
    /**
     * Parse spell duration
     */
    static parseDuration(definition) {
        const duration = definition.duration || {};
        const unitMap = {
            'Instantaneous': 'inst',
            'Round': 'round',
            'Minute': 'minute',
            'Hour': 'hour',
            'Day': 'day',
            'Week': 'week',
            'Month': 'month',
            'Year': 'year',
            'Permanent': 'perm',
            'Special': 'spec',
            'Time': 'minute', // D&D Beyond uses "Time" for various durations
            'Concentration': 'minute', // Concentration spells usually have minute duration
            'Until Dispelled': 'perm',
            'Until Dispelled or Triggered': 'perm'
        };
        const durationUnit = duration.durationType || 'Instantaneous';
        const mappedUnit = unitMap[durationUnit];
        return {
            value: duration.durationInterval || null,
            units: mappedUnit || 'inst'
        };
    }
    /**
     * Parse spell target information
     */
    static parseTarget(definition) {
        const range = definition.range || {};
        const typeMap = {
            'Self': 'self',
            'Touch': 'touch',
            'Ranged': 'creature',
            'Point': 'space',
            'Line': 'line',
            'Cone': 'cone',
            'Cube': 'cube',
            'Cylinder': 'cylinder',
            'Sphere': 'sphere',
            'Square': 'square'
        };
        return {
            value: range.aoeValue || null,
            width: null,
            units: 'ft',
            type: typeMap[range.aoeType || range.origin] || 'creature'
        };
    }
    /**
     * Parse spell range
     */
    static parseRange(definition) {
        const range = definition.range || {};
        const unitMap = {
            'Self': 'self',
            'Touch': 'touch',
            'Ranged': 'ft',
            'Sight': 'spec',
            'Unlimited': 'any'
        };
        return {
            value: range.rangeValue || null,
            long: null,
            units: unitMap[range.origin] || 'ft'
        };
    }
    /**
     * Parse spell uses and limitations
     */
    static parseUses(ddbSpell) {
        const limitedUse = ddbSpell.limitedUse;
        if (!limitedUse) {
            return {
                value: null,
                max: '',
                per: null,
                recovery: ''
            };
        }
        const recoveryMap = {
            1: 'sr', // Short rest
            2: 'lr', // Long rest
            3: 'day', // Per day
            4: 'charges' // Charges
        };
        return {
            value: limitedUse.maxUses || null,
            max: limitedUse.maxUses?.toString() || '',
            per: recoveryMap[limitedUse.resetType] || null,
            recovery: ''
        };
    }
    /**
     * Parse spell resource consumption
     */
    static parseConsume(definition) {
        return {
            type: 'slots',
            target: `spell${definition.level || 1}`,
            amount: 1,
            scale: false
        };
    }
    /**
     * Parse spellcasting ability
     */
    static parseAbility(ddbSpell) {
        // This would typically come from the character's class
        // For now, return null to use character's default
        return ddbSpell.spellCastingAbilityId ? this.mapAbilityId(ddbSpell.spellCastingAbilityId) : null;
    }
    /**
     * Parse spell action type
     */
    static parseActionType(definition) {
        if (definition.attackType === 1)
            return 'mwak'; // Melee weapon attack
        if (definition.attackType === 2)
            return 'rwak'; // Ranged weapon attack
        if (definition.attackType === 3)
            return 'msak'; // Melee spell attack
        if (definition.attackType === 4)
            return 'rsak'; // Ranged spell attack
        if (definition.saveType)
            return 'save'; // Saving throw
        if (definition.healingTypes && definition.healingTypes.length > 0)
            return 'heal';
        return 'other';
    }
    /**
     * Parse attack bonus for spell attacks
     */
    static parseAttackBonus(definition) {
        // Attack bonus is typically calculated from spellcasting ability + proficiency
        // Return empty string to use character's calculated bonus
        return '';
    }
    /**
     * Parse critical hit information
     */
    static parseCritical(definition) {
        return {
            threshold: null,
            damage: ''
        };
    }
    /**
     * Parse spell damage
     */
    static parseDamage(definition) {
        const parts = [];
        if (definition.damageTypes && definition.damageTypes.length > 0) {
            definition.damageTypes.forEach((damageType, index) => {
                if (definition.dice && definition.dice[index]) {
                    const dice = definition.dice[index];
                    const formula = `${dice.diceCount || 1}d${dice.diceValue || 6}${dice.fixedValue ? ` + ${dice.fixedValue}` : ''}`;
                    parts.push([formula, damageType.toLowerCase()]);
                }
            });
        }
        return {
            parts,
            versatile: '',
            value: ''
        };
    }
    /**
     * Parse additional formula (like healing)
     */
    static parseFormula(definition) {
        if (definition.healingTypes && definition.healingTypes.length > 0 && definition.dice) {
            const dice = definition.dice[0];
            if (dice) {
                return `${dice.diceCount || 1}d${dice.diceValue || 6}${dice.fixedValue ? ` + ${dice.fixedValue}` : ''}`;
            }
        }
        return '';
    }
    /**
     * Parse saving throw information
     */
    static parseSave(definition) {
        if (!definition.saveType) {
            return {
                ability: '',
                dc: null,
                scaling: 'spell'
            };
        }
        const abilityMap = {
            1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
        };
        return {
            ability: abilityMap[definition.saveType] || '',
            dc: null, // Will be calculated from character's spell DC
            scaling: 'spell'
        };
    }
    /**
     * Parse spell school
     */
    static parseSchool(school) {
        const schoolMap = {
            'Abjuration': 'abj',
            'Conjuration': 'con',
            'Divination': 'div',
            'Enchantment': 'enc',
            'Evocation': 'evo',
            'Illusion': 'ill',
            'Necromancy': 'nec',
            'Transmutation': 'trs'
        };
        // Handle both capitalized and lowercase school names
        const normalizedSchool = school ? school.charAt(0).toUpperCase() + school.slice(1).toLowerCase() : '';
        return schoolMap[normalizedSchool] || 'evo';
    }
    /**
     * Parse spell components
     */
    static parseComponents(definition) {
        const components = definition.components || [];
        // D&D Beyond uses numbers: 1=verbal, 2=somatic, 3=material
        const hasVerbal = components.includes(1);
        const hasSomatic = components.includes(2);
        const hasMaterial = components.includes(3);
        return {
            vocal: hasVerbal,
            somatic: hasSomatic,
            material: hasMaterial,
            ritual: definition.ritual || false,
            concentration: definition.concentration || false
        };
    }
    /**
     * Parse material components
     */
    static parseMaterials(definition) {
        const materialComponent = definition.componentsDescription || '';
        const cost = this.extractCost(materialComponent);
        return {
            value: materialComponent,
            consumed: false,
            cost: cost,
            supply: 0
        };
    }
    /**
     * Parse spell preparation mode and status
     */
    static parsePreparation(ddbSpell, options) {
        const mode = options.preparationMode || 'prepared';
        return {
            mode,
            prepared: ddbSpell.prepared || false
        };
    }
    /**
     * Parse spell scaling (higher level effects)
     */
    static parseScaling(definition) {
        if (!definition.higherLevelDescription) {
            return {
                mode: 'none',
                formula: ''
            };
        }
        // Try to extract scaling formula from higher level description
        const scalingFormula = this.extractScalingFormula(definition.higherLevelDescription);
        return {
            mode: scalingFormula ? 'level' : 'none',
            formula: scalingFormula
        };
    }
    /**
     * Parse spell properties/flags
     */
    static parseProperties(definition) {
        const properties = [];
        if (definition.ritual)
            properties.push('ritual');
        if (definition.concentration)
            properties.push('concentration');
        if (definition.components?.vocal)
            properties.push('vocal');
        if (definition.components?.somatic)
            properties.push('somatic');
        if (definition.components?.material)
            properties.push('material');
        return properties;
    }
    /**
     * Parse active effects (for automation)
     */
    static parseActiveEffects(definition) {
        // This would be expanded for spell automation
        // For now, return empty array
        return [];
    }
    /**
     * Get appropriate icon for spell
     */
    static getSpellIcon(definition) {
        const schoolIcons = {
            'Abjuration': 'icons/magic/defensive/shield-barrier-blue.webp',
            'Conjuration': 'icons/magic/symbols/elements-air-earth-fire-water.webp',
            'Divination': 'icons/magic/perception/eye-ringed-glow-yellow.webp',
            'Enchantment': 'icons/magic/control/hypnosis-mesmerism-swirl.webp',
            'Evocation': 'icons/magic/lightning/bolt-strike-blue.webp',
            'Illusion': 'icons/magic/perception/silhouette-stealth-shadow.webp',
            'Necromancy': 'icons/magic/death/skull-horned-goat-pentagram-red.webp',
            'Transmutation': 'icons/magic/symbols/question-stone-yellow.webp'
        };
        return schoolIcons[definition.school] || 'icons/magic/symbols/rune-sigil-black-pink.webp';
    }
    /**
     * Create empty spell for error cases
     */
    static createEmptySpell() {
        return {
            name: 'Unknown Spell',
            type: 'spell',
            img: 'icons/svg/mystery-man.svg',
            system: {},
            effects: [],
            flags: {}
        };
    }
    /**
     * Map DDB ability ID to Foundry ability key
     */
    static mapAbilityId(abilityId) {
        const abilityMap = {
            1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
        };
        return abilityMap[abilityId] || 'int';
    }
    /**
     * Extract cost from material component description
     */
    static extractCost(materials) {
        const costMatch = materials.match(/(\d+)\s*gp/i);
        return costMatch ? parseInt(costMatch[1]) : 0;
    }
    /**
     * Extract scaling formula from higher level description
     */
    static extractScalingFormula(description) {
        // Look for patterns like "increases by 1d6" or "an additional 1d8"
        const patterns = [
            /increases by (\d+d\d+)/i,
            /additional (\d+d\d+)/i,
            /extra (\d+d\d+)/i,
            /(\d+d\d+) additional/i
        ];
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return '';
    }
    /**
     * Parse multiple spells from character spell list
     */
    static parseCharacterSpells(ddbCharacter, options = {}) {
        const spells = [];
        if (!ddbCharacter.spells) {
            return spells;
        }
        // Process all spell categories
        Object.values(ddbCharacter.spells).forEach((spellArray) => {
            if (Array.isArray(spellArray)) {
                spellArray.forEach((ddbSpell) => {
                    try {
                        const foundrySpell = this.parseSpell(ddbSpell, options);
                        spells.push(foundrySpell);
                    }
                    catch (error) {
                        Logger.error(`Failed to parse spell ${ddbSpell.definition?.name || 'Unknown'}: ${error}`);
                    }
                });
            }
        });
        Logger.info(`📚 Parsed ${spells.length} spells`);
        return spells;
    }
}

/**
 * Main API class for Beyond Foundry module
 * Handles communication with ddb-proxy and data transformation
 */
class BeyondFoundryAPI {
    static instance;
    proxyEndpoint = '';
    apiEndpoint = '';
    initialized = false;
    constructor() { }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!BeyondFoundryAPI.instance) {
            BeyondFoundryAPI.instance = new BeyondFoundryAPI();
        }
        return BeyondFoundryAPI.instance;
    }
    /**
     * Initialize the API with current settings
     */
    init() {
        if (this.initialized)
            return;
        const settings = getModuleSettings();
        this.proxyEndpoint = settings.proxyUrl;
        this.apiEndpoint = settings.apiEndpoint;
        this.initialized = true;
        Logger.info('BeyondFoundryAPI initialized');
        // Test proxy connection on init
        this.testProxyConnection().catch(error => {
            Logger.warn(`Initial proxy connection test failed: ${error.message}`);
        });
    }
    /**
     * Test connection to ddb-proxy
     */
    async testProxyConnection() {
        try {
            Logger.debug(`Testing proxy connection to: ${this.proxyEndpoint}`);
            const response = await fetch(`${this.proxyEndpoint}/ping`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                Logger.info('Proxy connection successful');
                return true;
            }
            else {
                Logger.warn(`Proxy connection failed with status: ${response.status}`);
                return false;
            }
        }
        catch (error) {
            Logger.error(`Proxy connection error: ${getErrorMessage(error)}`);
            return false;
        }
    }
    /**
     * Authenticate with D&D Beyond through proxy
     * @param cobaltToken - The D&D Beyond Cobalt session token (optional, uses stored token if not provided)
     */
    async authenticate(cobaltToken) {
        try {
            // Use provided token or get from settings
            const token = cobaltToken || getModuleSettings().cobaltToken;
            if (!token) {
                return {
                    success: false,
                    message: 'No cobalt token provided. Please authenticate first.'
                };
            }
            Logger.debug('Attempting authentication with D&D Beyond');
            const response = await fetch(`${this.proxyEndpoint}/proxy/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cobalt: token
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                Logger.info('Authentication successful');
                return {
                    success: true,
                    userId: data.userId,
                    message: 'Authentication successful'
                };
            }
            else {
                Logger.warn(`Authentication failed: ${data.message || 'Unknown error'}`);
                return {
                    success: false,
                    message: data.message || 'Authentication failed'
                };
            }
        }
        catch (error) {
            Logger.error(`Authentication error: ${getErrorMessage(error)}`);
            return {
                success: false,
                message: `Authentication error: ${getErrorMessage(error)}`
            };
        }
    }
    /**
     * Get list of characters from D&D Beyond
     * NOTE: ddb-proxy does not provide a character list endpoint.
     * Users must provide character IDs manually from D&D Beyond URLs.
     */
    async getCharacterList() {
        Logger.warn('Character list not available through ddb-proxy');
        Logger.info('To get characters:');
        Logger.info('1. Go to dndbeyond.com/characters');
        Logger.info('2. Find character IDs in URLs: dndbeyond.com/characters/{ID}');
        Logger.info('3. Use importCharacter(characterId) or getCharacter(characterId)');
        return {
            success: false,
            error: 'Character list endpoint not available in ddb-proxy. Use direct character IDs from D&D Beyond URLs (dndbeyond.com/characters/{ID}).'
        };
    }
    /**
     * Get character data from D&D Beyond
     * @param characterId - The D&D Beyond character ID
     */
    async getCharacter(characterId) {
        try {
            Logger.debug(`Fetching character data for ID: ${characterId}`);
            const cobaltToken = getModuleSettings().cobaltToken;
            if (!cobaltToken) {
                Logger.error('No authentication token available. Please authenticate first.');
                return null;
            }
            const response = await fetch(`${this.proxyEndpoint}/proxy/character`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cobalt: cobaltToken,
                    characterId: parseInt(characterId)
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                // Character data is nested under ddb.character
                const character = data.ddb?.character;
                if (character) {
                    Logger.info(`Retrieved character data for: ${character.name || 'Unknown'}`);
                    return character;
                }
                else {
                    Logger.warn('Character data not found in response');
                    return null;
                }
            }
            else {
                Logger.warn(`Failed to retrieve character: ${data.message || 'Unknown error'}`);
                return null;
            }
        }
        catch (error) {
            Logger.error(`Character fetch error: ${getErrorMessage(error)}`);
            return null;
        }
    }
    /**
     * Import a character from D&D Beyond to FoundryVTT
     * @param characterId - The D&D Beyond character ID
     * @param options - Import options
     */
    async importCharacter(characterId, options = {}) {
        try {
            Logger.info(`Starting character import for ID: ${characterId}`);
            // Get character data from D&D Beyond
            const ddbCharacter = await this.getCharacter(characterId);
            if (!ddbCharacter) {
                return {
                    success: false,
                    errors: ['Failed to fetch character data from D&D Beyond']
                };
            }
            // Merge options with defaults
            const importOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };
            // Parse character data to FoundryVTT format
            const actorData = CharacterParser.parseCharacter(ddbCharacter);
            // Check if character already exists
            const existingActor = game.actors?.find(actor => actor.getFlag('beyond-foundry', 'ddbCharacterId') === ddbCharacter.id);
            let actor;
            if (existingActor) {
                if (importOptions.updateExisting) {
                    Logger.info(`Updating existing character: ${existingActor.name}`);
                    await existingActor.update(actorData);
                    actor = existingActor;
                }
                else {
                    return {
                        success: false,
                        errors: [`Character "${ddbCharacter.name}" already exists. Use update option to overwrite.`],
                        warnings: ['Character import skipped due to existing character']
                    };
                }
            }
            else {
                Logger.info(`Creating new character: ${ddbCharacter.name}`);
                actor = await Actor.create(actorData);
            }
            if (!actor) {
                return {
                    success: false,
                    errors: ['Failed to create character in FoundryVTT']
                };
            }
            const warnings = [];
            // Import spells if the character has any
            if (importOptions.importSpells && ddbCharacter.spells) {
                try {
                    // Count total spells across all spell lists
                    const totalSpells = Object.values(ddbCharacter.spells).reduce((sum, spellArray) => sum + (Array.isArray(spellArray) ? spellArray.length : 0), 0);
                    if (totalSpells > 0) {
                        Logger.info(`Importing ${totalSpells} spells for character: ${actor.name}`);
                        const spellResults = await this.importCharacterSpells(actor, ddbCharacter, importOptions);
                        if (spellResults.warnings?.length > 0) {
                            warnings.push(...spellResults.warnings);
                        }
                        if (spellResults.errors?.length > 0) {
                            warnings.push(`Some spells failed to import: ${spellResults.errors.join(', ')}`);
                        }
                    }
                }
                catch (spellError) {
                    Logger.warn(`Spell import failed: ${getErrorMessage(spellError)}`);
                    warnings.push(`Spell import failed: ${getErrorMessage(spellError)}`);
                }
            }
            Logger.info(`Successfully imported character: ${actor.name}`);
            return {
                success: true,
                actor: actor,
                warnings
            };
        }
        catch (error) {
            Logger.error(`Character import error: ${getErrorMessage(error)}`);
            return {
                success: false,
                errors: [`Character import error: ${getErrorMessage(error)}`]
            };
        }
    }
    /**
     * Import character spells into FoundryVTT actor
     * @param actor - The FoundryVTT actor to import spells into
     * @param ddbCharacter - The D&D Beyond character data
     * @param options - Import options
     */
    async importCharacterSpells(actor, ddbCharacter, options = {}) {
        try {
            const warnings = [];
            const errors = [];
            if (!ddbCharacter.spells) {
                return { success: true, warnings: ['No spells found for character'] };
            }
            // Parse all spells from all spell lists
            const allSpells = [];
            Object.entries(ddbCharacter.spells).forEach(([listKey, spellArray]) => {
                if (Array.isArray(spellArray)) {
                    spellArray.forEach(ddbSpell => {
                        try {
                            const foundrySpell = SpellParser.parseSpell(ddbSpell, {
                                preparationMode: options.spellPreparationMode || 'prepared'
                            });
                            allSpells.push(foundrySpell);
                        }
                        catch (error) {
                            errors.push(`Failed to parse spell: ${ddbSpell.definition?.name || 'Unknown'} - ${getErrorMessage(error)}`);
                            Logger.warn(`Spell parsing error: ${getErrorMessage(error)}`);
                        }
                    });
                }
            });
            // Create spell items in FoundryVTT
            const createdSpells = [];
            for (const spellData of allSpells) {
                try {
                    // Check if spell already exists
                    const existingSpell = actor.items.find(item => item.type === 'spell' &&
                        item.name === spellData.name &&
                        item.getFlag('beyond-foundry', 'ddbId') === spellData.flags?.['beyond-foundry']?.ddbId);
                    if (existingSpell) {
                        if (options.updateExisting) {
                            await existingSpell.update(spellData);
                            Logger.debug(`Updated existing spell: ${spellData.name}`);
                        }
                        else {
                            warnings.push(`Spell "${spellData.name}" already exists, skipped`);
                        }
                    }
                    else {
                        const createdSpell = await actor.createEmbeddedDocuments('Item', [spellData]);
                        createdSpells.push(...createdSpell);
                        Logger.debug(`Created new spell: ${spellData.name}`);
                    }
                }
                catch (error) {
                    errors.push(`Failed to create spell item: ${spellData.name} - ${getErrorMessage(error)}`);
                    Logger.warn(`Spell creation error: ${getErrorMessage(error)}`);
                }
            }
            Logger.info(`Successfully imported ${createdSpells.length} spells for character: ${actor.name}`);
            return {
                success: true,
                warnings: warnings.length > 0 ? warnings : undefined,
                errors: errors.length > 0 ? errors : undefined
            };
        }
        catch (error) {
            Logger.error(`Character spell import error: ${getErrorMessage(error)}`);
            return {
                success: false,
                errors: [`Character spell import error: ${getErrorMessage(error)}`]
            };
        }
    }
    /**
     * Test method for development
     * Quick test of API connectivity with existing ddb-proxy
     */
    async runConnectionTest() {
        Logger.info('Running Beyond Foundry connection test...');
        // Test 1: Proxy connection
        const proxyTest = await this.testProxyConnection();
        ui.notifications.info(`Proxy connection: ${proxyTest ? 'SUCCESS' : 'FAILED'}`);
        // Test 2: Authentication (if token available)
        try {
            const cobaltToken = getModuleSettings().cobaltToken;
            if (cobaltToken) {
                const authResult = await this.authenticate(cobaltToken);
                ui.notifications.info(`Authentication: ${authResult.success ? 'SUCCESS' : 'FAILED'}`);
                if (!authResult.success) {
                    Logger.warn(`Authentication failed: ${authResult.message}`);
                }
            }
            else {
                ui.notifications.warn('Authentication: SKIPPED (No cobalt token configured)');
                Logger.info('To test authentication, configure your cobalt token in module settings');
            }
        }
        catch (error) {
            ui.notifications.error(`Authentication test failed: ${error.message}`);
        }
        // Explain character testing
        Logger.info('\n💡 Character Testing:');
        Logger.info('Character list is not available through ddb-proxy.');
        Logger.info('To test character import:');
        Logger.info('1. Get character ID from D&D Beyond URL: dndbeyond.com/characters/{ID}');
        Logger.info('2. Use: game.modules.get("beyond-foundry").api.quickTest("cobalt-token", "character-id")');
        Logger.info('Connection test complete');
    }
    /**
     * Quick authentication and character test
     * @param cobaltToken - Your D&D Beyond CobaltSession cookie value
     * @param characterId - Optional specific character ID to test with
     */
    async quickTest(cobaltToken, characterId) {
        Logger.info('Running quick authentication test...');
        try {
            // Test authentication
            const authResult = await this.authenticate(cobaltToken);
            if (!authResult.success) {
                ui.notifications.error(`Authentication failed: ${authResult.message}`);
                return;
            }
            ui.notifications.info('✅ Authentication successful!');
            Logger.info(`✅ Authenticated as user ID: ${authResult.userId}`);
            // Test character retrieval if ID provided
            if (characterId) {
                Logger.info(`Testing character retrieval for ID: ${characterId}...`);
                const character = await this.getCharacter(characterId);
                if (character) {
                    ui.notifications.info(`✅ Character found: ${character.name}`);
                    Logger.info(`✅ Character Details:`);
                    Logger.info(`  - Name: ${character.name}`);
                    Logger.info(`  - Race: ${character.race?.fullName || 'Unknown'}`);
                    Logger.info(`  - Classes: ${character.classes?.map(c => `${c.definition?.name} ${c.level}`).join(', ') || 'Unknown'}`);
                    Logger.info(`  - Background: ${character.background?.definition?.name || 'Unknown'}`);
                    Logger.info(`  - HP: ${character.baseHitPoints || 'Unknown'}`);
                    Logger.info(`\n💡 To import this character, run:`);
                    Logger.info(`game.modules.get("beyond-foundry").api.importCharacter("${characterId}")`);
                }
                else {
                    ui.notifications.warn(`❌ Failed to retrieve character with ID: ${characterId}`);
                    Logger.warn('Make sure the character ID is correct and accessible with your account');
                }
            }
            else {
                // Explain how to get character IDs
                Logger.info('\n📋 To test character import:');
                Logger.info('1. Go to dndbeyond.com/characters');
                Logger.info('2. Click on a character');
                Logger.info('3. Copy the ID from the URL: dndbeyond.com/characters/{ID}');
                Logger.info('4. Run: game.modules.get("beyond-foundry").api.quickTest("your-cobalt-token", "character-id")');
            }
        }
        catch (error) {
            ui.notifications.error(`Quick test failed: ${error.message}`);
            Logger.error(`Quick test error: ${getErrorMessage(error)}`);
        }
    }
}

/**
 * Authentication dialog for D&D Beyond integration
 * Handles Cobalt token input and validation
 */
class AuthDialog extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: `${MODULE_ID}-auth-dialog`,
            title: 'D&D Beyond Authentication',
            template: 'modules/beyond-foundry/templates/auth-dialog.hbs',
            width: 500,
            height: 'auto',
            classes: ['beyond-foundry', 'auth-dialog'],
            resizable: false,
            minimizable: false,
            closeOnSubmit: false,
            submitOnChange: false,
            submitOnClose: false,
        });
    }
    /**
     * Activate event listeners
     */
    activateListeners(html) {
        super.activateListeners(html);
        // Handle form submission
        html.find('form').on('submit', this._onSubmitAuth.bind(this));
        // Handle test connection button
        html.find('.test-connection').on('click', this._onTestConnection.bind(this));
        // Handle help button
        html.find('.help-button').on('click', this._onShowHelp.bind(this));
    }
    /**
     * Handle authentication form submission
     */
    async _onSubmitAuth(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const cobaltToken = formData.get('cobaltToken');
        if (!cobaltToken || cobaltToken.trim() === '') {
            ui.notifications.error('Please enter your Cobalt session token');
            return;
        }
        try {
            Logger.info('Attempting D&D Beyond authentication...');
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Authenticating...';
            submitButton.disabled = true;
            const api = BeyondFoundryAPI.getInstance();
            const result = await api.authenticate(cobaltToken.trim());
            if (result.success) {
                ui.notifications.info('Authentication successful!');
                // Store token in settings for future use
                await game.settings.set(MODULE_ID, 'cobaltToken', cobaltToken.trim());
                this.close();
            }
            else {
                ui.notifications.error(`Authentication failed: ${result.message}`);
            }
            // Restore button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
        catch (error) {
            Logger.error(`Authentication error: ${error.message}`);
            ui.notifications.error(`Authentication error: ${error.message}`);
        }
    }
    /**
     * Test proxy connection
     */
    async _onTestConnection(event) {
        event.preventDefault();
        try {
            const api = BeyondFoundryAPI.getInstance();
            const connected = await api.testProxyConnection();
            if (connected) {
                ui.notifications.info('Proxy connection successful!');
            }
            else {
                ui.notifications.error('Proxy connection failed. Check your ddb-proxy setup.');
            }
        }
        catch (error) {
            Logger.error(`Connection test error: ${error.message}`);
            ui.notifications.error(`Connection test failed: ${error.message}`);
        }
    }
    /**
     * Show help information
     */
    _onShowHelp(event) {
        event.preventDefault();
        new Dialog({
            title: 'Getting Your Cobalt Token',
            content: `
        <div class="beyond-foundry-help">
          <h3>How to find your Cobalt session token:</h3>
          <ol>
            <li>Log in to <a href="https://www.dndbeyond.com" target="_blank">D&D Beyond</a></li>
            <li>Open your browser's Developer Tools (F12)</li>
            <li>Go to the <strong>Application</strong> or <strong>Storage</strong> tab</li>
            <li>Look for <strong>Cookies</strong> under the D&D Beyond domain</li>
            <li>Find the cookie named <strong>CobaltSession</strong></li>
            <li>Copy its value (should be a long string)</li>
          </ol>
          <p><strong>Important:</strong> Keep this token private! It provides access to your D&D Beyond account.</p>
          <p><em>The token will expire periodically and you'll need to get a new one.</em></p>
        </div>
      `,
            buttons: {
                ok: {
                    label: 'Got it!',
                    callback: () => { }
                }
            }
        }).render(true);
    }
    /**
     * Get template data
     */
    getData() {
        return {
            isConnected: false, // TODO: Check if already authenticated
            proxyUrl: game.settings.get(MODULE_ID, 'proxyUrl')
        };
    }
    /**
     * Static method to show authentication dialog
     */
    static show() {
        const dialog = new AuthDialog();
        dialog.render(true);
        return dialog;
    }
}

/**
 * Character import dialog for manual character ID input and importing
 */
class CharacterImportDialog extends Application {
    pendingCharacters = new Map();
    loading = false;
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: `${MODULE_ID}-character-import-dialog`,
            title: 'Import D&D Beyond Characters',
            template: 'modules/beyond-foundry/templates/character-import-dialog-v2.hbs',
            width: 700,
            height: 600,
            classes: ['beyond-foundry', 'character-import-dialog'],
            resizable: true,
            minimizable: false,
            closeOnSubmit: false,
            submitOnChange: false,
            submitOnClose: false,
        });
    }
    /**
     * Activate event listeners
     */
    activateListeners(html) {
        super.activateListeners(html);
        // Authentication button
        html.find('.authenticate').on('click', this._onAuthenticate.bind(this));
        // Add single character button
        html.find('.add-character-btn').on('click', this._onAddCharacter.bind(this));
        // Add bulk characters button
        html.find('.add-bulk-characters-btn').on('click', this._onAddBulkCharacters.bind(this));
        // Remove character buttons (using event delegation for dynamic elements)
        html.on('click', '.remove-character-btn', this._onRemoveCharacter.bind(this));
        // Preview all characters button
        html.find('.preview-all-btn').on('click', this._onPreviewAllCharacters.bind(this));
        // Clear all characters button
        html.find('.clear-all-btn').on('click', this._onClearAllCharacters.bind(this));
        // Import characters button
        html.find('.import-characters').on('click', this._onImportCharacters.bind(this));
        // Enter key handling for character ID input
        html.find('#character-id-input').on('keypress', (event) => {
            if (event.which === 13) { // Enter key
                event.preventDefault();
                // Create a fake event for compatibility
                const fakeEvent = { preventDefault: () => { } };
                this._onAddCharacter(fakeEvent);
            }
        });
    }
    /**
     * Add a single character by ID
     */
    async _onAddCharacter(event) {
        event.preventDefault();
        const input = this.element.find('#character-id-input')[0];
        const characterId = input.value.trim();
        if (!characterId) {
            ui.notifications.warn('Please enter a character ID');
            return;
        }
        if (!/^\d+$/.test(characterId)) {
            ui.notifications.error('Character ID must be a number');
            return;
        }
        if (this.pendingCharacters.has(characterId)) {
            ui.notifications.warn('Character already added');
            return;
        }
        // Add character to pending list
        this.pendingCharacters.set(characterId, {
            id: characterId,
            loading: false,
            loaded: false
        });
        // Clear input
        input.value = '';
        // Re-render to show the new character
        this.render();
    }
    /**
     * Add multiple characters from bulk input
     */
    async _onAddBulkCharacters(event) {
        event.preventDefault();
        const textarea = this.element.find('#bulk-character-ids')[0];
        const text = textarea.value.trim();
        if (!text) {
            ui.notifications.warn('Please enter character IDs');
            return;
        }
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let added = 0;
        let skipped = 0;
        for (const line of lines) {
            if (!/^\d+$/.test(line)) {
                ui.notifications.warn(`Skipping invalid character ID: ${line}`);
                skipped++;
                continue;
            }
            if (this.pendingCharacters.has(line)) {
                skipped++;
                continue;
            }
            this.pendingCharacters.set(line, {
                id: line,
                loading: false,
                loaded: false
            });
            added++;
        }
        // Clear textarea
        textarea.value = '';
        if (added > 0) {
            ui.notifications.info(`Added ${added} character(s)`);
        }
        if (skipped > 0) {
            ui.notifications.warn(`Skipped ${skipped} character(s) (invalid or already added)`);
        }
        // Re-render to show the new characters
        this.render();
    }
    /**
     * Remove a character from the pending list
     */
    _onRemoveCharacter(event) {
        event.preventDefault();
        const button = event.target;
        const characterId = button.dataset.characterId || button.closest('[data-character-id]')?.getAttribute('data-character-id');
        if (characterId && this.pendingCharacters.has(characterId)) {
            this.pendingCharacters.delete(characterId);
            this.render();
        }
    }
    /**
     * Preview all characters (load their data)
     */
    async _onPreviewAllCharacters(event) {
        event.preventDefault();
        if (this.loading)
            return;
        const unloadedCharacters = Array.from(this.pendingCharacters.values())
            .filter(char => !char.loading && !char.loaded && !char.error);
        if (unloadedCharacters.length === 0) {
            ui.notifications.info('All characters are already loaded');
            return;
        }
        this.loading = true;
        // Mark all as loading
        for (const char of unloadedCharacters) {
            char.loading = true;
        }
        this.render();
        const api = BeyondFoundryAPI.getInstance();
        // Load characters in parallel
        const promises = unloadedCharacters.map(async (char) => {
            try {
                const result = await api.getCharacter(char.id);
                if (result.success && result.character) {
                    char.character = result.character;
                    char.loaded = true;
                    char.error = undefined;
                }
                else {
                    char.error = result.error || 'Failed to load character';
                    char.loaded = false;
                }
            }
            catch (error) {
                char.error = error.message || 'Unknown error';
                char.loaded = false;
            }
            finally {
                char.loading = false;
            }
        });
        await Promise.all(promises);
        this.loading = false;
        this.render();
        const successful = unloadedCharacters.filter(char => char.loaded).length;
        const failed = unloadedCharacters.length - successful;
        if (successful > 0) {
            ui.notifications.info(`Successfully loaded ${successful} character(s)`);
        }
        if (failed > 0) {
            ui.notifications.warn(`Failed to load ${failed} character(s)`);
        }
    }
    /**
     * Clear all characters from the pending list
     */
    _onClearAllCharacters(event) {
        event.preventDefault();
        this.pendingCharacters.clear();
        this.render();
    }
    /**
     * Open authentication dialog
     */
    async _onAuthenticate(event) {
        event.preventDefault();
        const authDialog = AuthDialog.show();
        // Listen for successful authentication
        authDialog.element.on('close', () => {
            // Refresh the dialog to show updated auth status
            this.render();
        });
    }
    /**
     * Get import options from form inputs
     */
    _getImportOptions() {
        const importSpells = this.element.find('#import-spells')[0]?.checked ?? true;
        const importItems = this.element.find('#import-items')[0]?.checked ?? true;
        const updateExisting = this.element.find('#update-existing')[0]?.checked ?? false;
        const spellPreparationMode = this.element.find('#spell-preparation-mode')[0]?.value ?? 'prepared';
        return {
            importSpells,
            importItems,
            updateExisting,
            spellPreparationMode: spellPreparationMode,
            createCompendiumItems: false // Default to false for now
        };
    }
    /**
     * Import all loaded characters
     */
    async _onImportCharacters(event) {
        event.preventDefault();
        const readyCharacters = Array.from(this.pendingCharacters.values())
            .filter(char => char.loaded && char.character);
        if (readyCharacters.length === 0) {
            ui.notifications.warn('No characters are ready to import. Please preview characters first.');
            return;
        }
        // Get import options from form
        const importOptions = this._getImportOptions();
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Importing...';
        button.disabled = true;
        try {
            const api = BeyondFoundryAPI.getInstance();
            const results = [];
            for (const pendingChar of readyCharacters) {
                Logger.info(`Importing character: ${pendingChar.character.name} (ID: ${pendingChar.id})`);
                const result = await api.importCharacter(pendingChar.id, importOptions);
                results.push({
                    characterId: pendingChar.id,
                    characterName: pendingChar.character.name,
                    result
                });
            }
            // Show results
            const successful = results.filter(r => r.result.success).length;
            const failed = results.length - successful;
            if (successful > 0) {
                ui.notifications.info(`Successfully imported ${successful} character(s)`);
            }
            if (failed > 0) {
                ui.notifications.warn(`Failed to import ${failed} character(s)`);
                // Log failed imports
                results.filter(r => !r.result.success).forEach(r => {
                    Logger.error(`Failed to import ${r.characterName}: ${r.result.errors?.join(', ')}`);
                });
            }
            // Show spell import warnings if any
            results.forEach(r => {
                if (r.result.warnings?.length > 0) {
                    Logger.warn(`Warnings for ${r.characterName}: ${r.result.warnings.join(', ')}`);
                }
            });
            // Close dialog if all successful
            if (failed === 0) {
                this.close();
            }
        }
        catch (error) {
            Logger.error(`Import error: ${error.message}`);
            ui.notifications.error(`Import failed: ${error.message}`);
        }
        finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
    /**
     * Check if user is authenticated
     */
    _isAuthenticated() {
        const settings = game.settings.get(MODULE_ID, 'cobaltToken');
        return !!(settings && settings.trim() !== '');
    }
    /**
     * Get template data
     */
    getData() {
        const pendingCharactersList = Array.from(this.pendingCharacters.values());
        const readyToImport = pendingCharactersList.filter(char => char.loaded && char.character);
        return {
            isAuthenticated: this._isAuthenticated(),
            pendingCharacters: pendingCharactersList,
            readyToImport: readyToImport.length > 0,
            readyCount: readyToImport.length,
            loading: this.loading
        };
    }
    /**
     * Static method to show character import dialog
     */
    static show() {
        const dialog = new CharacterImportDialog();
        dialog.render(true);
        return dialog;
    }
}

/**
 * Beyond Foundry Module Entry Point
 *
 * This module allows importing purchased D&D Beyond content into FoundryVTT
 * with support for characters, spells, items, and more.
 */
// Initialize module when Foundry is ready
Hooks.once('init', async () => {
    Logger.info(`Initializing ${MODULE_NAME}...`);
    // Register module settings
    registerSettings();
    // Initialize API
    const api = BeyondFoundryAPI.getInstance();
    // Expose API globally for console access and other modules
    game.modules.get(MODULE_ID).api = api;
    Logger.info(`${MODULE_NAME} initialized successfully`);
});
// Setup module when ready
Hooks.once('ready', async () => {
    Logger.info(`${MODULE_NAME} ready`);
    // Initialize API with current settings
    const api = BeyondFoundryAPI.getInstance();
    api.init();
    // Add console message for developers
    Logger.info('Access the API via: game.modules.get("beyond-foundry").api');
});
// Add character sheet header button for import
Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
    // Only add to character sheets in D&D 5e system
    if (app.actor.type !== 'character' || game.system.id !== 'dnd5e') {
        return;
    }
    buttons.unshift({
        label: 'Import from D&D Beyond',
        class: 'beyond-foundry-import',
        icon: 'fas fa-download',
        onclick: () => {
            Logger.info('D&D Beyond import button clicked');
            CharacterImportDialog.show();
        }
    });
});
// Add actor directory context menu option
Hooks.on('getActorDirectoryEntryContext', (html, options) => {
    options.push({
        name: 'Import from D&D Beyond',
        icon: '<i class="fas fa-download"></i>',
        condition: () => game.system.id === 'dnd5e',
        callback: () => {
            Logger.info('D&D Beyond import context menu clicked');
            CharacterImportDialog.show();
        }
    });
});
// Console command for testing (development)
Hooks.once('ready', () => {
    if (game.settings.get(MODULE_ID, 'debugMode')) {
        Logger.info('Debug mode enabled - test commands available');
        Logger.info('Try: game.modules.get("beyond-foundry").api.runConnectionTest()');
    }
});
Logger.info(`${MODULE_NAME} module loaded`);
//# sourceMappingURL=beyond-foundry.js.map
