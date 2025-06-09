import express, { Request, Response } from "express";
import cors from "cors";
import crypto from "crypto";

import CONFIG from "./config.js";
import { getBearerToken, getCacheId } from "./auth.js";
import filterModifiers from "./filterModifiers.js";
import spells from "./spells.js";
import campaignRouter from "./campaign.js";
import { getConfig } from "./lookup.js";
import { extractItems } from "./items.js";
import { extractCharacterData, getOptionalClassFeatures, getOptionalOrigins } from "./character.js";
import { extractMonsters, extractMonstersById } from "./monsters.js";

import classRoute from "./class.js";
import featsRoute from "./feats.js";
import backgroundsRoute from "./backgrounds.js";
import racesRoute from "./races.js";
import rulesRoute from "./rules.js";
import adventuresRoute from "./adventures.js";

const app = express();
const port = process.env.PORT || 3000;

/**
 * A simple ping to tell if the proxy is running
 */
app.get("/ping", cors(), (_req: Request, res: Response) => res.send("pong"));

const authPath = ["/proxy/auth"];
app.options(authPath, cors(), (_req: Request, res: Response) => res.status(200).send());
app.post(authPath, cors(), express.json(), (req: Request, res: Response) => {
  // Allow fallback to env if not provided
  const cobalt = req.body.cobalt && req.body.cobalt !== "" ? req.body.cobalt : process.env.COBALT_COOKIE;
  if (!cobalt || cobalt === "") return res.json({ success: false, message: "No cobalt token (not provided and not set in env)" });
  const cacheId = getCacheId(cobalt);

  getBearerToken(cacheId, cobalt).then((token: string | null) => {
    if (!token) return res.json({ success: false, message: "You must supply a valid cobalt value." });
    return res.status(200).json({ success: true, message: "Authenticated." });
  });
});

const configLookupCall = "/proxy/api/config/json";
app.options(configLookupCall, cors(), (_req: Request, res: Response) => res.status(200).send());
app.get(configLookupCall, cors(), express.json(), (_req: Request, res: Response) => {
  getConfig()
    .then((data: unknown) => {
      return res
        .status(200)
        .json({ success: true, message: "Config retrieved.", data: data });
    })
    .catch((error: unknown) => {
      console.log(error);
      if (error === "Forbidden") {
        return res.json({ success: false, message: "Forbidden." });
      }
      return res.json({ success: false, message: "Unknown error during config loading: " + error });
    });
});

/**
 * Returns raw json from DDB
 */
app.options("/proxy/items", cors(), (_req: Request, res: Response) => res.status(200).send());
app.post("/proxy/items", cors(), express.json(), (req: Request, res: Response) => {
  const cobalt = req.body.cobalt && req.body.cobalt !== "" ? req.body.cobalt : process.env.COBALT_COOKIE;
  if (!cobalt || cobalt === "") return res.json({ success: false, message: "No cobalt token (not provided and not set in env)" });

  const cacheId = getCacheId(cobalt);
  const campaignId = req.body.campaignId;

  getBearerToken(cacheId, cobalt).then((token: string | null) => {
    if (!token) return res.json({ success: false, message: "You must supply a valid cobalt value." });
    extractItems(cacheId, campaignId)
      .then((data: unknown) => {
        return res
          .status(200)
          .json({ success: true, message: "All available items successfully received.", data: data });
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error === "Forbidden") {
          return res.json({ success: false, message: "You must supply a valid bearer token." });
        }
        return res.json({ success: false, message: "Unknown error during item loading: " + error });
      });
  });
});

/**
 * Get Class Spells RAW
 */
