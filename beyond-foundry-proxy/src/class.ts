import { Router, Request, Response, NextFunction } from "express";
import * as winston from 'winston';
import Ajv from 'ajv';
import fetch from 'node-fetch';
import CONFIG from './config';
import * as authentication from './auth';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { ClassData } from './types';
import classDataSchema from './classData.schema.json';
// import puppeteer from 'puppeteer'; // Removed - DnDBeyond blocks headless browsers

const router: Router = Router();
const ajv = new Ajv({ allErrors: true });
const validateClassData = ajv.compile(classDataSchema);

interface ClassDataRequestBody {
  cobalt: string;
  classSlug: string;
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
  coreTraits: Record<string,string>;
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
};

/* *********************************** */
/*  Main Data Fetch & Extraction      */
/* *********************************** */

// Map slug to numeric class ID
function getClassIdFromSlug(slug: string): number | null {
  const clean = slug.replace(/^\d+-?/, '').toLowerCase();
  const entry = CONFIG.classMap.find(e =>
    e.name.toLowerCase() === clean || `${e.id}-${clean}` === slug.toLowerCase()
  );
  return entry?.id ?? null;
}

// Entry point
async function getClassData(classSlug: string, cobalt: string): Promise<ClassData> {
  const classId = getClassIdFromSlug(classSlug);
  if (!classId) throw new Error(`Unknown classSlug: ${classSlug}`);

  // Get bearer token first
  const token = await authentication.getBearerToken(classId.toString(), cobalt);
  if (!token) {
    throw new Error('Failed to get bearer token');
  }

  // Try to fetch class data directly from D&D Beyond's internal API first
  console.log('Attempting to fetch class data from D&D Beyond API...');
  let apiData: any = null;
  let apiResult: ProxyClassData | null = null;
  try {
    // Try the unofficial class API endpoint
    const classApiUrl = `https://www.dndbeyond.com/api/classes/${classId}`;
    console.log(`Trying API endpoint: ${classApiUrl}`);
    const apiResponse = await fetch(classApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.dndbeyond.com',
        'Cookie': `CobaltSession=${cobalt}`
      }
    });
    if (apiResponse.ok) {
      apiData = await apiResponse.json();
      const apiCoreTraits = extractCoreTraitsFromAPI(apiData);
      apiResult = {
        id: classId,
        slug: classSlug,
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
      };
    }
  } catch (apiError) {
    console.log('API approach failed:', apiError.message, 'falling back to HTML');
  }

  // If API is missing critical fields, fetch and parse HTML for fallback/merge
  let htmlResult: Partial<ProxyClassData> = {};
  let needHtml = false;
  if (!apiResult ||
      !apiResult.progression?.length ||
      !apiResult.features?.length ||
      !apiResult.subclasses?.length ||
      !apiResult.sidebars?.length ||
      !apiResult.tags?.length ||
      !apiResult.prerequisites?.length ||
      !Object.keys(apiResult.coreTraits || {}).length) {
    needHtml = true;
  }

  if (needHtml) {
    // Fetch the class HTML page
    const htmlUrl = `https://www.dndbeyond.com/classes/${classSlug}`;
    const htmlResponse = await fetch(htmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Cookie': `CobaltSession=${cobalt}`
      }
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
    };
  }

  // Merge API and HTML results, preferring API where present
  const merged: ProxyClassData = {
    id: classId,
    slug: classSlug,
    name: apiResult?.name || htmlResult.name || 'Unknown Class',
    description: apiResult?.description || htmlResult.description || '',
    source: apiResult?.source || htmlResult.source || 'Player\'s Handbook',
    tags: (apiResult?.tags?.length ? apiResult.tags : htmlResult.tags) || [],
    prerequisites: (apiResult?.prerequisites?.length ? apiResult.prerequisites : htmlResult.prerequisites) || [],
    coreTraits: (apiResult?.coreTraits && Object.keys(apiResult.coreTraits).length ? apiResult.coreTraits : htmlResult.coreTraits) || {},
    progression: (apiResult?.progression?.length ? apiResult.progression : htmlResult.progression) || [],
    features: (apiResult?.features?.length ? apiResult.features : htmlResult.features) || [],
    subclasses: (apiResult?.subclasses?.length ? apiResult.subclasses : htmlResult.subclasses) || [],
    spellcasting: apiResult?.spellcasting || htmlResult.spellcasting || { progression: '', ability: '', lists: [] },
    sidebars: (apiResult?.sidebars?.length ? apiResult.sidebars : htmlResult.sidebars) || [],
    additionalTables: htmlResult.additionalTables || [],
    optionalFeatures: apiResult?.optionalFeatures || htmlResult.optionalFeatures || [],
    schemaVersion: '2025-06-11',
    advancement: (apiResult?.advancement && apiResult.advancement.length ? apiResult.advancement : htmlResult.advancement) || [],
  };

  if (!validateClassData(merged)) {
    winston.error('Validation errors', validateClassData.errors);
    throw new Error('Schema validation failed');
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
    'Skill Proficiencies': 'Skill Proficiencies',
    'Weapon Proficiencies': 'Weapon Proficiencies',
    'Tool Proficiencies': 'Tool Proficiencies',
    'armor training': 'Armor Training',
    'Armor Training': 'Armor Training',
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
      columns
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
      requiredLevel: feature.requiredLevel || 1
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
      features: subclass.features ? subclass.features.map((f: any) => ({
        name: f.name || '',
        description: f.description || f.snippet || '',
        requiredLevel: f.requiredLevel || 1
      })) : []
    }));
  }
  
  return [];
}

