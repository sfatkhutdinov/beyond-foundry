import fetch from "node-fetch";
import CONFIG from "./config";
import * as authentication from "./auth";
import express, { Router, Request, Response } from "express";

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

const extractItems = (cobaltId: string, campaignId?: string): Promise<Item[]> => {
    return new Promise((resolve, reject) => {
        console.log(`Retrieving items for ${cobaltId}`);
        console.log("ITEMS API CACHE_ITEMS MISS!");
        const url = CONFIG.urls.itemsAPI(campaignId);
        const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
        const headers = (cacheResult && cacheResult.data !== null) ? { headers: { "Authorization": `Bearer ${cacheResult.data}` } } : {};
        fetch(url, headers)
            .then((res) => res.json())
            .then((json: ItemData) => {
            if (isValidData(json)) {
                const filteredItems = json.data!.filter((item: Item) => item.sources && (item.sources.length === 0 || item.sources.some((source: ItemSource) => source.sourceId != 39)));
                console.log(`Adding ${filteredItems.length} items available to cache for ${cobaltId}...`);
                resolve(filteredItems);
            }
            else {
                console.log("Received no valid item data, instead:" + json.message);
                reject(json.message);
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
export { extractItems };
export default router;