app.options("/proxy/class/spells", cors(), (_req: Request, res: Response) => res.status(200).send());
app.post("/proxy/class/spells", cors(), express.json(), (req: Request, res: Response) => {
  const className: string = req.body.className ? req.body.className : req.params.className;
  const campaignId: string | undefined = req.body.campaignId;

  const klass = CONFIG.classMap.find((cls) => cls.name == className);
  if (!klass) return res.json({ success: false, message: "Invalid query" });
  if (!req.body.cobalt || req.body.cobalt == "") return res.json({ success: false, message: "No cobalt token" });
  const cobaltToken: string = req.body.cobalt;

  const cacheId = getCacheId(cobaltToken);

  const mockClass = [
    {
      characterClassId: cacheId,
      name: klass.name,
      id: klass.id,
      level: 20,
      spellLevelAccess: 20,
      spells: [],
      classId: klass.id,
      subclassId: klass.id,
      characterClass: klass.name,
      characterSubclass: klass.name,
      characterId: cacheId,
      spellType: klass.spells,
      campaignId: campaignId,
    },
  ];

  getBearerToken(cacheId, cobaltToken).then((token: string | null) => {
    if (!token) return res.json({ success: false, message: "You must supply a valid cobalt value." });
    spells
      .loadSpells(mockClass, cacheId, true)
      .then((data: unknown) => {
        const rawSpells = (data as any[]).map((d: any) => d.spells).flat();
        return rawSpells;
      })
      .then((data: unknown) => {
        return res
          .status(200)
          .json({ success: true, message: "All available spells successfully received.", data: data });
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error === "Forbidden") {
          return res.json({ success: false, message: "You must supply a valid cobalt value." });
        }
        return res.json({ success: false, message: "Unknown error during spell loading: " + error });
      });
  });
});

/**
 * Attempt to parse the character remotely
 */
app.options(["/proxy/character", "/proxy/v5/character"], cors(), (_req: Request, res: Response) => res.status(200).send());
app.post(["/proxy/character", "/proxy/v5/character"], cors(), express.json(), (req: Request, res: Response) => {
  // check for cobalt token, fallback to env
  const cobalt: string = req.body.cobalt && req.body.cobalt !== "" ? req.body.cobalt : process.env.COBALT_COOKIE;
  if (!cobalt || cobalt === "") return res.json({ success: false, message: "No cobalt token (not provided and not set in env)" });

  let characterId: number = 0;
  try {
    const characterIdString: string = req.body.characterId ? req.body.characterId : req.params.characterId;
    characterId = parseInt(characterIdString);
  } catch (exception) {
    return res.json({ message: "Invalid query" });
  }

  const updateId: number = req.body.updateId ? req.body.updateId : 0;
  const cobaltId: string = `${characterId}${cobalt}`;
  let campaignId: string | null = null;

  getBearerToken(cobaltId, cobalt).then(() => {
    extractCharacterData(cobaltId, String(characterId))
      .then((data: any) => {
        console.log(`Name: ${data.name}, URL: ${CONFIG.urls.baseUrl}/character/${data.id}`);
        return Promise.resolve(data);
      })
      .then((data: any) => {
        if (data.campaign && data.campaign.id && data.campaign.id !== "") campaignId = data.campaign.id;
        const result = {
          character: data,
          name: data.name,
          decorations: data.decorations,
          classOptions: [],
          originOptions: [],
        };
        return result;
      })
      .then((result: any) => {
        if (cobalt && result.character.optionalClassFeatures) {
          const optionIds = result.character.optionalClassFeatures.map((opt: any) => opt.classFeatureId);
          return getOptionalClassFeatures(result, optionIds, campaignId, cobaltId);
        } else {
          console.warn("No cobalt token provided, not fetching optional class features");
          return result;
        }
      })
      .then((result: any) => {
        if (cobalt && result.character.optionalOrigins) {
          const optionIds = result.character.optionalOrigins.map((opt: any) => opt.racialTraitId);
          return getOptionalOrigins(result, optionIds, campaignId, cobaltId);
        } else {
          console.warn("No cobalt token provided, not fetching optional origins");
          return result;
        }
      })
      .then((result: any) => {
        return spells.getSpellAdditions(result, cobaltId);
      })
      .then((result: any) => {
        const includeHomebrew = result.character.preferences?.useHomebrewContent;
        return spells.filterHomebrew(result, includeHomebrew);
      })
      .then((data: any) => {
        const filtered = filterModifiers(data);
        return { success: true, messages: ["Character successfully received."], ddb: filtered };
      })
      .then((data: any) => {
        return res.status(200).json(data);
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error === "Forbidden") {
          return res.json({ success: false, message: "Character must be set to public in order to be accessible." });
        }
        return res.json({ success: false, message: "Unknown error during character parsing: " + error });
      });
  });
});

