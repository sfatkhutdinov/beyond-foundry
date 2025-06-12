import fetch from "node-fetch";
import fs from "fs";
import path from "path";
// import { fileURLToPath } from 'url';
import CONFIG from "./config";
import * as authentication from "./auth";
import express, { Router, Request, Response } from "express";

// Remove ESM-only import.meta.url usage for CommonJS compatibility
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// Use CommonJS __dirname global directly

const router: Router = express.Router();
router.use(express.json());
console.log('[DEBUG] Proxy rpgspell.ts loaded');

interface SpellUrlData {
    id: string;
    name: string;
    url: string;
}

// Parse the sitemap XML to extract spell URLs and IDs
const parseSitemapForSpells = (): SpellUrlData[] => {
    try {
        const sitemapPath = path.join(__dirname, "../sitemap-rpgspell-1.xml");
        console.log(`[parseSitemapForSpells] Reading sitemap from: ${sitemapPath}`);
        
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
        const spellUrls: SpellUrlData[] = [];
        
        // Extract URLs using regex - looking for patterns like "spells/1988-acid-arrow"
        const urlPattern = /<loc>https:\/\/www\.dndbeyond\.com\/spells\/(\d+)-([^<]+)<\/loc>/g;
        let match;
        
        while ((match = urlPattern.exec(sitemapContent)) !== null) {
            const id = match[1];
            const name = match[2];
            const url = match[0].replace('<loc>', '').replace('</loc>', '');
            
            spellUrls.push({
                id,
                name: name.replace(/-/g, ' '), // Convert kebab-case to readable name
                url
            });
        }
        
        console.log(`[parseSitemapForSpells] Found ${spellUrls.length} spell URLs in sitemap`);
        return spellUrls;
    } catch (error) {
        console.error(`[parseSitemapForSpells] Error reading sitemap:`, error);
        return [];
    }
};

// Fetch individual spell data from D&D Beyond
const fetchSpellById = async (spellId: string, cobaltToken: string): Promise<any> => {
    try {
        const url = `https://www.dndbeyond.com/api/spells/${spellId}`;
        console.log(`[fetchSpellById] Fetching spell ID ${spellId} from: ${url}`);
        
        const headers: any = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        
        if (cobaltToken) {
            headers["Authorization"] = `Bearer ${cobaltToken}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            console.warn(`[fetchSpellById] Failed to fetch spell ${spellId}: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const spellData = await response.json();
        console.log(`[fetchSpellById] Successfully fetched spell ${spellId}: ${spellData.name || 'Unknown'}`);
        return spellData;
    } catch (error) {
        console.error(`[fetchSpellById] Error fetching spell ${spellId}:`, error);
        return null;
    }
};

// Alternative: Fetch spell using the original D&D Beyond spell page and scrape
const fetchSpellFromPage = async (spellUrl: string): Promise<any> => {
    try {
        console.log(`[fetchSpellFromPage] Fetching spell from page: ${spellUrl}`);
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        
        const response = await fetch(spellUrl, { headers });
        
        if (!response.ok) {
            console.warn(`[fetchSpellFromPage] Failed to fetch spell page: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const pageContent = await response.text();
        
        // Look for JSON data embedded in the page (D&D Beyond often includes spell data in script tags)
        const jsonMatch = pageContent.match(/window\.initialState\s*=\s*({.*?});/s);
        if (jsonMatch) {
            try {
                const initialState = JSON.parse(jsonMatch[1]);
                // Navigate the structure to find spell data
                const spellData = initialState?.Spell?.spell || initialState?.spell;
                if (spellData) {
                    console.log(`[fetchSpellFromPage] Successfully extracted spell data from page`);
                    return spellData;
                }
            } catch (parseError) {
                console.warn(`[fetchSpellFromPage] Failed to parse embedded JSON:`, parseError);
            }
        }
        
        console.warn(`[fetchSpellFromPage] No spell data found in page content`);
        return null;
    } catch (error) {
        console.error(`[fetchSpellFromPage] Error fetching spell page:`, error);
        return null;
    }
};

// POST /rpgspell-1/spells - Fetch spells from D&D Beyond sitemap
router.post('/spells', async (req: Request, res: Response) => {
    console.log('[DEBUG] /proxy/rpgspell-1/spells POST handler reached');
    
    try {
        const { cobaltToken, limit = 10, offset = 0 } = req.body;
        
        // Get cobalt token from cache or request
        let resolvedCobaltToken = cobaltToken;
        if (cobaltToken) {
            const cacheResult = authentication.CACHE_AUTH.exists(cobaltToken);
            if (cacheResult && cacheResult.data) {
                resolvedCobaltToken = cacheResult.data;
                console.log(`[rpgspell-1/spells] Using cached token for authorization`);
            }
        }
        
        // Parse sitemap to get spell URLs
        const spellUrls = parseSitemapForSpells();
        
        if (spellUrls.length === 0) {
            return res.status(500).json({ 
                success: false, 
                message: "Failed to parse sitemap or no spells found" 
            });
        }
        
        // Apply pagination
        const paginatedSpells = spellUrls.slice(offset, offset + limit);
        console.log(`[rpgspell-1/spells] Processing ${paginatedSpells.length} spells (offset: ${offset}, limit: ${limit})`);
        
        const spellData = [];
        let successCount = 0;
        let errorCount = 0;
        
        // Fetch spell data for each URL
        for (const spellUrl of paginatedSpells) {
            try {
                // Try API approach first
                let spell = await fetchSpellById(spellUrl.id, resolvedCobaltToken);
                
                // If API fails, try page scraping
                if (!spell) {
                    spell = await fetchSpellFromPage(spellUrl.url);
                }
                
                if (spell) {
                    // Ensure the spell has the expected structure
                    const formattedSpell = {
                        definition: spell.definition || spell,
                        ...spell
                    };
                    spellData.push(formattedSpell);
                    successCount++;
                    console.log(`[rpgspell-1/spells] Successfully processed spell: ${spell.name || spellUrl.name}`);
                } else {
                    errorCount++;
                    console.warn(`[rpgspell-1/spells] Failed to fetch spell: ${spellUrl.name} (${spellUrl.id})`);
                }
                
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                errorCount++;
                console.error(`[rpgspell-1/spells] Error processing spell ${spellUrl.name}:`, error);
            }
        }
        
        console.log(`[rpgspell-1/spells] Completed: ${successCount} successful, ${errorCount} failed`);
        
        return res.json({ 
            success: true, 
            data: spellData,
            meta: {
                total: spellUrls.length,
                fetched: spellData.length,
                offset,
                limit,
                successCount,
                errorCount
            }
        });
        
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[rpgspell-1/spells] Fatal error:`, message);
        return res.status(500).json({ 
            success: false, 
            message 
        });
    }
});

export default router;
