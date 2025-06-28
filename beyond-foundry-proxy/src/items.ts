import fetch from "node-fetch";
import CONFIG from "./config";
import * as authentication from "./auth";
import express, { Router, Request, Response } from "express";
import { extractCharacterData } from "./character";

const router: Router = express.Router();

interface ItemData {
    success: boolean;
    data?: any[];
    message?: string;
}

interface ItemSource {
    sourceId: number;
}

interface Item {
    sources?: ItemSource[];
}

const isValidData = (data: ItemData): boolean => {
    return data.success === true;
};

const extractItems = (cobaltId: string, campaignId?: string, characterId?: string): Promise<Item[]> => {
    return new Promise((resolve, reject) => {
        console.log(`Retrieving items for ${cobaltId} campaignId=${campaignId} characterId=${characterId}`);
        console.log("ITEMS API CACHE_ITEMS MISS!");
        const url = CONFIG.urls.itemsAPI(campaignId);
        const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
        let fetchHeaders: any = {};
        if (cacheResult && cacheResult.data !== null) {
            fetchHeaders["Authorization"] = `Bearer ${cacheResult.data}`;
        } else if (cobaltId) {
            fetchHeaders["cookie"] = `__cf_bm=; session=${cobaltId}`;
        }
        // Add browser-like headers
        fetchHeaders["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        fetchHeaders["accept"] = "application/json, text/plain, */*";
        fetchHeaders["accept-language"] = "en-US,en;q=0.9";
        fetchHeaders["referer"] = "https://www.dndbeyond.com/";
        fetchHeaders["origin"] = "https://www.dndbeyond.com";
        console.log('Requesting URL:', url);
        console.log('Request headers:', fetchHeaders);
        fetch(url, { headers: fetchHeaders })
            .then(async (res) => {
                let text = await res.text();
                try {
                    const json: ItemData = JSON.parse(text);
                    if (isValidData(json)) {
                        const filteredItems = json.data!.filter((item: Item) => item.sources && (item.sources.length === 0 || item.sources.some((source: ItemSource) => source.sourceId != 39)));
                        console.log(`Adding ${filteredItems.length} items available to cache for ${cobaltId}...`);
                        resolve(filteredItems);
                    } else {
                        console.log("Received no valid item data, instead:" + json.message);
                        reject(json.message);
                    }
                } catch (err) {
                    console.error('Failed to parse item API response as JSON.');
                    console.error('Response status:', res.status);
                    console.error('Response headers:', res.headers.raw ? res.headers.raw() : res.headers);
                    console.error('Raw response body:', text);
                    reject('Invalid JSON from DDB API: ' + (err instanceof Error ? err.message : String(err)));
                }
            })
            .catch((error) => {
                console.log("Error retrieving items");
                if (error instanceof Error) {
                    console.log(error.message);
                    reject(error.message);
                }
                else {
                    console.log(String(error));
                    reject(String(error));
                }
            });
    });
};

// POST /proxy/items
router.post('/', async (req: Request, res: Response) => {
  try {
    const { cobalt, characterIds } = req.body;
    if (!cobalt) {
      return res.status(400).json({ success: false, message: 'Missing cobalt token' });
    }
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing characterIds array' });
    }
    console.log('Aggregating items from characterIds:', characterIds);
    const allItems: Record<string, any> = {};
    for (const characterId of characterIds) {
      try {
        const charData = await extractCharacterData(cobalt, String(characterId));
        const inventory = (charData as any).inventory;
        if (Array.isArray(inventory)) {
          for (const item of inventory) {
            if (item.id && !allItems[item.id]) {
              allItems[item.id] = item;
            }
          }
        } else {
          console.warn(`No inventory found for character ${characterId}`);
        }
      } catch (err) {
        console.error(`Error fetching character ${characterId}:`, err);
      }
    }
    const uniqueItems = Object.values(allItems);
    return res.json({ success: true, data: uniqueItems });
  } catch (error) {
    console.error('Error in /proxy/items:', error);
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : String(error) });
  }
});

export { extractItems };
export default router;