/**
 * Return RAW monster data from DDB
 */
const getMonsterProxyRoutes = ["/proxy/monster", "/proxy/monsters"];
app.options(getMonsterProxyRoutes, cors(), (_req: Request, res: Response) => res.status(200).send());
app.post(getMonsterProxyRoutes, cors(), express.json(), (req: Request, res: Response) => {
  // check for cobalt token
  const cobalt: string = req.body.cobalt;
  if (!cobalt || cobalt == "") return res.json({ success: false, message: "No cobalt token" });

  const search: string = req.body.search ? req.body.search : req.params.search;
  const searchTerm: string = req.body.searchTerm ? req.body.searchTerm : req.params.searchTerm;

  const homebrew: boolean = req.body.homebrew ? req.body.homebrew : false;
  const homebrewOnly: boolean = req.body.homebrewOnly ? req.body.homebrewOnly : false;
  const excludeLegacy: boolean = req.body.excludeLegacy ? req.body.excludeLegacy : false;

  const exactNameMatch: boolean = req.body.exactMatch || false;
  const performExactMatch: boolean = Boolean(exactNameMatch && searchTerm && searchTerm !== "");

  const sources: string[] = req.body.sources || [];

  const hash = crypto.createHash("sha256");
  hash.update(cobalt + searchTerm);
  const cacheId = hash.digest("hex");

  getBearerToken(cacheId, cobalt).then((token: string | null) => {
    if (!token) return res.json({ success: false, message: "You must supply a valid cobalt value." });

    extractMonsters(cacheId, searchTerm, homebrew, homebrewOnly, sources)
      .then((data: any[]) => {
        if (excludeLegacy) {
          const filteredMonsters = data.filter((monster: any) => !monster.isLegacy);
          return filteredMonsters;
        } else {
          return data;
        }
      })
      .then((data: any[]) => {
        if (performExactMatch) {
          const filteredMonsters = data.filter((monster: any) => monster.name.toLowerCase() === search.toLowerCase());
          return filteredMonsters;
        } else {
          return data;
        }
      })
      .then((data: any[]) => {
        return res
          .status(200)
          .json({ success: true, message: "All available monsters successfully received.", data: data });
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error === "Forbidden") {
          return res.json({ success: false, message: "You must supply a valid cobalt value." });
        }
        return res.json({ success: false, message: "Unknown error during monster loading: " + error });
      });
  });
});

/**
 * Return RAW monster data from DDB by IDs
 */
const getMonsterIdsProxyRoutes = ["/proxy/monstersById", "/proxy/monsters/ids"];
app.options(getMonsterIdsProxyRoutes, cors(), (_req: Request, res: Response) => res.status(200).send());
app.post(getMonsterIdsProxyRoutes, cors(), express.json(), (req: Request, res: Response) => {
  // check for cobalt token
  const cobalt: string = req.body.cobalt;
  if (!cobalt || cobalt == "") return res.json({ success: false, message: "No cobalt token" });

  const ids: string[] = req.body.ids;
  if (!ids) {
    return res.json({
      success: false,
      message: "Please supply required monster ids.",
    });
  }

  const hash = crypto.createHash("sha256");
  hash.update(cobalt + ids.join("-"));
  const cacheId = hash.digest("hex");

  getBearerToken(cacheId, cobalt).then((token: string | null) => {
    if (!token) return res.json({ success: false, message: "You must supply a valid cobalt value." });

    extractMonstersById(cacheId, ids)
      .then((data: any) => {
        return res
          .status(200)
          .json({ success: true, message: "All available monsters successfully received.", data: data });
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error === "Forbidden") {
          return res.json({ success: false, message: "You must supply a valid cobalt value." });
        }
        return res.json({ success: false, message: "Unknown error during monster loading: " + error });
      });
  });
});

