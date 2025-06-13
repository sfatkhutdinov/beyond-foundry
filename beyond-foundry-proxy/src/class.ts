import { Router, Request, Response, NextFunction } from 'express';
import * as winston from 'winston';
import Ajv from 'ajv';
import fetch from 'node-fetch';
import CONFIG from './config';
import * as authentication from './auth';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { ClassData } from './types';
import classDataSchema from './classData.schema.json';
import path from 'path';
// import puppeteer from 'puppeteer'; // Removed - DnDBeyond blocks headless browsers

const router: Router = Router();
const ajv = new Ajv({ allErrors: true });
const validateClassData = ajv.compile(classDataSchema);

interface ClassDataRequestBody {
  cobalt: string;
}

type ProgressionRow = { level: number; columns: string[] };

interface Feature {
  name: string;
  description: string;
  requiredLevel: number;
}

interface SubclassFeature {
  name: string;
  description: string;
  requiredLevel?: number;
}

interface Subclass {
  name: string;
  overview: string;
  features: SubclassFeature[];
  tables?: Array<{ title: string; headers: string[]; rows: string[][] }>;
}

interface Sidebar {
  title: string;
  content: string;
}

type ProxyClassData = {
  id: number;
  slug: string;
  name: string;
  description: string;
  source: string;
  tags: string[];
  prerequisites: string[];
  coreTraits: Record<string, string>;
  progression: ProgressionRow[];
  features: Feature[];
  subclasses: Subclass[];
  spellcasting: {
    progression: string;
    ability: string;
    lists: Array<{ label: string; url: string }>;
  };
  sidebars: string[];
  additionalTables?: Array<{ title: string; headers: string[]; rows: string[][] }>;
  optionalFeatures: any[];
  schemaVersion?: string;
  advancement: any[];
  equipmentChoices: string[][];
};

/* *********************************** */
/*  Main Data Fetch & Extraction      */
/* *********************************** */

// Map slug to numeric class ID
function getClassIdFromSlug(slug: string): number | null {
  const clean = slug.replace(/^\d+-?/, '').toLowerCase();
  const entry = CONFIG.classMap.find(
    e => e.name.toLowerCase() === clean || `${e.id}-${clean}` === slug.toLowerCase()
  );
  return entry?.id ?? null;
}