function extractSpellcastingFromAPI(apiData: any): { progression: string; ability: string; lists: Array<{ label: string; url: string }> } {
  // Extract spellcasting info from API response
  const result = {
    progression: '',
    ability: '',
    lists: [] as Array<{ label: string; url: string }>
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
/*  HTML Extractors (Legacy)          */
/* *********************************** */

function sanitize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractName($: cheerio.Root): string {
  return $('h1#RogueClassDetails').text().trim().replace('Class Details', '').trim();
}

function extractDescription($: cheerio.Root): string {
  const paragraphs: string[] = [];
  $('div.static-container-details p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !text.includes('Becoming a')) {
      paragraphs.push(text);
    }
  });
  return paragraphs.join('\n\n');
}

function extractMetadata($: cheerio.Root): { source: string; tags: string[]; prerequisites: string[] } {
  return {
    source: 'Player\'s Handbook',
    tags: [],
    prerequisites: []
  };
}

// Refactored HTML core trait extraction with normalization
function extractCoreTraits($: cheerio.Root): Record<string, string> {
  const traits: Record<string, string> = {};
  $('table.table-compendium.table--left-all').each((_, table) => {
    const $table = $(table);
    if ($table.find('h2#CoreRogueTraits').length) {
      $table.find('tr').each((_, row) => {
        const $row = $(row);
        const key = $row.find('th').text().trim();
        const value = $row.find('td').text().trim();
        if (key && value) {
          traits[key] = value;
        }
      });
    }
  });
  return normalizeCoreTraitKeys(traits);
}

function extractProgressionTable($: cheerio.Root): ProgressionRow[] {
  const progression: ProgressionRow[] = [];
  $('table.table-compendium.table--left-col3').each((_, table) => {
    const $table = $(table);
    if ($table.find('h2#RogueFeatures').length) {
      $table.find('tbody tr').each((_, row) => {
        const $row = $(row);
        const level = parseInt($row.find('td').eq(0).text());
        const proficiencyBonus = $row.find('td').eq(1).text();
        const features = $row.find('td').eq(2).text().split(', ');
        const sneakAttack = $row.find('td').eq(3).text();

        progression.push({
          level,
          columns: [level.toString(), proficiencyBonus, ...features, sneakAttack]
        });
      });
    }
  });
  return progression;
}

/**
 * Extract all class features from HTML, associating each with the correct level and name.
 * Handles features that span multiple paragraphs or have embedded lists.
 * @param $ - Cheerio root
 * @returns Array of { name, description, requiredLevel }
 *
 * Note: All h4[id^=...] selectors use ASCII apostrophes for compatibility.
 */