app.options("/proxy/campaigns", cors(), (_req: Request, res: Response) => res.status(200).send());
app.post("/proxy/campaigns", cors(), express.json(), (req: Request, res: Response) => {
  if (!req.body.cobalt || req.body.cobalt == "") return res.json({ success: false, message: "No cobalt token" });

  const cacheId = getCacheId(req.body.cobalt);
  // Use require workaround to access getCampaigns
  const getCampaigns = (require("./campaign.js") as any).getCampaigns;

  getBearerToken(cacheId, req.body.cobalt).then((token: string | null) => {
    if (!token) return res.json({ success: false, message: "You must supply a valid cobalt value." });
    getCampaigns(req.body.cobalt, cacheId)
      .then((data: unknown) => {
        return res
          .status(200)
          .json({ success: true, message: "All available campaigns successfully received.", data: data });
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error === "Forbidden") {
          return res.json({ success: false, message: "You must supply a valid bearer token." });
        }
        return res.json({ success: false, message: "Unknown error during campaign get: " + error });
      });
  });
});

/**
 * GET: /proxy/spells/:id?level=...&campaign=...&cobalt=...
 * Returns spells for a class (used by FoundryVTT module)
 */
app.get("/proxy/spells/:id", cors(), async (req: Request, res: Response) => {
  const classId = req.params.id;
  const spellLevelAccess = parseInt(req.query.level as string) || 1;
  const campaignId = req.query.campaign as string | undefined;
  const cobalt = (req.query.cobalt as string) || process.env.COBALT_COOKIE;
  if (!cobalt) return res.json({ success: false, message: "No cobalt token provided" });
  const cacheId = getCacheId(cobalt);
  const classInfo = {
    name: `Class ${classId}`,
    id: parseInt(classId),
    spellLevelAccess,
    campaignId
  };
  try {
    const data = await spells.extractSpells(classInfo, cobalt);
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, message: String(err) });
  }
});

/**
 * GET: /proxy/spells/always-prepared/:id?level=...&campaign=...&spellLists=... (comma separated)
 * Returns always prepared spells for a class
 */
app.get("/proxy/spells/always-prepared/:id", cors(), async (req: Request, res: Response) => {
  const classId = req.params.id;
  const spellLevelAccess = parseInt(req.query.level as string) || 1;
  const campaignId = req.query.campaign as string | undefined;
  const spellLists = (req.query.spellLists as string || '').split(',').filter(Boolean);
  const classInfo = {
    name: `Class ${classId}`,
    id: parseInt(classId),
    spellLevelAccess,
    campaignId
  };
  try {
    const data = await spells.extractAlwaysPreparedSpells(classInfo, spellLists);
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, message: String(err) });
  }
});

/**
 * GET: /proxy/spells/always-known/:id?level=...&campaign=...&background=...&spellLists=...&cantrips=...&cobalt=...
 * Returns always known spells for a class
 */
app.get("/proxy/spells/always-known/:id", cors(), async (req: Request, res: Response) => {
  const classId = req.params.id;
  const spellLevelAccess = parseInt(req.query.level as string) || 1;
  const campaignId = req.query.campaign as string | undefined;
  const backgroundId = req.query.background ? parseInt(req.query.background as string) : undefined;
  const spellLists = (req.query.spellLists as string || '').split(',').filter(Boolean);
  const cantrips = req.query.cantrips !== 'false';
  const cobalt = (req.query.cobalt as string) || process.env.COBALT_COOKIE;
  if (!cobalt) return res.json({ success: false, message: "No cobalt token provided" });
  const classInfo = {
    name: `Class ${classId}`,
    id: parseInt(classId),
    spellLevelAccess,
    campaignId,
    backgroundId
  };
  try {
    const data = await spells.extractAlwaysKnownSpells(classInfo, cobalt, cantrips, spellLists);
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: false, message: String(err) });
  }
});

app.use(classRoute);
app.use(featsRoute);
app.use(backgroundsRoute);
app.use(racesRoute);
app.use(rulesRoute);
app.use(adventuresRoute);

app.listen(port, () => {
  console.log(`DDB Proxy started on :${port}`);
});
