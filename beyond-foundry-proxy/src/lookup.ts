// filepath: /Users/macbook-pro/Documents/Programming/beyond-foundry/beyond-foundry-proxy/src/lookup.ts
import fetch, { RequestRedirect } from "node-fetch"; // Added RequestRedirect
import CONFIG from "./config"; // Changed from "./config.js"
import Cache from "./cache"; // Changed from "./cache.js"
import express from 'express';

const router = express.Router();
const CACHE_CONFIG = new Cache("CONFIG", 1);
const getConfig = () => {
    return new Promise((resolve, reject) => {
        console.log("Retrieving ddb config");
        const cache = CACHE_CONFIG.exists("DDB_CONFIG");
        console.warn(cache);
        if (cache !== undefined) {
            console.log("CONFIG API CACHE_CONFIG HIT!");
            return resolve(cache.data);
        }
        const url = CONFIG.urls.configUrl;
        const options = {
            headers: {
                "User-Agent": "Foundry VTT Character Integrator",
                "Accept": "*/*",
            },
            method: "GET",
            redirect: "follow" as RequestRedirect, // Cast to RequestRedirect
        };
        fetch(url, options)
            .then(res => res.json())
            .then(json => {
            if (json && json.sources) {
                CACHE_CONFIG.add("DDB_CONFIG", json);
                console.log("Adding CACHE_CONFIG to cache...");
                resolve(json);
            }
            else {
                console.log("Received no valid config data, instead:" + json);
                reject(json);
            }
        })
            .catch(error => {
            console.log("Error retrieving DDB Config");
            console.log(error);
            reject(error);
        });
    });
};

router.get('/ddb-config', async (_req, res) => {
    try {
        const configData = await getConfig();
        res.json(configData);
    } catch (error) {
        console.error('Error fetching DDB config:', error);
        res.status(500).json({ error: 'Failed to retrieve DDB config' });
    }
});

export { getConfig };
export default router;