// Entry point
async function getClassData(
  classID: number,
  className: string,
  cobalt: string
): Promise<ClassData> {
  // Use classID and className for all lookups and API calls
  // Get bearer token first
  const token = await authentication.getBearerToken(classID.toString(), cobalt);
  if (!token) {
    throw new Error('Failed to get bearer token');
  }

  // Try to fetch class data directly from D&D Beyond's internal API first
  console.log('Attempting to fetch class data from D&D Beyond API...');
  let apiData: any = null;
  let apiResult: ProxyClassData | null = null;
  try {
    // Try the unofficial class API endpoint
    const classApiUrl = `https://www.dndbeyond.com/proxy/classes/${classID}`;
    console.log(`Trying API endpoint: ${classApiUrl}`);
    const apiResponse = await fetch(classApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://www.dndbeyond.com',
        Cookie: `CobaltSession=${cobalt}`,
      },
    });
    if (apiResponse.ok) {
      apiData = await apiResponse.json();
      const apiCoreTraits = extractCoreTraitsFromAPI(apiData);
      apiResult = {
        id: classID,
        slug: `${classID}-${className}`,
        name: apiData.name || apiData.definition?.name || 'Unknown Class',
        description: apiData.description || apiData.definition?.description || '',
        source: apiData.source || '',
        tags: apiData.tags || [],
        prerequisites: apiData.prerequisites || [],
        coreTraits: apiCoreTraits,
        progression: extractProgressionFromAPI(apiData),
        features: extractFeaturesFromAPI(apiData),
        subclasses: extractSubclassesFromAPI(apiData),
        spellcasting: extractSpellcastingFromAPI(apiData),
        sidebars: [],
        additionalTables: [],
        optionalFeatures: [],
        schemaVersion: '2025-06-11',
        advancement: extractAdvancement(apiCoreTraits),
        equipmentChoices: extractEquipmentChoices(apiCoreTraits),
      };
    }
  } catch (apiError) {
    console.log('API approach failed:', apiError.message, 'falling back to HTML');
  }

  // If API is missing critical fields, fetch and parse HTML for fallback/merge
  let htmlResult: Partial<ProxyClassData> = {};
  let needHtml = false;
  if (
    !apiResult ||
    !apiResult.progression?.length ||
    !apiResult.features?.length ||
    !apiResult.subclasses?.length ||
    !apiResult.sidebars?.length ||
    !apiResult.tags?.length ||
    !apiResult.prerequisites?.length ||
    !Object.keys(apiResult.coreTraits || {}).length
  ) {
    needHtml = true;
  }

  if (needHtml) {
    // Fetch the class HTML page
    const htmlUrl = `https://www.dndbeyond.com/classes/${className}`;
    const htmlResponse = await fetch(htmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Cookie: `CobaltSession=${cobalt}`,
      },
    });
    const html = await htmlResponse.text();
    const $ = cheerio.load(html);
    const htmlCoreTraits = extractCoreTraits($);
    const htmlFeatures = extractFeatures($);
    htmlResult = {
      name: extractName($),
      description: extractDescription($),
      source: extractMetadata($).source,
      tags: extractMetadata($).tags,
      prerequisites: extractMetadata($).prerequisites,
      coreTraits: htmlCoreTraits,
      progression: extractProgressionTable($),
      features: htmlFeatures,
      subclasses: extractSubclasses($),
      spellcasting: extractSpellcasting($, htmlFeatures, htmlCoreTraits),
      sidebars: extractSidebars($),
      additionalTables: extractAdditionalTables($),
      optionalFeatures: [],
      schemaVersion: '2025-06-11',
      advancement: extractAdvancement(htmlCoreTraits),
      equipmentChoices: extractEquipmentChoices(htmlCoreTraits),
    };
  }

  // Merge API and HTML results, preferring API where present, but do a field-by-field merge for completeness
  function isEmpty(val: any) {
    if (val == null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
  }

  function mergeSpellcasting(apiSpell: any, htmlSpell: any) {
    return {
      progression: !isEmpty(apiSpell?.progression)
        ? apiSpell.progression
        : htmlSpell?.progression || '',
      ability: !isEmpty(apiSpell?.ability) ? apiSpell.ability : htmlSpell?.ability || '',
      lists: !isEmpty(apiSpell?.lists) ? apiSpell.lists : htmlSpell?.lists || [],
    };
  }

  const merged: ProxyClassData = {
    id: classID,
    slug: `${classID}-${className}`,
    name: !isEmpty(apiResult?.name) ? apiResult?.name : htmlResult.name || 'Unknown Class',
    description: !isEmpty(apiResult?.description)
      ? apiResult?.description
      : htmlResult.description || '',
    source: !isEmpty(apiResult?.source)
      ? apiResult?.source
      : htmlResult.source || "Player's Handbook",
    tags: !isEmpty(apiResult?.tags) ? apiResult.tags : htmlResult.tags || [],
    prerequisites: !isEmpty(apiResult?.prerequisites)
      ? apiResult.prerequisites
      : htmlResult.prerequisites || [],
    coreTraits: !isEmpty(apiResult?.coreTraits)
      ? apiResult.coreTraits
      : htmlResult.coreTraits || {},
    progression: !isEmpty(apiResult?.progression)
      ? apiResult.progression
      : htmlResult.progression || [],
    features: !isEmpty(apiResult?.features) ? apiResult.features : htmlResult.features || [],
    subclasses: !isEmpty(apiResult?.subclasses)
      ? apiResult.subclasses
      : htmlResult.subclasses || [],
    spellcasting: mergeSpellcasting(apiResult?.spellcasting, htmlResult.spellcasting),
    sidebars: !isEmpty(apiResult?.sidebars) ? apiResult.sidebars : htmlResult.sidebars || [],
    additionalTables: !isEmpty(apiResult?.additionalTables)
      ? apiResult.additionalTables
      : htmlResult.additionalTables || [],
    optionalFeatures: !isEmpty(apiResult?.optionalFeatures)
      ? apiResult.optionalFeatures
      : htmlResult.optionalFeatures || [],
    schemaVersion: '2025-06-11',
    advancement: !isEmpty(apiResult?.advancement)
      ? apiResult.advancement
      : htmlResult.advancement || [],
    equipmentChoices: !isEmpty(apiResult?.equipmentChoices)
      ? apiResult.equipmentChoices
      : htmlResult.equipmentChoices || [],
  };

  if (!validateClassData(merged)) {
    winston.error('Validation errors', validateClassData.errors);
    throw new Error('Schema validation failed');
  }

  // Enhanced advancement extraction
  merged.advancement = extractAdvancementV1(merged.coreTraits, merged.subclasses);
  // Enhanced equipment extraction
  merged.equipmentChoices = extractEquipmentChoices(merged.coreTraits);
  // Write versioned output for testing
  try {
    const outPath = path.join(__dirname, '../zzzOutputzzz/proxy_rogue_v1.json');
    fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
  } catch (e) {
    console.error('Failed to write versioned output:', e);
  }

  return deepSanitize(merged) as unknown as ClassData;
}

/* *********************************** */
/*  API Data Extractors               */
/* *********************************** */

/**
 * Normalize core trait keys to match dnd5e schema
 * @param traits - Raw traits object
 * @returns Normalized traits object
 */
