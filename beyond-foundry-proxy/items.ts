import fetch from "node-fetch";
import CONFIG from "./config.js";
import * as authentication from "./auth.js";
import express from "express";
const router = express.Router();

const isValidData = (data: any): boolean => {
  return data.success === true;
};

const extractItems = (cobaltId: string, campaignId: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    console.log(`Retrieving items for ${cobaltId}`);
    console.log("ITEMS API CACHE_ITEMS MISS!");
    const url = CONFIG.urls.itemsAPI(campaignId);
    const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
    const headers = (cacheResult && cacheResult.data !== null) ? {headers: {"Authorization": `Bearer ${cacheResult.data}`}} : {};
    fetch(url, headers)
      .then((res: any) => res.json())
      .then((json: any) => {
        if (isValidData(json)) {
          const filteredItems = json.data.filter((item: any) =>
            item.sources && (item.sources.length === 0 || item.sources.some((source: any) => source.sourceId != 39))
          );
          console.log(
            `Adding ${filteredItems.length} items available to cache for ${cobaltId}...`
          );
          resolve(filteredItems);
        } else {
          console.log("Received no valid item data, instead:" + json.message);
          reject(json.message);
        }
      })
      .catch((error: unknown) => {
        console.log("Error retrieving items");
        if (error instanceof Error) {
          console.log(error.message);
          reject(error.message);
        } else {
          console.log(String(error));
          reject(String(error));
        }
      });
  });
};

export { extractItems };
export default router;
