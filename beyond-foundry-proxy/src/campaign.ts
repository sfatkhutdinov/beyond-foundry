// filepath: /Users/macbook-pro/Documents/Programming/beyond-foundry/beyond-foundry-proxy/src/campaign.ts
import express, { Request, Response, NextFunction } from "express"; // Added Request, Response, NextFunction
import fetch from "node-fetch";
import CONFIG from "./config"; // Removed .js
import * as authentication from "./auth"; // Removed .js
import Cache from "./cache"; // Removed .js

const router = express.Router();
// This data is the light version of data available in the character builder
var CACHE_CAMPAIGNS = new Cache("CAMPAIGNS", 0.25);
// this endpoint aggressively caches campaigns as it's prone to been marked as a bot
const getCampaigns = (cobalt: string, cacheId: string | string[]): Promise<any[]> => { // Added types
    return new Promise((resolve, reject) => {
        const cachedData = CACHE_CAMPAIGNS.exists(cacheId as string); // Added type assertion
        if (cachedData !== undefined) {
            return resolve(cachedData.data);
        }
        const auth = authentication.CACHE_AUTH.exists(cacheId as string); // Added type assertion
        if (!auth || !auth.data) {
            reject("Unable to authorise cobalt cookie");
            return;
        }
        const headers = {
            "Authorization": `Bearer ${auth.data}`,
            "User-Agent": "Foundry VTT Character Integrator",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Cookie": `CobaltSession=${cobalt}`,
        };
        const options = {
            method: "GET",
            headers: headers,
        };
        fetch(CONFIG.urls.campaignsAPI, options)
            .then((res) => res.json())
            .then((json) => {
            if (json.status == "success") {
                CACHE_CAMPAIGNS.add(cacheId as string, json.data);
                resolve(json.data);
            }
            else if (json.blockScript) {
                reject("You've been marked as a bot by DDB, please try again later");
            }
            else {
                reject("Unknown error");
            }
        })
            .catch((error) => {
            console.error(`Error fetching campaigns: ${error}`);
            reject(error);
        });
    });
};
router.get("/campaigns", (req: Request, res: Response, next: NextFunction): void => { // Explicitly set return type to void
    const cobalt = req.cookies.CobaltSession;
    const cacheId = req.headers["x-cache-id"] || "";
    if (!cobalt) {
        res.status(401).json({ error: "CobaltSession cookie is missing" });
        return; // Ensure early return
    }
    getCampaigns(cobalt, cacheId)
        .then((data) => {
        res.json(data);
    })
        .catch((error) => {
        // Pass error to the global error handler
        next(error);
    });
});
export { getCampaigns };
export default router;
