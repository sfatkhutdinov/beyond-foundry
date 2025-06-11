/**
 * DOM-based spell parser for D&D Beyond spell pages
 * Based on analysis of spell.html structure
 */

export interface DDBSpellFromHTML {
  id: number;
  name: string;
  level: string;
  castingTime: string;
  isRitual: boolean;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string | undefined;
  };
  duration: string;
  school: string;
  attackSave: string;
  damageEffect: string;
  description: string;
  tags: string[];
  classes: string[];
  source: string;
  image?: string | undefined;
}

export class DDBSpellHTMLParser {
  /**
   * Parse a D&D Beyond spell page from HTML document
   */
  static parseSpellFromHTML(doc: Document): DDBSpellFromHTML | null {
    try {
      // Extract spell ID from URL or cobaltVcmList
      const spellId = this.extractSpellId(doc);
      if (!spellId) return null;

      // Get main spell container
      const spellDetails = doc.querySelector('.spell-details');
      if (!spellDetails) return null;

      // Get stat block
      const statblock = spellDetails.querySelector('.ddb-statblock-spell');
      if (!statblock) return null;

      // Parse basic properties
      const name = this.extractSpellName(doc);
      const level = this.extractStatblockValue(statblock, 'level');
      const castingTime = this.extractStatblockValue(statblock, 'casting-time');
      const range = this.extractStatblockValue(statblock, 'range-area');
      const duration = this.extractStatblockValue(statblock, 'duration');
      const school = this.extractStatblockValue(statblock, 'school');
      const attackSave = this.extractStatblockValue(statblock, 'attack-save');
      const damageEffect = this.extractStatblockValue(statblock, 'damage-effect');

      // Parse components
      const components = this.extractComponents(statblock);

      // Check if ritual
      const isRitual = this.isRitualSpell(spellDetails);

      // Parse description
      const description = this.extractDescription(spellDetails);

      // Parse tags and classes
      const tags = this.extractTags(spellDetails);
      const classes = this.extractClasses(spellDetails);

      // Parse source
      const source = this.extractSource(spellDetails);

      // Parse image
      const image = this.extractImage(spellDetails);

      return {
        id: spellId,
        name,
        level,
        castingTime,
        isRitual,
        range,
        components,
        duration,
        school,
        attackSave,
        damageEffect,
        description,
        tags,
        classes,
        source,
        image
      };

    } catch (error) {
      console.error('Error parsing spell from HTML:', error);
      return null;
    }
  }

  private static extractSpellId(doc: Document): number | null {
    // Try to extract from URL
    const url = doc.location?.href ?? doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (url) {
      const urlRegex = /\/spells\/(\d+)-/;
      const match = urlRegex.exec(url);
      if (match?.[1]) return parseInt(match[1], 10);
    }

    // Try to extract from cobaltVcmList script
    const scripts = doc.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent ?? '';
      const cobaltRegex = /cobaltVcmList\.push\({type:\d+, id:(\d+)\}/;
      const match = cobaltRegex.exec(content);
      if (match?.[1]) return parseInt(match[1], 10);
    }

    return null;
  }

  private static extractSpellName(doc: Document): string {
    const titleElement = doc.querySelector('.page-title, h1');
    return titleElement?.textContent?.trim() ?? 'Unknown Spell';
  }

  private static extractStatblockValue(statblock: Element, property: string): string {
    const item = statblock.querySelector(`.ddb-statblock-item-${property}`);
    const value = item?.querySelector('.ddb-statblock-item-value');
    return value?.textContent?.trim() ?? '';
  }

  private static extractComponents(statblock: Element): DDBSpellFromHTML['components'] {
    const componentsItem = statblock.querySelector('.ddb-statblock-item-components');
    const componentsText = componentsItem?.querySelector('.ddb-statblock-item-value')?.textContent?.trim() ?? '';
    
    // Parse component string (e.g., "V, S, M *")
    const verbal = componentsText.includes('V');
    const somatic = componentsText.includes('S');
    const material = componentsText.includes('M');

    // Extract material description if present
    let materialDescription: string | undefined;
    const componentsBlurb = statblock.parentElement?.querySelector('.components-blurb');
    if (componentsBlurb) {
      const text = componentsBlurb.textContent?.trim();
      // Extract text between parentheses: "* - (a drop of mercury)" -> "a drop of mercury"
      const materialRegex = /\* - \(([^)]+)\)/;
      const match = materialRegex.exec(text ?? '');
      if (match?.[1]) materialDescription = match[1];
    }

