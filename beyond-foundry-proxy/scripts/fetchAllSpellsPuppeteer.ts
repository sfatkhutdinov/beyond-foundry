import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const COBALT_COOKIE = process.env.COBALT_COOKIE;
if (!COBALT_COOKIE) {
  console.error('COBALT_COOKIE not found in .env');
  process.exit(1);
}

const SITEMAP_PATH = path.join(__dirname, '../dist/sitemap-rpgspell-1.xml');
const OUTPUT_PATH = path.join(__dirname, '../spells_puppeteer_results.json');

function parseSitemapForSpells(): { id: string; name: string; url: string }[] {
  const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const spellUrls: { id: string; name: string; url: string }[] = [];
  const urlPattern = /<loc>https:\/\/www\.dndbeyond\.com\/spells\/(\d+)-([^<]+)<\/loc>/g;
  let match;
  while ((match = urlPattern.exec(sitemapContent)) !== null) {
    const id = match[1];
    const name = match[2];
    const url = match[0].replace('<loc>', '').replace('</loc>', '');
    spellUrls.push({
      id,
      name: name.replace(/-/g, ' '),
      url
    });
  }
  return spellUrls;
}

(async () => {
  const spellUrls = parseSitemapForSpells();
  console.log(`Found ${spellUrls.length} spell URLs in sitemap.`);
  const results = [];
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setCookie({
    name: 'DDB_COOKIE',
    value: COBALT_COOKIE,
    domain: '.dndbeyond.com',
    path: '/',
    httpOnly: false,
    secure: true,
  });
  for (let i = 0; i < Math.min(2, spellUrls.length); i++) { // Start with 2 for testing
    const spell = spellUrls[i];
    try {
      console.log(`[${i + 1}/${spellUrls.length}] Fetching: ${spell.url}`);
      await page.goto(spell.url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Save raw HTML for the first spell for debugging
      if (i === 0) {
        const html = await page.content();
        fs.writeFileSync(path.join(__dirname, '../spell1.html'), html, 'utf8');
        console.log('Saved raw HTML of first spell page to spell1.html');
      }
      const spellData = await page.evaluate(() => {
        // @ts-ignore
        if (window.initialState && window.initialState.Spell && window.initialState.Spell.spell) {
          // @ts-ignore
          return window.initialState.Spell.spell;
        }
        // @ts-ignore
        if (window.initialState && window.initialState.spell) {
          // @ts-ignore
          return window.initialState.spell;
        }
        return null;
      });
      if (spellData) {
        results.push({
          id: spell.id,
          name: spell.name,
          url: spell.url,
          data: spellData
        });
        console.log(`  Success: ${spell.name}`);
      } else {
        console.warn(`  No spell data found for: ${spell.name}`);
      }
    } catch (err) {
      console.error(`  Error fetching ${spell.name}:`, err);
    }
  }
  await browser.close();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Done. Saved ${results.length} spells to ${OUTPUT_PATH}`);
})(); 