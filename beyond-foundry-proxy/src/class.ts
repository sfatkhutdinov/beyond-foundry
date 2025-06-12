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
}

interface Subclass {
  name: string;
  overview: string;
  features: SubclassFeature[];
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
      apiResult = {
        id: classId,
        slug: classSlug,
        name: apiData.name || apiData.definition?.name || 'Unknown Class',
        description: apiData.description || apiData.definition?.description || '',
        source: apiData.source || '',
        tags: apiData.tags || [],
        prerequisites: apiData.prerequisites || [],
        coreTraits: extractCoreTraitsFromAPI(apiData),
        progression: extractProgressionFromAPI(apiData),
        features: extractFeaturesFromAPI(apiData),
        subclasses: extractSubclassesFromAPI(apiData),
        spellcasting: extractSpellcastingFromAPI(apiData),
        sidebars: [],
        additionalTables: [],
        optionalFeatures: [],
        schemaVersion: '2025-06-11'
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
    htmlResult = {
      name: extractName($),
      description: extractDescription($),
      source: extractMetadata($).source,
      tags: extractMetadata($).tags,
      prerequisites: extractMetadata($).prerequisites,
      coreTraits: extractCoreTraits($),
      progression: extractProgressionTable($),
      features: extractFeatures($),
      subclasses: extractSubclasses($),
      spellcasting: extractSpellcasting($),
      sidebars: extractSidebars($),
      additionalTables: extractAdditionalTables($),
      optionalFeatures: [],
      schemaVersion: '2025-06-11'
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

function extractCoreTraitsFromAPI(apiData: any): Record<string, string> {
  const traits: Record<string, string> = {};
  
  if (apiData.hitDie) {
    traits['Hit Point Die'] = `D${apiData.hitDie} per ${apiData.name || 'class'} level`;
  }
  
  if (apiData.primaryAbility) {
    traits['Primary Ability'] = Array.isArray(apiData.primaryAbility) 
      ? apiData.primaryAbility.join(' or ') 
      : apiData.primaryAbility;
  }
  
  if (apiData.savingThrowProficiencies) {
    traits['Saving Throws proficiencies'] = Array.isArray(apiData.savingThrowProficiencies)
      ? apiData.savingThrowProficiencies.join(' and ')
      : apiData.savingThrowProficiencies;
  }

  if (apiData.armorProficiencies) {
    traits['armor training'] = Array.isArray(apiData.armorProficiencies)
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
    traits['starting equipment'] = apiData.startingEquipment;
  }
  
  return traits;
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
  return traits;
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

function extractFeatures($: cheerio.Root): Feature[] {
  const features: Feature[] = [];
  $('h4[id^="Level"]').each((_, el) => {
    const $el = $(el);
    const levelMatch = $el.text().match(/Level (\d+):/);
    if (levelMatch) {
      const level = parseInt(levelMatch[1]);
      const name = $el.text().replace(/Level \d+:\s*/, '').trim();
      const description = $el.next('p').text().trim();
      
      features.push({
        name,
        description,
        requiredLevel: level
      });
    }
  });
  return features;
}

function extractSubclasses($: cheerio.Root): Subclass[] {
  const subclasses: Subclass[] = [];
  $('.subitems-list-details-item').each((_, item) => {
    const $item = $(item);
    const name = $item.find('h2').first().text().trim();
    const description = $item.find('p').first().text().trim();
    const features: SubclassFeature[] = [];
    
    $item.find('h4').each((_, el) => {
      const $el = $(el);
      const name = $el.text().trim();
      const description = $el.next('p').text().trim();
      features.push({ name, description });
    });
    
    subclasses.push({ name, overview: description, features });
  });
  return subclasses;
}

function extractSpellcasting($: cheerio.Root): { progression: string; ability: string; lists: Array<{ label: string; url: string }> } {
  const spellcasting: { progression: string; ability: string; lists: Array<{ label: string; url: string }> } = {
    progression: '',
    ability: '',
    lists: []
  };

  // Look for spellcasting table in subclasses
  $('.subitems-list-details-item').each((_, item) => {
    const $item = $(item);
    if ($item.find('table').length) {
      const $table = $item.find('table');
      if ($table.find('caption').text().includes('Spellcasting')) {
        spellcasting.progression = $table.find('caption').text().trim();
        spellcasting.ability = 'Intelligence'; // Default for Arcane Trickster
        spellcasting.lists = [{ label: 'Wizard', url: '/spells/wizard' }]; // Default for Arcane Trickster
      }
    }
  });

  return spellcasting;
}

function extractSidebars($: cheerio.Root): string[] {
  const sidebars: string[] = [];
  // Extract "Becoming a Rogue" section
  const becomingRogue = $('h3#BecomingaRogue').nextUntil('h2').map((_, el) => $(el).text().trim()).get().join('\n');
  if (becomingRogue) {
    sidebars.push(becomingRogue);
  }
  return sidebars;
}

function extractAdditionalTables($: cheerio.Root): Array<{ title: string; headers: string[]; rows: string[][] }> {
  const tables: Array<{ title: string; headers: string[]; rows: string[][] }> = [];
  
  // Extract subclass-specific tables (like Arcane Trickster Spellcasting)
  $('.subitems-list-details-item table').each((_, table) => {
    const $table = $(table);
    const caption = $table.find('caption').text().trim();
    if (caption && !caption.includes('Spellcasting')) {
      const rows: string[][] = [];
      $table.find('tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('th, td').map((_, cell) => $(cell).text().trim()).get();
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
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