function extractFeatures($: cheerio.Root): Feature[] {
  const features: Feature[] = [];
  // Use only ASCII apostrophes in selectors for compatibility
  const featureSelectors = [
    'h4[id^="Expertise"]',
    'h4[id^="SneakAttack"]',
    'h4[id^="ThievesCant"]',
    'h4[id^="WeaponMastery"]',
    'h4[id^="CunningAction"]',
    'h4[id^="RogueSubclass"]',
    'h4[id^="SteadyAim"]',
    'h4[id^="AbilityScoreImprovement"]',
    'h4[id^="CunningStrike"]',
    'h4[id^="UncannyDodge"]',
    'h4[id^="Evasion"]',
    'h4[id^="ReliableTalent"]',
    'h4[id^="ImprovedCunningStrike"]',
    'h4[id^="DeviousStrikes"]',
    'h4[id^="SlipperyMind"]',
    'h4[id^="Elusive"]',
    'h4[id^="EpicBoon"]',
    'h4[id^="StrokeofLuck"]',
    'h4[id^="Spellcasting"]',
    'h4[id^="MageHandLegerdemain"]',
    'h4[id^="MagicalAmbush"]',
    'h4[id^="VersatileTrickster"]',
    'h4[id^="SpellThief"]',
    'h4[id^="Assassinate"]',
    'h4[id^="Assassin\'sTools"]',
    'h4[id^="InfiltrationExpertise"]',
    'h4[id^="EnvenomWeapons"]',
    'h4[id^="DeathStrike"]',
    'h4[id^="PsionicPower"]',
    'h4[id^="PsychicBlades"]',
    'h4[id^="SoulBlades"]',
    'h4[id^="PsychicVeil"]',
    'h4[id^="RendMind"]',
    'h4[id^="FastHands"]',
    'h4[id^="Second-StoryWork"]',
    'h4[id^="SupremeSneak"]',
    'h4[id^="UseMagicDevice"]',
    'h4[id^="Thief\'sReflexes"]'
  ].join(', ');
  $(featureSelectors).each((_, el) => {
    const $el = $(el);
    const headingText = $el.text().trim();
    // Parse level from heading (e.g., 'Level 3: Steady Aim')
    let requiredLevel = 1;
    const levelMatch = headingText.match(/Level\s*(\d+):?/i);
    if (levelMatch) requiredLevel = parseInt(levelMatch[1], 10);
    // Feature name is heading text after 'Level X:'
    let name = headingText.replace(/Level\s*\d+:?\s*/, '').trim();
    if (!name) name = headingText;
    // Gather all <p> and <ul>/<ol> siblings until the next heading
    let descriptionParts: string[] = [];
    let $next = $el.next();
    while ($next.length && !$next.is('h4')) {
      if ($next.is('p')) {
        descriptionParts.push($next.text().trim());
      } else if ($next.is('ul') || $next.is('ol')) {
        // Join list items as bullet points
        const items = $next.find('li').map((_, li) => '- ' + $(li).text().trim()).get();
        if (items.length) descriptionParts.push(items.join('\n'));
      }
      $next = $next.next();
    }
    const description = descriptionParts.join('\n\n');
    features.push({ name, description, requiredLevel });
  });
  return features;
}

/**
 * Extract all subclasses from HTML, each with its own name, overview, features, and tables.
 * @param $ - Cheerio root
 * @returns Array of { name, overview, features, tables }
 */