function normalizeCoreTraitKeys(traits: Record<string, string>): Record<string, string> {
  const keyMap: Record<string, string> = {
    // HTML/API variants to canonical dnd5e keys
    'hit point die': 'Hit Die',
    'Hit Point Die': 'Hit Die',
    'Hit Die': 'Hit Die',
    'Primary Ability': 'Primary Ability',
    'Saving Throws': 'Saving Throws',
    'Saving Throws proficiencies': 'Saving Throws',
    'Saving Throw Proficiencies': 'Saving Throws',
    'Skill Proficiencies': 'Skill Proficiencies',
    'Weapon Proficiencies': 'Weapon Proficiencies',
    'Tool Proficiencies': 'Tool Proficiencies',
    'armor training': 'Armor Training',
    'Armor Training': 'Armor Training',
    'Armor Proficiencies': 'Armor Training',
    'starting equipment': 'Starting Equipment',
    'Starting Equipment': 'Starting Equipment',
  };
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(traits)) {
    const normKey = keyMap[key.trim()] || key.trim();
    normalized[normKey] = value;
  }
  return normalized;
}

// Refactored API core trait extraction with normalization
function extractCoreTraitsFromAPI(apiData: any): Record<string, string> {
  const traits: Record<string, string> = {};
  if (apiData.hitDie) {
    traits['Hit Die'] = `D${apiData.hitDie} per ${apiData.name || 'class'} level`;
  }
  if (apiData.primaryAbility) {
    traits['Primary Ability'] = Array.isArray(apiData.primaryAbility)
      ? apiData.primaryAbility.join(' or ')
      : apiData.primaryAbility;
  }
  if (apiData.savingThrowProficiencies) {
    traits['Saving Throws'] = Array.isArray(apiData.savingThrowProficiencies)
      ? apiData.savingThrowProficiencies.join(' and ')
      : apiData.savingThrowProficiencies;
  }
  if (apiData.armorProficiencies) {
    traits['Armor Training'] = Array.isArray(apiData.armorProficiencies)
      ? apiData.armorProficiencies.join(', ')
      : apiData.armorProficiencies;
  }
  if (apiData.weaponProficiencies) {
    traits['Weapon Proficiencies'] = Array.isArray(apiData.weaponProficiencies)
      ? apiData.weaponProficiencies.join(', ')
      : apiData.weaponProficiencies;
  }
  if (apiData.toolProficiencies) {
    traits['Tool Proficiencies'] = Array.isArray(apiData.toolProficiencies)
      ? apiData.toolProficiencies.join(', ')
      : apiData.toolProficiencies;
  }
  if (apiData.skillProficiencies) {
    traits['Skill Proficiencies'] = Array.isArray(apiData.skillProficiencies)
      ? apiData.skillProficiencies.join(', ')
      : apiData.skillProficiencies;
  }
  if (apiData.startingEquipment) {
    traits['Starting Equipment'] = apiData.startingEquipment;
  }
  return normalizeCoreTraitKeys(traits);
}

function extractProgressionFromAPI(apiData: any): ProgressionRow[] {
  // Extract progression table from API response
  if (apiData.classFeatures && Array.isArray(apiData.classFeatures)) {
    const progressionMap = new Map<number, string[]>();

    apiData.classFeatures.forEach((feature: any) => {
      const level = feature.requiredLevel || 1;
      if (!progressionMap.has(level)) {
        progressionMap.set(level, [level.toString()]);
      }
      progressionMap.get(level)?.push(feature.name || '');
    });

    return Array.from(progressionMap.entries()).map(([level, columns]) => ({
      level,
      columns,
    }));
  }

  return [];
}

function extractFeaturesFromAPI(apiData: any): Feature[] {
  // Extract features from API response
  if (apiData.classFeatures && Array.isArray(apiData.classFeatures)) {
    return apiData.classFeatures.map((feature: any) => ({
      name: feature.name || '',
      description: feature.description || feature.snippet || '',
      requiredLevel: feature.requiredLevel || 1,
    }));
  }

  return [];
}

function extractSubclassesFromAPI(apiData: any): Subclass[] {
  // Extract subclasses from API response
  if (apiData.subclasses && Array.isArray(apiData.subclasses)) {
    return apiData.subclasses.map((subclass: any) => ({
      name: subclass.name || '',
      overview: subclass.description || subclass.snippet || '',
      features: subclass.features
        ? subclass.features.map((f: any) => ({
            name: f.name || '',
            description: f.description || f.snippet || '',
            requiredLevel: f.requiredLevel || 1,
          }))
        : [],
    }));
  }

  return [];
}

function extractSpellcastingFromAPI(apiData: any): {
  progression: string;
  ability: string;
  lists: Array<{ label: string; url: string }>;
} {
  // Extract spellcasting info from API response
  const result = {
    progression: '',
    ability: '',
    lists: [] as Array<{ label: string; url: string }>,
  };

  if (apiData.spellcasting) {
    result.progression = apiData.spellcasting.progression || '';
    result.ability = apiData.spellcasting.ability || '';
    if (apiData.spellcasting.lists) {
      result.lists = apiData.spellcasting.lists;
    }
  }

  return result;
}

