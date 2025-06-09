import express, { Request, Response } from "express";
const router = express.Router();

// This data is the light version of data available in the character builder
const fetch = require("node-fetch");
const CONFIG = require("./config.js");
const authentication = require("./auth.js");
const Cache = require("./cache");
var CACHE_CAMPAIGNS = new Cache("CAMPAIGNS", 0.25);

// this endpoint aggressively caches campaigns as it's prone to been marked as a bot
const getCampaigns = (cobalt: string, cacheId: string) => {
  return new Promise((resolve, reject) => {
    const cache = CACHE_CAMPAIGNS.exists(cacheId);
    if (cache !== undefined) {
      return resolve(cache.data);
    }

    const auth = authentication.CACHE_AUTH.exists(cacheId);
    if (!auth || !auth.data) {
      reject("Unable to authorise cobalt cookie");
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
      .then((res: Response) => res.json())
      .then((json: any) => {
        if (json.status == "success") {
          CACHE_CAMPAIGNS.add(cacheId, json.data);
          resolve(json.data);
        } else if (json.blockScript) {
          reject("You've been marked as a bot by DDB, please try again later");
        } else {
          reject("Unknown error");
        }
      })
      .catch((error: unknown) => {
        console.error(`Error fetching campaigns: ${error}`);
        reject(error);
      });
  });
};

router.get("/campaigns", (req: Request, res: Response) => {
  const cobalt = req.cookies.CobaltSession as string;
  const cacheId = (req.headers["x-cache-id"] as string) || "";

  getCampaigns(cobalt, cacheId)
    .then((data: any) => {
      res.json(data);
    })
    .catch((error: any) => {
      res.status(500).json({ error: error.message });
    });
});

export default router;
