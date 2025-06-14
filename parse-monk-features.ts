import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';
import he from 'he';
import { ClassParser } from './src/parsers/ClassParser';

// Read the new API response file as JSON and extract the HTML
const jsonPath = path.resolve(__dirname, 'class_jsons/monk-content-container_new.html');
const fileContent = fs.readFileSync(jsonPath, 'utf8');
// Preprocess: escape all literal newlines and carriage returns inside the JSON string
const fixedContent = fileContent.replace(/\r?\n/g, '\\n');
const sanitizedContent = fixedContent.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ' ');
const { contentContainer } = JSON.parse(sanitizedContent);
let html = contentContainer;

// First remove backslash escapes, then decode HTML entities
html = html.replace(/\\([\\"])/g, '$1');
html = he.decode(html);

console.log('=== Testing Fixed Parser ===\n');

// Parse the features
const features = ClassParser.parseFeaturesFromHtml(html);

// Group features by name to check for duplicates
const featuresByName = new Map<string, number[]>();
features.forEach(f => {
  if (!featuresByName.has(f.name)) {
    featuresByName.set(f.name, []);
  }
  featuresByName.get(f.name)!.push(f.requiredLevel);
});

// Report duplicates
console.log('Features with multiple levels:');
featuresByName.forEach((levels, name) => {
  if (levels.length > 1) {
    console.log(`  ${name}: levels ${levels.join(', ')}`);
  }
});

// Check for missing descriptions
console.log('\nFeatures with missing/minimal descriptions:');
features.forEach(f => {
  if (!f.description || 
      f.description.includes('No description') || 
      f.description.includes('not found') ||
      f.description.length < 50) {
    console.log(`  ${f.name} (Level ${f.requiredLevel}): ${f.description.substring(0, 100)}`);
  }
});

// Parse full class data
console.log('\n=== Testing Full Class Parse ===');

// Test the complete proxy data
console.log('\n=== Complete Proxy Data ===');
const proxyData = ClassParser.parseClassFromHtml(html);

// Extract id and slug from the HTML
const match = html.match(/content-image\s+(\d+)-(\w+)/);
const classId = match ? parseInt(match[1], 10) : null;
const classSlug = match ? match[2] : '';

// Transform to Foundry schema
const foundryClass = {
  id: classId,
  slug: classSlug,
  name: (proxyData.name || '').replace(/\s+/g, ' ').trim(),
  description: proxyData.features?.[0]?.description ? proxyData.features[0].description.replace(/<[^>]+>/g, '').split('.')[0] + '.' : '',
  source: proxyData.source || 'D&D Beyond',
  tags: Array.isArray(proxyData.tags) ? proxyData.tags : [],
  prerequisites: Array.isArray(proxyData.prerequisites) ? proxyData.prerequisites : [],
  coreTraits: proxyData.coreTraits || {},
  progression: proxyData.progression || [],
  features: proxyData.features || [],
  subclasses: (proxyData.subclasses || []).map(sub => ({
    name: (sub.name || '').replace(/\s+/g, ' ').trim(),
    overview: sub.description ? sub.description.replace(/<[^>]+>/g, '').split('.')[0] + '.' : '',
    features: [] // Could be filled if subclass features are parsed
  })),
  spellcasting: ('spellcasting' in proxyData) ? (proxyData as any).spellcasting : { progression: 'none', ability: '', lists: [] },
  sidebars: proxyData.sidebars || [],
  additionalTables: proxyData.additionalTables || [],
  optionalFeatures: ('optionalFeatures' in proxyData) ? (proxyData as any).optionalFeatures : [],
  schemaVersion: '1.0.0'
};

fs.writeFileSync(
  path.resolve(__dirname, 'class_jsons/monk-parsed.json'),
  JSON.stringify(foundryClass, null, 2),
  'utf8'
);

console.log('Class name:', proxyData.name);
console.log('Features count:', proxyData.features?.length);
console.log('Subclasses found:', proxyData.subclasses?.map(s => s.name));
console.log('Progression entries:', proxyData.progression?.length);