function getBasicCoreTraits(className: string): Record<string, string> {
  // Return basic core traits based on class name
  const traits: Record<string, string> = {};

  switch (className.toLowerCase()) {
    case 'fighter':
      traits['Hit Die'] = 'd10';
      traits['Primary Ability'] = 'Strength or Dexterity';
      traits['Saving Throws'] = 'Strength, Constitution';
      traits['Armor'] = 'All armor, shields';
      traits['Weapons'] = 'Simple weapons, martial weapons';
      break;
    case 'wizard':
      traits['Hit Die'] = 'd6';
      traits['Primary Ability'] = 'Intelligence';
      traits['Saving Throws'] = 'Intelligence, Wisdom';
      traits['Armor'] = 'None';
      traits['Weapons'] = 'Daggers, darts, slings, quarterstaffs, light crossbows';
      break;
    case 'rogue':
      traits['Hit Die'] = 'd8';
      traits['Primary Ability'] = 'Dexterity';
      traits['Saving Throws'] = 'Dexterity, Intelligence';
      traits['Armor'] = 'Light armor';
      traits['Weapons'] = 'Simple weapons, hand crossbows, longswords, rapiers, shortswords';
      break;
    case 'paladin':
      traits['Hit Die'] = 'd10';
      traits['Primary Ability'] = 'Strength and Charisma';
      traits['Saving Throws'] = 'Wisdom, Charisma';
      traits['Armor'] = 'All armor, shields';
      traits['Weapons'] = 'Simple weapons, martial weapons';
      break;
    case 'cleric':
      traits['Hit Die'] = 'd8';
      traits['Primary Ability'] = 'Wisdom';
      traits['Saving Throws'] = 'Wisdom, Charisma';
      traits['Armor'] = 'Light armor, medium armor, shields';
      traits['Weapons'] = 'Simple weapons';
      break;
    // Add more classes as needed
    default:
      traits['Hit Die'] = 'd8';
      traits['Primary Ability'] = 'Varies';
      traits['Saving Throws'] = 'Varies';
  }

  return traits;
}

function getSpellcastingAbility(className: string): string {
  switch (className.toLowerCase()) {
    case 'wizard':
    case 'artificer':
      return 'intelligence';
    case 'cleric':
    case 'druid':
    case 'ranger':
      return 'wisdom';
    case 'bard':
    case 'paladin':
    case 'sorcerer':
    case 'warlock':
      return 'charisma';
    default:
      return '';
  }
}

/* *********************************** */
/*  HTML Extractors (Fixed)           */
/* *********************************** */

function sanitize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractName($: cheerio.Root): string {
  return $('h1#RogueClassDetails').text().trim().replace('Class Details', '').trim();
}

/**
 * Extract description paragraphs between Core Traits table and "Becoming a" section
 */
function extractDescription($: cheerio.Root): string {
  const paragraphs: string[] = [];

  // Find the Core Traits table
  const $coreTraitsTable = $('table')
    .filter((_, el) => {
      return (
        $(el).find('h2#CoreRogueTraits').length > 0 ||
        ($(el).find('h2').text().includes('Core') && $(el).find('h2').text().includes('Traits'))
      );
    })
    .first();

  if (!$coreTraitsTable.length) return '';

  // Start from the element after the table
  let $current = $coreTraitsTable.next();

  // Collect paragraphs until we hit a heading
  while ($current.length && !$current.is('h2, h3, h4')) {
    if ($current.is('p')) {
      const text = $current.text().trim();
      // Skip if this looks like it's part of features
      if (text && !text.includes('you gain the following class features')) {
        paragraphs.push(text);
      }
    }
    $current = $current.next();
  }

  return paragraphs.join('\n\n');
}

function extractMetadata($: cheerio.Root): {
  source: string;
  tags: string[];
  prerequisites: string[];
} {
  return {
    source: "Player's Handbook",
    tags: [],
    prerequisites: [],
  };
}

/**
 * Extract and normalize core traits with better key mapping
 */
function extractCoreTraits($: cheerio.Root): Record<string, string> {
  const traits: Record<string, string> = {};

  // Find the Core Traits table
  const $table = $('table')
    .filter((_, el) => {
      const $h2 = $(el).find('h2');
      return $h2.text().includes('Core') && $h2.text().includes('Traits');
    })
    .first();

  if (!$table.length) return traits;

  // Extract each row
  $table.find('tbody tr').each((_, row) => {
    const $row = $(row);
    const key = $row.find('th').text().trim();
    const value = $row.find('td').text().trim();

    if (key && value) {
      // Store with original key
      traits[key] = value;
    }
  });

  return normalizeCoreTraitKeys(traits);
}

/**
 * Extract progression table with better structure
 */
