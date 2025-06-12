import express, { Router, Request, Response } from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const router: Router = express.Router();
router.use(express.json());
console.log('[feats.ts] feats.ts module loaded');

interface FeatRequest {
    cobalt: string;
    name?: string;
}

// Real feat data fetcher: Scrape D&D Beyond feats list and details
async function getFeats({ cobalt, name }: FeatRequest): Promise<any> {
    const featsUrl = "https://www.dndbeyond.com/feats";
    const headers = {
        "Cookie": `CobaltSession=${cobalt}`,
        "User-Agent": "Mozilla/5.0 (BeyondFoundryProxy)"
    };
    // Fetch the feats list page
    const res = await fetch(featsUrl, { headers });
    if (!res.ok) throw new Error(`Failed to fetch feats list: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    // Find all feat links
    const featLinks: string[] = [];
    $("a.listing-card__link").each((i, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("/feats/")) featLinks.push(href);
    });
    console.log(`[feats] Found ${featLinks.length} feat links on feats page`);
    // Remove duplicates
    const uniqueLinks = [...new Set(featLinks)];
    // Optionally filter by name
    let filteredLinks = uniqueLinks;
    if (name) {
        filteredLinks = uniqueLinks.filter(link => link.toLowerCase().includes(name.toLowerCase()));
    }
    console.log(`[feats] Fetching details for ${filteredLinks.length} feats`);
    // Fetch each feat detail page and extract data
    const feats = [];
    for (const link of filteredLinks) {
        try {
            const url = `https://www.dndbeyond.com${link}`;
            const featRes = await fetch(url, { headers });
            if (!featRes.ok) {
                console.warn(`[feats] Failed to fetch feat page: ${url} status=${featRes.status}`);
                continue;
            }
            const featHtml = await featRes.text();
            const $feat = cheerio.load(featHtml);
            const name = $feat("h1.page-title").text().trim();
            const description = $feat(".more-info-content").text().trim() || $feat(".ct-feat__description").text().trim();
            const prereq = $feat(".ct-feat__prerequisite").text().replace("Prerequisite:", "").trim();
            // Try to extract feat id from URL
            const idMatch = link.match(/\d+/);
            const id = idMatch ? parseInt(idMatch[0], 10) : null;
            feats.push({ id, name, description, prerequisite: prereq, url });
        } catch (e) {
            console.error(`[feats] Error scraping feat ${link}:`, e);
            continue;
        }
    }
    console.log(`[feats] Returning ${feats.length} feats`);
    return feats;
}
router.post("/feats", async (req, res) => {
    try {
        const { cobalt, name } = req.body;
        if (!cobalt) {
            return res.status(400).json({ success: false, message: "Missing cobalt token" });
        }
        const data = await getFeats({ cobalt, name });
        return res.json({ success: true, data });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ success: false, message });
    }
});
export default router;
