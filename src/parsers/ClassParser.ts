// ClassParser.ts - Fixed version
import type { DDBClass } from '../types/index.js';
import { load } from 'cheerio';

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
  name?: string;
  additionalTables?: unknown;
}

export class ClassParser {
  /**
   * Extract HTML from JSON wrapper if present
   */
  private static extractHtmlContent(input: string): string {
    const trimmed = input.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.contentContainer) return parsed.contentContainer;
      } catch {
        // Not valid JSON, fall through
      }
    }
    // Otherwise, treat as raw HTML
    return input;
  }

  /**
   * Parse features from HTML with proper deduplication and h2/h3 handling
   */
  public static parseFeaturesFromHtml(htmlInput: string): Array<{ name: string; description: string; requiredLevel: number }> {
    // Extract HTML from JSON if needed
    const html = this.extractHtmlContent(htmlInput);
    const $ = load(html);
    const features: Array<{ name: string; description: string; requiredLevel: number }> = [];
    
    // Track processed features to avoid duplicates
    const processedFeatures = new Map<string, Set<number>>();
    
    console.log('Starting HTML parsing...');
    
    // Find all tables
    const tables = $('table');
    console.log(`Found ${tables.length} table(s)`);
    
    if (tables.length === 0) {
      console.warn('No tables found in HTML');
      return features;
    }
    
    // Process the first table (features table)
    const table = tables.first();
    const rows = table.find('tbody tr');
    console.log(`Found ${rows.length} rows in table body`);
    
    rows.each((rowIndex, row) => {
      const tds = $(row).find('td');
      if (tds.length < 2) return;
      // Extract level from first <td>
      const levelText = $(tds[0]).text().trim();
      const levelReg = /(\d+)/;
      const levelMatch = levelReg.exec(levelText);
      const requiredLevel = levelMatch ? parseInt(levelMatch[1], 10) : 1;
      // Debug: print the HTML of the last <td>
      const lastTd = tds[tds.length - 1];
      console.log('Row', rowIndex, 'lastTd HTML:', $(lastTd).html());
      const featureLinks = $(lastTd).find('a');
      console.log('Row', rowIndex, 'featureLinks count:', featureLinks.length);
      featureLinks.each((i, a) => {
        console.log('  Feature', i, ':', $(a).text(), $(a).attr('href'));
        const $a = $(a);
        const name = $a.text().trim().replace(/\s+/g, ' ');
        const href = $a.attr('href') || '';
        if (!name || !href.startsWith('#')) {
          return;
        }
        // Check if we've already processed this feature at this level
        if (!processedFeatures.has(name)) {
          processedFeatures.set(name, new Set());
        }
        const levelsForFeature = processedFeatures.get(name);
        if (levelsForFeature && levelsForFeature.has(requiredLevel)) {
          console.log(`Skipping duplicate: ${name} at level ${requiredLevel}`);
          return;
        }
        levelsForFeature?.add(requiredLevel);
        // Get description
        const description = this.extractFeatureDescription($, href.slice(1), name);
        features.push({ 
          name, 
          description, 
          requiredLevel 
        });
      });
    });
    
    console.log(`Total unique features parsed: ${features.length}`);
    return features;
  }
  
  /**
   * Extract feature description, handling h2/h3/h4 elements
   *
   * @param $ - Cheerio static instance (dynamic, requires 'any' due to cheerio API)
   * @param anchorId - The anchor ID to search for
   * @param featureName - The feature name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cheerio API is dynamic and requires 'any'
  private static extractFeatureDescription($: any, anchorId: string, featureName: string): string {
    console.log(`Looking for element with id="${anchorId}"`);
    
    // Try to find any element with this ID
    const $target = $(`#${anchorId}`);
    
    if ($target.length === 0) {
      console.warn(`No element found with id="${anchorId}"`);
      return `<p><em>Description not found for ${featureName}</em></p>`;
    }
    
    const elementType = $target.prop('tagName')?.toLowerCase();
    console.log(`Found ${elementType} element for ${anchorId}`);
    
    // Special handling for "Monastic Traditions" (h2 section)
    if (anchorId === 'MonasticTraditions' || elementType === 'h2') {
      // This is a section header, get the introductory paragraph
      let $intro = $target.next();
      const descParts: string[] = [];
      
      // Collect the general description paragraphs before subclass listings
      while ($intro.length && $intro.prop('tagName')?.toLowerCase() === 'p') {
        const text = $intro.text().trim();
        // Stop if we hit a paragraph that starts listing specific traditions
        if (text.includes('@UUID') || text.includes('Way of')) {
          break;
        }
        descParts.push($.html($intro));
        $intro = $intro.next();
      }
      
      if (descParts.length === 0) {
        return `<p><em>See Monastic Traditions section for details</em></p>`;
      }
      
      return descParts.join('\n').trim();
    }
    
    // For h3/h4 elements, collect following content
    const descParts: string[] = [];
    let $current = $target.next();
    let elementCount = 0;
    
    while ($current.length && !/^h[1234]$/i.test($current.prop('tagName'))) {
      const tagName = $current.prop('tagName')?.toLowerCase();
      
      if (tagName && ['p', 'ul', 'ol', 'blockquote'].includes(tagName)) {
        // Skip empty paragraphs
        const text = $current.text().trim();
        if (text) {
          const htmlContent = $.html($current);
          descParts.push(htmlContent);
          elementCount++;
        }
      }
      
      $current = $current.next();
    }
    
    console.log(`Collected ${elementCount} elements for description`);
    const description = descParts.join('\n').replace(/\n{2,}/g, '\n').trim();
    
    if (!description) {
      console.warn(`No description content found for ${featureName}`);
      return `<p><em>No description available</em></p>`;
    }
    
    return description;
  }
  
  /**
   * Extract core traits from the HTML
   */
  public static extractCoreTraits(html: string): Record<string, string> {
    const $ = load(html);
    const traits: Record<string, string> = {};
    // Find Hit Points section
    const $hitPoints = $('#HitPoints-536');
    if ($hitPoints.length) {
      const $p = $hitPoints.next('p');
      if ($p.length) {
        const text = $p.html() || '';
        // Extract individual traits
        const traitReg = /<strong>.*?<span[^>]*>([^<]+)<\/span><\/strong>\s*([^<]+)/g;
        let match;
        while ((match = traitReg.exec(text)) !== null) {
          const key = match[1].replace(':', '').trim();
          const value = match[2].trim();
          if (key && value) {
            traits[key] = value;
          }
        }
      }
    }
    // Find Proficiencies section
    const $proficiencies = $('#Proficiencies-464');
    if ($proficiencies.length) {
      const $p = $proficiencies.next('p');
      if ($p.length) {
        const text = $p.html() || '';
        const lines = text.split('<br>');
        for (const line of lines) {
          const cleanLine = load(line).text();
          const profReg = /^([^:]+):\s*(.+)$/;
          const match = profReg.exec(cleanLine);
          if (match) {
            traits[match[1].trim()] = match[2].trim();
          }
        }
      }
    }
    // Extract from Quick Build if present
    const $quickBuild = $('blockquote:contains("QUICK BUILD")');
    if ($quickBuild.length) {
      const text = $quickBuild.text();
      const abilityReg = /make (\w+) your highest ability score(?:, followed by (\w+))?/i;
      const abilityMatch = abilityReg.exec(text);
      if (abilityMatch) {
        const abilities = [abilityMatch[1]];
        if (abilityMatch[2]) abilities.push(abilityMatch[2]);
        traits['Primary Ability'] = abilities.join(' and ');
      }
    }
    return traits;
  }

  /**
   * Parse class data from HTML (main entry point)
   */
  public static parseClassFromHtml(htmlInput: string): ProxyClassData {
    const html = this.extractHtmlContent(htmlInput);
    const $ = load(html);
    
    // Extract class name
    const $h1 = $('h1').first();
    let className = '';
    
    // Get only the text content, not the badges
    $h1.contents().each((i, el) => {
      if (el.type === 'text') {
        const text = $(el).text().trim();
        if (text && !text.includes('Class Details')) {
          className = text;
          return false; // break
        }
      }
    });
    
    // Parse features with deduplication
    const features = this.parseFeaturesFromHtml(htmlInput);
    
    // Extract core traits
    const coreTraits = this.extractCoreTraits(html);
    
    // Extract progression table
    const progression = this.extractProgression($, html);
    
    // Extract subclasses
    const subclasses = this.extractSubclasses($, html);
    
    return {
      name: className || 'Unknown Class',
      features,
      coreTraits,
      progression,
      subclasses,
      tags: [],
      prerequisites: [],
      source: 'D&D Beyond'
    };
  }
  
  /**
   * Extract progression from the class table
   *
   * @param $ - Cheerio static instance (dynamic, requires 'any' due to cheerio API)
   * @param html - The HTML string
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cheerio API is dynamic and requires 'any'
  private static extractProgression($: any, _html: string): Array<{ level: number; features: string[]; columns: string[] }> {
    const progression: Array<{ level: number; features: string[]; columns: string[] }> = [];
    
    $('table').first().find('tbody tr').each((i: number, row: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cheerio API is dynamic and requires 'any'
      const cells = $(row).find('td').map((j: number, cell: any) => $(cell).text().trim()).get();
      
      if (cells.length >= 2) {
        const levelMatch = cells[0].match(/(\d+)/);
        if (levelMatch) {
          const level = parseInt(levelMatch[1]);
          
          // Extract feature names from links in the last cell
          const $lastCell = $(row).find('td').last();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cheerio API is dynamic and requires 'any'
          const features = $lastCell.find('a').map((k: number, a: any) => $(a).text().trim()).get();
          
          // Extract middle columns (excluding level and features)
          const columns = cells.slice(1, -1);
          
          progression.push({ level, features, columns });
        }
      }
    });
    
    return progression;
  }
  
  /**
   * Extract subclasses from the HTML
   *
   * @param $ - Cheerio static instance (dynamic, requires 'any' due to cheerio API)
   * @param html - The HTML string
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cheerio API is dynamic and requires 'any'
  private static extractSubclasses($: any, _html: string): Array<{ name: string; description: string }> {
    const subclasses: Array<{ name: string; description: string }> = [];
    
    // Find the Monastic Traditions section
    const $section = $('#MonasticTraditions');
    if ($section.length) {
      // Look for subclass containers after this section
      const $container = $section.nextAll('.subitems-list-details').first();
      if ($container.length) {
        $container.find('.subitems-list-details-item').each((i: number, item: any) => {
          // 'item' is Cheerio element, requires 'any' due to Cheerio API
          const $item = $(item);
          const $title = $item.find('h2').first();
          // 'el' is Cheerio element, requires 'any' due to Cheerio API
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cheerio callback parameter is dynamic
          const name = $title.contents().filter((j: number, el: any) => el.type === 'text').text().trim();
          if (name && !name.includes('Monastic Traditions')) {
            // Collect description paragraphs
            const descParts: string[] = [];
            $item.find('p').slice(0, 2).each((j: number, p: any) => {
              // 'p' is Cheerio element, requires 'any' due to Cheerio API
              descParts.push($.html(p));
            });
            subclasses.push({
              name,
              description: descParts.join('\n')
            });
          }
        });
      }
    }
    
    return subclasses;
  }
  
  /**
   * Main parse method for D&D Beyond class data
   */
  public static parseClass(
    ddbClass: DDBClass,
    proxyData?: { data?: ProxyClassData } | string
  ): Record<string, unknown> {
    if (!ddbClass?.definition) {
      throw new Error('Invalid DDBClass input');
    }
    
    let proxy: ProxyClassData;
    
    // Handle different input types
    if (typeof proxyData === 'string') {
      // If it's a string, parse it as HTML
      proxy = this.parseClassFromHtml(proxyData);
    } else if (proxyData?.data) {
      // If it's already parsed proxy data
      proxy = proxyData.data;
    } else {
      // Empty proxy data
      proxy = {};
    }
    
    // Build the class name
    const name = proxy.name || ddbClass.definition.name;
    
    // Get description from first feature or class features
    const description = proxy.features?.find(f => 
      f.name.toLowerCase().includes('class features')
    )?.description || proxy.features?.[0]?.description || '';

    // Process core traits
    const coreTraits = proxy.coreTraits || {};
    const hitDieReg = /(\d+)d(\d+)/;
    const hitDieMatch = hitDieReg.exec(coreTraits['Hit Dice'] ?? '');
    const hitDie = hitDieMatch ? `d${hitDieMatch[2]}` : 'd8';

    // Build advancements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Advancement structure is dynamic and depends on FoundryVTT
    const advancement: any[] = [];

    // Saving throws
    if (coreTraits['Saving Throws']) {
      const saves = coreTraits['Saving Throws']
        .split(/,\s*/)
        .map(s => s.trim())
        .map(s => `saves:${s.toLowerCase().substring(0, 3)}`);

      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: { grants: saves },
        value: { chosen: saves }
      });
    }

    // Skills
    if (coreTraits['Skills']) {
      const skillsText = coreTraits['Skills'];
      const countReg = /Choose (\w+)/i;
      const countMatch = countReg.exec(skillsText);
      let count = 2;
      if (countMatch) {
        if (countMatch[1].toLowerCase() !== 'two') {
          count = parseInt(countMatch[1], 10);
        }
      }
      const skillsListReg = /from (.+)$/i;
      const skillsListMatch = skillsListReg.exec(skillsText);
      const skillsList = skillsListMatch ? skillsListMatch[1] : '';
      const skills = skillsList
        .split(/,\s*and\s*|,\s*/)
        .map(s => s.trim())
        .filter(s => s)
        .map(s => `skills:${s.toLowerCase().substring(0, 3)}`);

      if (skills.length > 0) {
        advancement.push({
          type: 'Trait',
          level: 1,
          configuration: {
            choices: [{
              count,
              pool: skills
            }]
          },
          value: { chosen: [] }
        });
      }
    }
    
    // Process primary ability
    const primaryAbility = coreTraits['Primary Ability']?.split(/\s+and\s+/i)
      .map(s => s.trim().toLowerCase().substring(0, 3)) || [];
    
    // Build the final class object
    return {
      type: 'class',
      name,
      img: '',
      system: {
        description: { value: description },
        source: proxy.source || 'D&D Beyond',
        hd: {
          denomination: hitDie,
          additional: '',
          spent: 0
        },
        levels: ddbClass.level || 1,
        primaryAbility: {
          value: primaryAbility,
          all: true
        },
        properties: proxy.tags || [],
        prerequisites: proxy.prerequisites || [],
        advancement,
        spellcasting: {
          progression: 'none',
          ability: '',
          spellLists: proxy.spellLists || []
        },
        features: proxy.features || [],
        subclass: {
          name: proxy.subclasses?.[0]?.name || '',
          features: []
        },
        progression: proxy.progression || [],
        coreTraits,
        sidebars: proxy.sidebars || []
      },
      flags: {
        'beyond-foundry': {
          originalDDB: ddbClass,
          proxyData: proxy
        }
      }
    };
  }
}