function extractProgressionTable($: cheerio.Root): ProgressionRow[] {
  const progression: ProgressionRow[] = [];

  // Find the Rogue Features table (or any class features table)
  const $table = $('table')
    .filter((_, el) => {
      const $h2 = $(el).find('h2');
      return $h2.text().includes('Features') && !$h2.text().includes('Core');
    })
    .first();

  if (!$table.length) return progression;

  // Process each row in tbody
  $table.find('tbody tr').each((_, row) => {
    const $row = $(row);
    const cells = $row
      .find('td')
      .map((_, td) => $(td).text().trim())
      .get();

    if (cells.length >= 4) {
      const level = parseInt(cells[0], 10);
      if (!isNaN(level)) {
        progression.push({
          level,
          columns: cells,
        });
      }
    }
  });

  return progression;
}

/**
 * Extract main class features, excluding subclass features
 */
function extractFeatures($: cheerio.Root): Feature[] {
  const features: Feature[] = [];

  // Find the main content container
  const $mainContainer = $('.static-container-details > .content-container').first();

  // Find all h4 elements that are NOT within subclass containers
  $mainContainer.find('h4').each((_, el) => {
    const $el = $(el);

    // Skip if this h4 is within a subclass container
    if ($el.closest('.subitems-list-details-item').length > 0) {
      return; // Skip subclass features
    }

    // Skip sidebar headers
    if (
      $el.attr('id')?.includes('AsaLevel1Character') ||
      $el.attr('id')?.includes('AsaMulticlassCharacter')
    ) {
      return;
    }

    const headingText = $el.text().trim();

    // Parse level from heading (e.g., 'Level 3: Steady Aim')
    let requiredLevel = 1;
    const levelMatch = headingText.match(/Level\s*(\d+):?\s*/i);
    if (levelMatch) {
      requiredLevel = parseInt(levelMatch[1], 10);
    }

    // Feature name is heading text after 'Level X:'
    let name = headingText.replace(/Level\s*\d+:?\s*/i, '').trim();
    if (!name) name = headingText;

    // Gather description from following elements
    const descriptionParts: string[] = [];
    let $next = $el.next();

    while ($next.length && !$next.is('h2, h3, h4')) {
      if ($next.is('p')) {
        const text = $next.text().trim();
        if (text) descriptionParts.push(text);
      } else if ($next.is('ul, ol')) {
        // Format list items
        const items = $next
          .find('li')
          .map((_, li) => '• ' + $(li).text().trim())
          .get();
        if (items.length) descriptionParts.push(items.join('\n'));
      }
      $next = $next.next();
    }

    const description = descriptionParts.join('\n\n');

    if (name && description) {
      features.push({ name, description, requiredLevel });
    }
  });

  return features;
}

/**
 * Extract subclasses with proper scoping
 */
function extractSubclasses($: cheerio.Root): Subclass[] {
  const subclasses: Subclass[] = [];

  // Each subclass is in a .subitems-list-details-item
  $('.subitems-list-details-item').each((_, item) => {
    const $item = $(item);

    // Get subclass name from h2
    const name = $item.find('h2').first().text().trim();

    // Get overview from first paragraph after h2
    let overview = '';
    const $h2 = $item.find('h2').first();
    let $overviewEl = $h2.next();
    while ($overviewEl.length && $overviewEl.is('p')) {
      const text = $overviewEl.text().trim();
      if (text) {
        overview = text;
        break;
      }
      $overviewEl = $overviewEl.next();
    }

    // Extract features ONLY from this subclass
    const features: SubclassFeature[] = [];

    $item.find('h4').each((_, el) => {
      const $el = $(el);
      const headingText = $el.text().trim();

      // Parse level if present
      let requiredLevel: number | undefined = undefined;
      const levelMatch = headingText.match(/Level\s*(\d+):?\s*/i);
      if (levelMatch) {
        requiredLevel = parseInt(levelMatch[1], 10);
      }

      // Get feature name
      let featureName = headingText.replace(/Level\s*\d+:?\s*/i, '').trim();
      if (!featureName) featureName = headingText;

      // Get description
      const descriptionParts: string[] = [];
      let $next = $el.next();

      while (
        $next.length &&
        !$next.is('h4, h3, h2') &&
        $next.closest('.subitems-list-details-item')[0] === item
      ) {
        if ($next.is('p')) {
          const text = $next.text().trim();
          if (text) descriptionParts.push(text);
        } else if ($next.is('ul, ol')) {
          const items = $next
            .find('li')
            .map((_, li) => '• ' + $(li).text().trim())
            .get();
          if (items.length) descriptionParts.push(items.join('\n'));
        } else if ($next.is('table')) {
          // Skip tables here, they'll be handled separately
          $next = $next.next();
          continue;
        } else if ($next.is('div.spell-components')) {
          // Handle spell component divs (like for Psychic Blades)
          const componentText = $next.text().trim();
          if (componentText) descriptionParts.push(componentText);
        }
        $next = $next.next();
      }

      const description = descriptionParts.join('\n\n');

      if (featureName && description) {
        features.push({ name: featureName, description, requiredLevel });
      }
    });

    // Extract tables specific to this subclass
    const tables: Array<{ title: string; headers: string[]; rows: string[][] }> = [];

    $item.find('table').each((_, table) => {
      const $table = $(table);
      const caption = $table.find('caption').text().trim();

      if (!caption) return;

      const headers: string[] = [];
      const rows: string[][] = [];

      // Get headers from thead
      const $headerRow = $table.find('thead tr').last();
      if ($headerRow.length) {
        $headerRow.find('th').each((_, th) => {
          headers.push($(th).text().trim());
        });
      }

      // If no headers in thead, check first tbody row
      if (headers.length === 0) {
        const $firstRow = $table.find('tbody tr').first();
        if ($firstRow.find('th').length > 0) {
          $firstRow.find('th, td').each((_, cell) => {
            headers.push($(cell).text().trim());
          });
        }
      }

      // Get data rows
      $table.find('tbody tr').each((idx, row) => {
        const $row = $(row);
        // Skip first row if it was used for headers
        if (idx === 0 && $row.find('th').length > 0 && headers.length > 0) {
          return;
        }

        const cells = $row
          .find('td, th')
          .map((_, cell) => $(cell).text().trim())
          .get();
        if (cells.length > 0) {
          rows.push(cells);
        }
      });

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ title: caption, headers, rows });
      }
    });

    if (name) {
      subclasses.push({ name, overview, features, tables });
    }
  });

  return subclasses;
}