    return {
      verbal,
      somatic,
      material,
      materialDescription
    };
  }

  private static isRitualSpell(spellDetails: Element): boolean {
    return !!spellDetails.querySelector('.i-ritual, [class*="ritual"]');
  }

  private static extractDescription(spellDetails: Element): string {
    const content = spellDetails.querySelector('.more-info-content');
    if (!content) return '';

    // Get all paragraph elements and join them
    const paragraphs = content.querySelectorAll('p');
    return Array.from(paragraphs)
      .map(p => p.textContent?.trim())
      .filter(text => text && !text.startsWith('* -')) // Filter out component descriptions
      .join('\\n\\n');
  }

  private static extractTags(spellDetails: Element): string[] {
    const tagsContainer = spellDetails.querySelector('.spell-tags');
    if (!tagsContainer) return [];

    const tagElements = tagsContainer.querySelectorAll('.tag.spell-tag');
    return Array.from(tagElements).map(tag => tag.textContent?.trim() ?? '').filter(Boolean);
  }

  private static extractClasses(spellDetails: Element): string[] {
    const classesContainer = spellDetails.querySelector('.available-for');
    if (!classesContainer) return [];

    const classElements = classesContainer.querySelectorAll('.tag.class-tag');
    return Array.from(classElements).map(tag => tag.textContent?.trim() ?? '').filter(Boolean);
  }

  private static extractSource(spellDetails: Element): string {
    const sourceElement = spellDetails.querySelector('.spell-source');
    return sourceElement?.textContent?.trim() ?? '';
  }

  private static extractImage(spellDetails: Element): string | undefined {
    const imageElement = spellDetails.querySelector('.spell-image');
    const src = imageElement?.getAttribute('src');
    if (!src) return undefined;
    
    if (src.startsWith('//')) {
      return 'https:' + src;
    }
    return src;
  }

  /**
   * Convert HTML-parsed spell to FoundryVTT format
   */
  static convertToFoundryFormat(htmlSpell: DDBSpellFromHTML): Record<string, unknown> {
    return {
      name: htmlSpell.name,
      type: 'spell',
      system: {
        description: {
          value: htmlSpell.description,
          chat: '',
          unidentified: ''
        },
        source: htmlSpell.source,
        level: this.parseSpellLevel(htmlSpell.level),
        school: htmlSpell.school.toLowerCase(),
        components: {
          vocal: htmlSpell.components.verbal,
          somatic: htmlSpell.components.somatic,
          material: htmlSpell.components.material,
          ritual: htmlSpell.isRitual,
          concentration: false // Would need additional parsing
        },
        materials: {
          value: htmlSpell.components.materialDescription ?? '',
          consumed: false,
          cost: 0,
          supply: 0
        },
        preparation: {
          mode: 'prepared',
          prepared: false
        },
        scaling: {
          mode: 'none',
          formula: ''
        },
        range: {
          value: this.parseRange(htmlSpell.range),
          long: null,
          units: this.parseRangeUnits(htmlSpell.range)
        },
        target: {
          value: null,
          width: null,
          units: '',
          type: ''
        },
        duration: {
          value: this.parseDuration(htmlSpell.duration),
          units: this.parseDurationUnits(htmlSpell.duration)
        },
        actionType: this.parseActionType(htmlSpell.attackSave),
        damage: {
          parts: [],
          versatile: ''
        },
        formula: '',
        save: {
          ability: '',
          dc: null,
          scaling: 'spell'
        }
      },
      img: htmlSpell.image,
      flags: {
        'beyond-foundry': {
          spellId: htmlSpell.id,
          tags: htmlSpell.tags,
          classes: htmlSpell.classes
        }
      }
    };
  }

  private static parseSpellLevel(levelText: string): number {
    const levelRegex = /(\d+)/;
    const match = levelRegex.exec(levelText);
    return match?.[1] ? parseInt(match[1], 10) : 0;
  }

  private static parseRange(rangeText: string): number | null {
    const rangeRegex = /(\d+)/;
    const match = rangeRegex.exec(rangeText);
    return match?.[1] ? parseInt(match[1], 10) : null;
  }

  private static parseRangeUnits(rangeText: string): string {
    if (rangeText.includes('ft')) return 'ft';
    if (rangeText.includes('mi')) return 'mi';
    if (rangeText.toLowerCase().includes('touch')) return 'touch';
    if (rangeText.toLowerCase().includes('self')) return 'self';
    return 'ft';
  }

  private static parseDuration(durationText: string): number | null {
    const durationRegex = /(\d+)/;
    const match = durationRegex.exec(durationText);
    return match?.[1] ? parseInt(match[1], 10) : null;
  }

  private static parseDurationUnits(durationText: string): string {
    const lower = durationText.toLowerCase();
    if (lower.includes('minute')) return 'minute';
    if (lower.includes('hour')) return 'hour';
    if (lower.includes('day')) return 'day';
    if (lower.includes('round')) return 'round';
    if (lower.includes('turn')) return 'turn';
    if (lower.includes('instantaneous')) return 'inst';
    return 'inst';
  }

  private static parseActionType(attackSaveText: string): string {
    const lower = attackSaveText.toLowerCase();
    if (lower.includes('save')) return 'save';
    if (lower.includes('attack')) return 'attack';
    return 'util';
  }
}
