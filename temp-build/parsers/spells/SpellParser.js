import { Logger } from '../../module/utils/logger.js';
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
export class SpellParser {
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
                    unidentified: '',
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
                properties: this.parseProperties(definition),
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
                    restriction: ddbSpell.restriction || null,
                },
            },
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
            7: 'day', // Day
        };
        return {
            type: typeMap[activation.activationType] || 'action',
            cost: activation.activationTime || 1,
            condition: activation.activationCondition || '',
        };
    }
    /**
     * Parse spell duration
     */
    static parseDuration(definition) {
        const duration = definition.duration || {};
        const unitMap = {
            Instantaneous: 'inst',
            Round: 'round',
            Minute: 'minute',
            Hour: 'hour',
            Day: 'day',
            Week: 'week',
            Month: 'month',
            Year: 'year',
            Permanent: 'perm',
            Special: 'spec',
            Time: 'minute', // D&D Beyond uses "Time" for various durations
            Concentration: 'minute', // Concentration spells usually have minute duration
            'Until Dispelled': 'perm',
            'Until Dispelled or Triggered': 'perm',
        };
        const durationUnit = duration.durationType || 'Instantaneous';
        const mappedUnit = unitMap[durationUnit];
        return {
            value: duration.durationInterval || null,
            units: mappedUnit || 'inst',
        };
    }
    /**
     * Parse spell target information
     */
    static parseTarget(definition) {
        const range = definition.range || {};
        const typeMap = {
            Self: 'self',
            Touch: 'touch',
            Ranged: 'creature',
            Point: 'space',
            Line: 'line',
            Cone: 'cone',
            Cube: 'cube',
            Cylinder: 'cylinder',
            Sphere: 'sphere',
            Square: 'square',
        };
        return {
            value: range.aoeValue || null,
            width: null,
            units: 'ft',
            type: typeMap[range.aoeType || range.origin] || 'creature',
        };
    }
    /**
     * Parse spell range
     */
    static parseRange(definition) {
        const range = definition.range || {};
        const unitMap = {
            Self: 'self',
            Touch: 'touch',
            Ranged: 'ft',
            Sight: 'spec',
            Unlimited: 'any',
        };
        return {
            value: range.rangeValue || null,
            long: null,
            units: unitMap[range.origin] || 'ft',
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
                recovery: '',
            };
        }
        const recoveryMap = {
            1: 'sr', // Short rest
            2: 'lr', // Long rest
            3: 'day', // Per day
            4: 'charges', // Charges
        };
        return {
            value: limitedUse.maxUses || null,
            max: limitedUse.maxUses?.toString() || '',
            per: recoveryMap[limitedUse.resetType] || null,
            recovery: '',
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
            scale: false,
        };
    }
    /**
     * Parse spellcasting ability
     */
    static parseAbility(ddbSpell) {
        // This would typically come from the character's class
        // For now, return null to use character's default
        return ddbSpell.spellCastingAbilityId
            ? this.mapAbilityId(ddbSpell.spellCastingAbilityId)
            : null;
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
            damage: '',
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
            value: '',
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
                scaling: 'spell',
            };
        }
        const abilityMap = {
            1: 'str',
            2: 'dex',
            3: 'con',
            4: 'int',
            5: 'wis',
            6: 'cha',
        };
        return {
            ability: abilityMap[definition.saveType] || '',
            dc: null, // Will be calculated from character's spell DC
            scaling: 'spell',
        };
    }
    /**
     * Parse spell school
     */
    static parseSchool(school) {
        const schoolMap = {
            Abjuration: 'abj',
            Conjuration: 'con',
            Divination: 'div',
            Enchantment: 'enc',
            Evocation: 'evo',
            Illusion: 'ill',
            Necromancy: 'nec',
            Transmutation: 'trs',
        };
        // Handle both capitalized and lowercase school names
        const normalizedSchool = school
            ? school.charAt(0).toUpperCase() + school.slice(1).toLowerCase()
            : '';
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
            concentration: definition.concentration || false,
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
            supply: 0,
        };
    }
    /**
     * Parse spell preparation mode and status
     */
    static parsePreparation(ddbSpell, options) {
        const mode = options.preparationMode || 'prepared';
        return {
            mode,
            prepared: ddbSpell.prepared || false,
        };
    }
    /**
     * Parse spell scaling (higher level effects)
     */
    static parseScaling(definition) {
        if (!definition.higherLevelDescription) {
            return {
                mode: 'none',
                formula: '',
            };
        }
        // Try to extract scaling formula from higher level description
        const scalingFormula = this.extractScalingFormula(definition.higherLevelDescription);
        return {
            mode: scalingFormula ? 'level' : 'none',
            formula: scalingFormula,
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
            Abjuration: 'icons/magic/defensive/shield-barrier-blue.webp',
            Conjuration: 'icons/magic/symbols/elements-air-earth-fire-water.webp',
            Divination: 'icons/magic/perception/eye-ringed-glow-yellow.webp',
            Enchantment: 'icons/magic/control/hypnosis-mesmerism-swirl.webp',
            Evocation: 'icons/magic/lightning/bolt-strike-blue.webp',
            Illusion: 'icons/magic/perception/silhouette-stealth-shadow.webp',
            Necromancy: 'icons/magic/death/skull-horned-goat-pentagram-red.webp',
            Transmutation: 'icons/magic/symbols/question-stone-yellow.webp',
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
            flags: {},
        };
    }
    /**
     * Map DDB ability ID to Foundry ability key
     */
    static mapAbilityId(abilityId) {
        const abilityMap = {
            1: 'str',
            2: 'dex',
            3: 'con',
            4: 'int',
            5: 'wis',
            6: 'cha',
        };
        return abilityMap[abilityId] || 'int';
    }
    /**
     * Extract cost from material component description
     */
    static extractCost(materials) {
        const costMatch = materials.match(/(\d+)\s*gp/i);
        return costMatch && costMatch[1] ? parseInt(costMatch[1]) : 0;
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
            /(\d+d\d+) additional/i,
        ];
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
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