/**
 * Extract spellcasting information with better detection
 */
function extractSpellcasting(
  $: cheerio.Root,
  features?: Feature[],
  coreTraits?: Record<string, string>
): { progression: string; ability: string; lists: Array<{ label: string; url: string }> } {
  const spellcasting = {
    progression: '',
    ability: '',
    lists: [] as Array<{ label: string; url: string }>,
  };

  // First check if there's a spellcasting table in any subclass
  let foundSpellcastingTable = false;

  $('.subitems-list-details-item table').each((_, table) => {
    const $table = $(table);
    const caption = $table.find('caption').text().trim();

    if (/spellcasting/i.test(caption)) {
      foundSpellcastingTable = true;
      spellcasting.progression = caption;

      // Determine spellcasting details based on subclass
      const $subclass = $table.closest('.subitems-list-details-item');
      const subclassName = $subclass.find('h2').first().text().trim();

      if (/arcane trickster/i.test(subclassName)) {
        spellcasting.ability = 'Intelligence';
        spellcasting.lists = [{ label: 'Wizard', url: '/spells/wizard' }];
      }
      // Add other spellcasting subclasses as needed

      return false; // Break the loop
    }
  });

  // If no table found, check features for spellcasting info
  if (!foundSpellcastingTable && features) {
    // Look in both main features and subclass features
    $('.subitems-list-details-item').each((_, item) => {
      const $item = $(item);
      const $spellcastingFeature = $item
        .find('h4')
        .filter((_, el) => /spellcasting/i.test($(el).text()))
        .first();

      if ($spellcastingFeature.length) {
        // Get the description text
        let description = '';
        let $next = $spellcastingFeature.next();
        while ($next.length && !$next.is('h4, h3, h2')) {
          if ($next.is('p')) {
            description += ' ' + $next.text();
          }
          $next = $next.next();
        }

        // Parse ability from description
        if (/intelligence\s+is\s+your\s+spellcasting\s+ability/i.test(description)) {
          spellcasting.ability = 'Intelligence';
        } else if (/wisdom\s+is\s+your\s+spellcasting\s+ability/i.test(description)) {
          spellcasting.ability = 'Wisdom';
        } else if (/charisma\s+is\s+your\s+spellcasting\s+ability/i.test(description)) {
          spellcasting.ability = 'Charisma';
        }

        // Parse spell list
        if (/wizard\s+spell/i.test(description)) {
          spellcasting.lists.push({ label: 'Wizard', url: '/spells/wizard' });
        }

        // Set progression
        const subclassName = $item.find('h2').first().text().trim();
        spellcasting.progression = `${subclassName} Spellcasting`;

        return false; // Found it, stop looking
      }
    });
  }

  return spellcasting;
}

/**
 * Extract sidebars with better formatting
 */