function extractSubclasses($: cheerio.Root): Subclass[] {
  const subclasses: Subclass[] = [];
  $('.subitems-list-details-item').each((_, item) => {
    const $item = $(item);
    const name = $item.find('h2').first().text().trim();
    const overview = $item.find('p').first().text().trim();
    const features: SubclassFeature[] = [];
    // Extract features within this subclass section
    $item.find('h4').each((_, el) => {
      const $el = $(el);
      const headingText = $el.text().trim();
      // Parse level from heading (e.g., 'Level 3: Spellcasting')
      let requiredLevel: number | undefined = undefined;
      const levelMatch = headingText.match(/Level\s*(\d+):?/i);
      if (levelMatch) requiredLevel = parseInt(levelMatch[1], 10);
      // Feature name is heading text after 'Level X:'
      let featureName = headingText.replace(/Level\s*\d+:?\s*/, '').trim();
      if (!featureName) featureName = headingText;
      // Gather all <p> and <ul>/<ol> siblings until the next heading
      let descriptionParts: string[] = [];
      let $next = $el.next();
      while ($next.length && !$next.is('h4')) {
        if ($next.is('p')) {
          descriptionParts.push($next.text().trim());
        } else if ($next.is('ul') || $next.is('ol')) {
          // Join list items as bullet points
          const items = $next.find('li').map((_, li) => '- ' + $(li).text().trim()).get();
          if (items.length) descriptionParts.push(items.join('\n'));
        }
        $next = $next.next();
      }
      const description = descriptionParts.join('\n\n');
      features.push({ name: featureName, description, requiredLevel });
    });
    // Extract subclass-specific tables
    const tables: Array<{ title: string; headers: string[]; rows: string[][] }> = [];
    $item.find('table').each((_, table) => {
      const $table = $(table);
      const caption = $table.find('caption').text().trim();
      const rows: string[][] = [];
      $table.find('tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('th, td').map((_, cell) => $(cell).text().trim()).get();
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      if (caption) {
        tables.push({
          title: caption,
          headers: rows[0] || [],
          rows: rows.slice(1)
        });
      }
    });
    subclasses.push({ name, overview, features, tables });
  });
  return subclasses;
}

/**
 * Extract spellcasting info from HTML, using tables, feature text, and core traits.
 * @param $ - Cheerio root
 * @param features - Array of class features (optional, for fallback)
 * @param coreTraits - Normalized core traits (optional, for fallback)
 * @returns { progression, ability, lists }
 */
function extractSpellcasting(
  $: cheerio.Root,
  features?: Feature[],
  coreTraits?: Record<string, string>
): { progression: string; ability: string; lists: Array<{ label: string; url: string }> } {
  const spellcasting: { progression: string; ability: string; lists: Array<{ label: string; url: string }> } = {
    progression: '',
    ability: '',
    lists: []
  };

  // Try to find a spellcasting table (e.g., Arcane Trickster Spellcasting)
  let foundTable = false;
  $('table').each((_, table) => {
    const $table = $(table);
    const caption = $table.find('caption').text().trim();
    if (/spellcasting/i.test(caption)) {
      foundTable = true;
      // Heuristic: if table is in a subclass, it's subclass spellcasting
      spellcasting.progression = caption;
      // Try to infer ability from table context or default to Intelligence for Arcane Trickster
      if (/arcane trickster/i.test(caption)) {
        spellcasting.ability = 'Intelligence';
        spellcasting.lists = [{ label: 'Wizard', url: '/spells/wizard' }];
      }
      // Add more heuristics for other subclasses/classes as needed
    }
  });

  // If not found in table, try to infer from features or core traits
  if (!foundTable && features) {
    const spellFeature = features.find(f => /spellcasting/i.test(f.name));
    if (spellFeature) {
      // Try to infer progression from text
      if (/full[- ]?caster/i.test(spellFeature.description)) spellcasting.progression = 'full';
      else if (/half[- ]?caster/i.test(spellFeature.description)) spellcasting.progression = 'half';
      else if (/third[- ]?caster/i.test(spellFeature.description)) spellcasting.progression = 'third';
      else spellcasting.progression = 'partial';
      // Try to infer ability
      if (/intelligence/i.test(spellFeature.description)) spellcasting.ability = 'Intelligence';
      else if (/wisdom/i.test(spellFeature.description)) spellcasting.ability = 'Wisdom';
      else if (/charisma/i.test(spellFeature.description)) spellcasting.ability = 'Charisma';
      // Try to infer spell list
      if (/wizard/i.test(spellFeature.description)) {
        spellcasting.lists.push({ label: 'Wizard', url: '/spells/wizard' });
      } else if (/cleric/i.test(spellFeature.description)) {
        spellcasting.lists.push({ label: 'Cleric', url: '/spells/cleric' });
      } // Add more as needed
    }
  }

  // Fallback to core traits if still missing
  if (!spellcasting.ability && coreTraits) {
    if (coreTraits['Primary Ability']) {
      if (/intelligence/i.test(coreTraits['Primary Ability'])) spellcasting.ability = 'Intelligence';
      else if (/wisdom/i.test(coreTraits['Primary Ability'])) spellcasting.ability = 'Wisdom';
      else if (/charisma/i.test(coreTraits['Primary Ability'])) spellcasting.ability = 'Charisma';
    }
  }

  // If nothing found, return empty/defaults
  return spellcasting;
}

/**
 * Extract all sidebar-like content from HTML (e.g., 'Becoming a Rogue', 'As a Level 1 Character', etc.)
 * @param $ - Cheerio root
 * @returns Array of sidebar strings
 */
function extractSidebars($: cheerio.Root): string[] {
  const sidebars: string[] = [];
  // Extract 'Becoming a Rogue' section
  const becomingRogue = $('h3#BecomingaRogue').nextUntil('h2').map((_, el) => $(el).text().trim()).get().join('\n');
  if (becomingRogue) {
    sidebars.push(becomingRogue);
  }
  // Extract 'As a Level 1 Character' and 'As a Multiclass Character' sections
  $('h4[id^="AsaLevel1Character"], h4[id^="AsaMulticlassCharacter"]').each((_, el) => {
    const $el = $(el);
    const heading = $el.text().trim();
    let contentParts: string[] = [];
    let $next = $el.next();
    while ($next.length && !$next.is('h4') && !$next.is('h2')) {
      if ($next.is('ul') || $next.is('ol')) {
        const items = $next.find('li').map((_, li) => '- ' + $(li).text().trim()).get();
        if (items.length) contentParts.push(items.join('\n'));
      } else if ($next.is('p')) {
        contentParts.push($next.text().trim());
      }
      $next = $next.next();
    }
    if (contentParts.length) {
      sidebars.push(`${heading}\n${contentParts.join('\n\n')}`);
    }
  });
  return sidebars;
}

/**
 * Extract all additional tables from HTML not already captured elsewhere
 * @param $ - Cheerio root
 * @returns Array of { title, headers, rows }
 */
function extractAdditionalTables($: cheerio.Root): Array<{ title: string; headers: string[]; rows: string[][] }> {
  const tables: Array<{ title: string; headers: string[]; rows: string[][] }> = [];
  // Extract tables that are not in subclasses (top-level tables)
  $('table.table-compendium').each((_, table) => {
    const $table = $(table);
    const caption = $table.find('caption').text().trim();
    // Skip if already handled as progression or core traits
    if (/core|feature|progression/i.test(caption)) return;
    const rows: string[][] = [];
    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('th, td').map((_, cell) => $(cell).text().trim()).get();
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    if (caption) {
      tables.push({
        title: caption,
        headers: rows[0] || [],
        rows: rows.slice(1)
      });
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
  type: 'object', properties: { cobalt:{type:'string'}, classSlug:{type:'string'} }, additionalProperties:false, required:['cobalt','classSlug']
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cobalt, classSlug } = req.body as ClassDataRequestBody;
    
    // Add debug logging
    console.log('Received request for class:', classSlug);
    console.log('Cookie present:', !!cobalt);
    
    if (!cobalt) {
      console.log('No cobalt cookie provided');
      return res.status(401).json({ error: 'No cobalt cookie provided' });
    }

    const data = await getClassData(classSlug, cobalt);
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
        value: { chosen: saves.map(s => `saves:${s}`) }
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
      pool = skillsRaw.split(/,| or /).map(s => s.trim()).filter(Boolean);
    }
    if (count && pool.length) {
      advancement.push({
        type: 'Trait',
        level: 1,
        configuration: { choices: [{ count, pool: pool.map(s => `skills:${s}`) }] },
        value: { chosen: [] }
      });
    }
  }

  return advancement;
}