function extractSidebars($: cheerio.Root): string[] {
  const sidebars: string[] = [];

  // Extract "Becoming a Rogue" section
  const $becomingSection = $('h3')
    .filter((_, el) => {
      return $(el).text().includes('Becoming a');
    })
    .first();

  if ($becomingSection.length) {
    const sidebarParts: string[] = ['## ' + $becomingSection.text().trim()];

    let $current = $becomingSection.next();
    while ($current.length && !$current.is('h2, table')) {
      if ($current.is('h4')) {
        sidebarParts.push('\n### ' + $current.text().trim());
      } else if ($current.is('ul')) {
        const items = $current
          .find('li')
          .map((_, li) => '- ' + $(li).text().trim())
          .get();
        if (items.length) sidebarParts.push(items.join('\n'));
      } else if ($current.is('p')) {
        const text = $current.text().trim();
        if (text) sidebarParts.push(text);
      }
      $current = $current.next();
    }

    if (sidebarParts.length > 1) {
      sidebars.push(sidebarParts.join('\n'));
    }
  }

  return sidebars;
}

/**
 * Extract additional tables, excluding those already captured
 */
function extractAdditionalTables(
  $: cheerio.Root
): Array<{ title: string; headers: string[]; rows: string[][] }> {
  const tables: Array<{ title: string; headers: string[]; rows: string[][] }> = [];
  const processedCaptions = new Set(['Core Rogue Traits', 'Rogue Features']);

  // Find tables in main content, not in subclasses
  const $mainContainer = $('.static-container-details > .content-container').first();

  $mainContainer.find('> table, > * > table').each((_, table) => {
    const $table = $(table);

    // Skip if within a subclass
    if ($table.closest('.subitems-list-details-item').length > 0) {
      return;
    }

    const caption = $table.find('caption').text().trim();

    // Skip if already processed or no caption
    if (!caption || processedCaptions.has(caption)) {
      return;
    }

    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers
    const $headerRow = $table.find('thead tr').last();
    if ($headerRow.length) {
      $headerRow.find('th').each((_, th) => {
        headers.push($(th).text().trim());
      });
    }

    // Extract rows
    $table.find('tbody tr').each((_, row) => {
      const cells = $(row)
        .find('td, th')
        .map((_, cell) => $(cell).text().trim())
        .get();
      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    if (caption && (headers.length > 0 || rows.length > 0)) {
      tables.push({ title: caption, headers, rows });
    }
  });

  return tables;
}

/* *********************************** */
/*  Sanitization & Validation         */
/* *********************************** */

function deepSanitize<T>(obj: T): T {
  if (typeof obj === 'string') return sanitize(obj) as any;
  if (Array.isArray(obj)) return obj.map(deepSanitize) as any;
  if (typeof obj === 'object' && obj !== null) {
    const out: any = {};
    for (const k in obj) out[k] = deepSanitize((obj as any)[k]);
    return out;
  }
  return obj;
}

/* *********************************** */
/*  Express Route                     */
/* *********************************** */

const validateRequest = ajv.compile({
  type: 'object',
  properties: { cobalt: { type: 'string' } },
  additionalProperties: false,
  required: ['cobalt'],
});

router.post('/:classKey', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cobalt } = req.body as ClassDataRequestBody;
    const { classKey } = req.params;
    // classKey is expected to be {classID}-{class_name}
    const match = classKey.match(/^(\d+)-([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return res
        .status(400)
        .json({ error: 'Invalid classKey format. Expected {classID}-{class_name}' });
    }
    const classID = parseInt(match[1], 10);
    const className = match[2];
    if (!cobalt) {
      return res.status(401).json({ error: 'No cobalt cookie provided' });
    }
    // Use classID and className for downstream logic
    const data = await getClassDataByIdAndName(classID, className, cobalt);
    res.json(data);
  } catch (error) {
    console.error('Error in class endpoint:', error);
    next(error);
  }
});

export default router;

/**
 * Extract advancement array from normalized core traits
 * @param coreTraits - Normalized core traits object
 * @returns Advancement array for dnd5e schema
 */
function extractAdvancement(coreTraits: Record<string, string>): any[] {
  const advancement: any[] = [];

  // Saving Throws
  if (coreTraits['Saving Throws']) {
    const saves = coreTraits['Saving Throws']
      .split(/,| and /)
      .map(s => s.trim())
      .filter(Boolean);
    if (saves.length) {
      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: { grants: saves.map(s => `saves:${s}`) },
        value: { chosen: saves.map(s => `saves:${s}`) },
      });
    }
  }

  // Skill Proficiencies
  if (coreTraits['Skill Proficiencies']) {
    // Try to extract count and pool
    let count = 0;
    let pool: string[] = [];
    const match = /choose\s*(\d+)/i.exec(coreTraits['Skill Proficiencies']);
    if (match) count = parseInt(match[1], 10);
    // Extract skills from within parentheses or after colon
    let skillsRaw = '';
    const parenMatch = /\(([^)]+)\)/.exec(coreTraits['Skill Proficiencies']);
    if (parenMatch) {
      skillsRaw = parenMatch[1];
    } else {
      const colonMatch = /choose\s*\d+:?\s*(.*)$/i.exec(coreTraits['Skill Proficiencies']);
      if (colonMatch) skillsRaw = colonMatch[1];
    }
    if (skillsRaw) {
      pool = skillsRaw
        .split(/,| or /)
        .map(s => s.trim())
        .filter(Boolean);
    }
    if (count && pool.length) {
      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: { choices: [{ count, pool: pool.map(s => `skills:${s}`) }] },
        value: { chosen: [] },
      });
    }
  }

  return advancement;
}

// Helper: Map equipment names to Foundry compendium names (simple mapping for now)
function mapEquipmentToCompendium(equipment: string): string {
  // TODO: Enhance with a real mapping table if needed
  return equipment
    .replace(/\bLeather Armor\b/i, 'Leather Armor')
    .replace(/\bShortsword\b/i, 'Shortsword')
    .replace(/\bShortbow\b/i, 'Shortbow')
    .replace(/\bDagger\b/i, 'Dagger')
    .replace(/\bThieves' Tools\b/i, "Thieves' Tools")
    .replace(/\bBurglar's Pack\b/i, "Burglar's Pack")
    .replace(/\bQuiver\b/i, 'Quiver')
    .replace(/\bArrows\b/i, 'Arrows')
    .replace(/\bGP\b/i, 'Gold Pieces');
}

// Helper: Extract equipment choices from HTML coreTraits
function extractEquipmentChoices(coreTraits: Record<string, string>): string[][] {
  const startingEquipment = coreTraits['Starting Equipment'];
  if (!startingEquipment) return [];

  const choices: string[][] = [];

  // Pattern: Choose A or B: (A) ... ; or (B) ...
  const choicePattern = /Choose\s+A\s+or\s+B:\s*\(A\)\s*([^;]+);\s*or\s*\(B\)\s*(.+)/i;
  const match = startingEquipment.match(choicePattern);

  if (match) {
    // Parse choice A
    const choiceA = match[1]
      .trim()
      .split(/,\s*(?![^()]*\))/) // Split by comma, but not within parentheses
      .map(item => item.trim())
      .filter(Boolean);

    // Parse choice B
    const choiceB = match[2]
      .trim()
      .split(/,\s*(?![^()]*\))/)
      .map(item => item.trim())
      .filter(Boolean);

    choices.push(choiceA, choiceB);
  } else {
    // No choices, just a list of equipment
    const items = startingEquipment
      .split(/,\s*(?![^()]*\))/)
      .map(item => item.trim())
      .filter(Boolean);

    if (items.length > 0) {
      choices.push(items);
    }
  }

  return choices;
}

// Helper: Extract advancement choices (skills, tools, saves, subclass)
function extractAdvancementV1(coreTraits: Record<string, string>, subclasses: Subclass[]): any[] {
  const advancement: any[] = [];

  // Saving Throws
  const savingThrows = coreTraits['Saving Throws'] || coreTraits['Saving Throw Proficiencies'];
  if (savingThrows) {
    const saves = savingThrows
      .split(/\s+and\s+|,\s*/)
      .map(s => s.trim())
      .filter(s => /^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)$/i.test(s));

    if (saves.length > 0) {
      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: {
          grants: saves.map(s => `saves:${s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}`),
        },
        value: {
          chosen: saves.map(s => `saves:${s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}`),
        },
      });
    }
  }

  // Skill Proficiencies
  const skillProfs = coreTraits['Skill Proficiencies'];
  if (skillProfs) {
    // Extract the number to choose
    const countMatch = /choose\s+(\d+)/i.exec(skillProfs);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

    // Extract the skill list
    let skillList: string[] = [];

    // Try to find skills after "Choose X:"
    const colonMatch = /choose\s+\d+:\s*(.+)/i.exec(skillProfs);
    if (colonMatch) {
      skillList = colonMatch[1]
        .split(/,\s*or\s*|,\s*/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    if (count > 0 && skillList.length > 0) {
      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: {
          choices: [
            {
              count: count,
              pool: skillList.map(skill => `skills:${skill}`),
            },
          ],
        },
        value: { chosen: [] },
      });
    }
  }

  // Tool Proficiencies
  const toolProfs = coreTraits['Tool Proficiencies'];
  if (toolProfs && toolProfs !== 'None') {
    const tools = toolProfs
      .split(/,\s*/)
      .map(t => t.trim())
      .filter(Boolean);

    if (tools.length > 0) {
      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: { grants: tools.map(t => `tools:${t}`) },
        value: { chosen: tools.map(t => `tools:${t}`) },
      });
    }
  }

  // Subclass selection (usually at level 3 for Rogue)
  if (subclasses && subclasses.length > 0) {
    advancement.push({
      type: 'Subclass',
      level: 3,
      configuration: { pool: subclasses.map(sc => sc.name) },
      value: { chosen: [] },
    });
  }

  return advancement;
}

// Update getClassDataByIdAndName to call the new getClassData
async function getClassDataByIdAndName(
  classID: number,
  className: string,
  cobalt: string
): Promise<ClassData> {
  return getClassData(classID, className, cobalt);
}
