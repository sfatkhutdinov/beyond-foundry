import fetch from "node-fetch";
import CONFIG from "./config";
import * as authentication from "./auth";
import express, { Router, Request, Response } from "express";

const router: Router = express.Router();
router.use(express.json());
console.log('[DEBUG] Proxy spells.ts loaded');

interface SpellData {
    success: boolean;
    data?: any[];
    message?: string;
}

interface SpellDefinition {
    level: number;
    sources?: any[];
    isHomebrew?: boolean;
    id?: number;
}

interface Spell {
    definition: SpellDefinition;
}

interface ClassInfo {
    name: string;
    id: number;
    spellLevelAccess: number;
    campaignId?: string;
    characterClassId?: number;
    spellListIds?: number[];
}

const isValidData = (data: SpellData): boolean => {
    return data.success === true;
};

const removeCantrips = (data: Spell[]): Spell[] => {
    const filteredSpellList = data.filter((spell: Spell) => {
        return spell.definition.level > 0;
    });
    return filteredSpellList;
};

const filterByLevel = (data: Spell[], spellLevelAccess: number): Spell[] => {
    const filteredSpellList = data.filter((spell: Spell) => {
        return spell.definition.level <= spellLevelAccess;
    });
    return filteredSpellList;
};

const extractSpells = (classInfo: ClassInfo, cobaltId: string): Promise<Spell[]> => {
    return new Promise((resolve, reject) => {
        const { name, id, spellLevelAccess } = classInfo;
        console.log(`Retrieving all spells for ${name} ${cobaltId} (${id}) at spell level ${spellLevelAccess}`);
        const url = CONFIG.urls.spellsAPI(id, 20, classInfo.campaignId);
        console.log(`[extractSpells] Generated URL: ${url}`);
        const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
        let headers: any = {
            'Content-Type': 'application/json'
        };
        if (cacheResult && cacheResult.data !== null) {
            headers["Authorization"] = `Bearer ${cacheResult.data}`;
            console.log(`[extractSpells] Using cached token for authorization`);
        } else {
            console.log(`[extractSpells] No cached token found for cobaltId: ${cobaltId}`);
        }
        const fetchOptions = { headers };
        console.log(`[extractSpells] Making fetch request to D&D Beyond API with options:`, fetchOptions);
        fetch(url, fetchOptions)
            .then((res) => {
                console.log(`[extractSpells] API Response status: ${res.status}`);
                return res.json();
            })
            .then((json) => {
                console.log(`[extractSpells] API Response received, processing...`);
                console.log(`[extractSpells] Response structure:`, Object.keys(json));
                if (json.data) {
                    console.log(`[extractSpells] Found ${json.data.length} items in response`);
                } else {
                    console.log(`[extractSpells] No 'data' property in response`);
                }
            // console.log(json.data.map(sp => sp.definition.name).join(", "));
            if (isValidData(json)) {
                const filteredSpells = filterByLevel(json.data, spellLevelAccess).filter((item) => {
                    if (item.definition.sources && item.definition.sources.some((source) => source.sourceId === 39)) {
                        return false;
                    }
                    else {
                        return true;
                    }
                });
                console.log(`Adding ${filteredSpells.length} of ${json.data.length} spells available to a lvl${spellLevelAccess} ${classInfo.name} caster...`);
                resolve(filteredSpells);
            }
            else {
                console.log("Received no valid spell data, instead:" + json.message);
                reject(json.message);
            }
        })
            .catch((err) => {
                console.log(`[extractSpells] Error in fetch request:`, err);
                if (err instanceof Error) {
                    console.log(`[extractSpells] Error message: ${err.message}`);
                    console.log(`[extractSpells] Error stack: ${err.stack}`);
                    reject(err.message);
                }
                else {
                    console.log(`[extractSpells] Non-Error object:`, err);
                    reject(String(err));
                }
            });
    });
};
const extractAlwaysPreparedSpells = (classInfo, spellListIds = []) => {
    return new Promise((resolve, reject) => {
        const { name, id, spellLevelAccess } = classInfo;
        console.log(`Retrieving always prepared spells for ${name} (${id}) at spell level ${spellLevelAccess}`);
        const url = CONFIG.urls.alwaysPreparedSpells(id, 20, classInfo.campaignId, spellListIds);
        fetch(url)
            .then(res => res.json())
            .then(json => {
            // console.log(json.data.map(sp => sp.definition.name).join(", "));
            if (isValidData(json)) {
                const filteredSpells = filterByLevel(json.data, spellLevelAccess).filter((item) => {
                    if (item.definition.sources && item.definition.sources.some((source) => source.sourceId === 39)) {
                        return false;
                    }
                    else {
                        return true;
                    }
                });
                console.log(`Adding ${filteredSpells.length} of ${json.data.length} allways prepared spells available to a lvl${spellLevelAccess} ${classInfo.name} caster...`);
                resolve(filteredSpells);
            }
            else {
                console.log("Received no valid spell data, instead:" + json.message);
                reject(json.message);
            }
        })
            .catch((error) => {
            if (error instanceof Error) {
                console.log("Error retrieving spells");
                console.log(error.message);
                reject(error.message);
            }
            else {
                console.log("Error retrieving spells");
                console.log(String(error));
                reject(String(error));
            }
        });
    });
};
const extractAlwaysKnownSpells = (classInfo, cobaltId, cantrips, spellListIds = []) => {
    console.log(`SPELL IDS ${spellListIds}`);
    return new Promise((resolve, reject) => {
        const { name, id, spellLevelAccess } = classInfo;
        console.log(`Retrieving all known spells for ${name} (${id}) at spell level ${spellLevelAccess}`);
        const url = CONFIG.urls.alwaysKnownSpells(id, 20, classInfo.campaignId, spellListIds, classInfo.backgroundId);
        console.log(url);
        // console.log(`Bearer ${authentication.CACHE_AUTH.exists(cobaltId).data}`);
        const cacheResult2 = authentication.CACHE_AUTH.exists(cobaltId);
        let headers2 = {};
        if (cacheResult2 && cacheResult2.data !== null) {
            headers2 = { headers: { "Authorization": `Bearer ${cacheResult2.data}` } };
        }
        fetch(url, headers2)
            .then(res => res.json())
            .then(json => {
            // console.log(json.data.map(sp => sp.definition.name).join(", "));
            if (isValidData(json)) {
                const noCantripSpells = (cantrips) ? json.data : removeCantrips(json.data);
                const filteredSpells = filterByLevel(noCantripSpells, spellLevelAccess).filter((item) => {
                    if (item.definition.sources && item.definition.sources.some((source) => source.sourceId === 39)) {
                        return false;
                    }
                    else {
                        return true;
                    }
                });
                console.log(`Adding ${filteredSpells.length} of ${json.data.length} always known spells available to a lvl${spellLevelAccess} ${classInfo.name} caster...`);
                resolve(filteredSpells);
            }
            else {
                console.log("Received no valid spell data, instead:" + json.message);
                reject(json.message);
            }
        })
            .catch((error) => {
            if (error instanceof Error) {
                console.log("Error retrieving spells");
                console.log(error.message);
                reject(error.message);
            }
            else {
                console.log("Error retrieving spells");
                console.log(String(error));
                reject(String(error));
            }
        });
    });
};
const extractCasterLevel = (cls, isMultiClassing) => {
    let casterLevel = 0;
    if (isMultiClassing) {
        // get the casting level if the character is a multiclassed spellcaster
        if (cls.definition.spellRules && cls.definition.spellRules.multiClassSpellSlotDivisor) {
            casterLevel = Math.floor(cls.level / cls.definition.spellRules.multiClassSpellSlotDivisor);
        }
    }
    else {
        casterLevel = cls.level;
    }
    return casterLevel;
};
const extractSpellLevelAccess = (cls, casterLevel) => {
    const spellSlots = cls.definition.spellRules.levelSpellSlots[casterLevel];
    const spellLevelAccess = spellSlots.reduce((count, numSpellSlots) => (numSpellSlots > 0 ? count + 1 : count), 0);
    return spellLevelAccess;
};
const extractClassIds = (data) => {
    const isMultiClassing = data.character.classes.length > 1;
    return data.character.classes.map((characterClass) => {
        return {
            characterClassId: characterClass.id,
            backgroundId: data.character.background.definition && data.character.background.definition.id ? data.character.background.definition.id : null,
            name: characterClass.subclassDefinition && characterClass.subclassDefinition.name
                ? characterClass.definition.name + ` (${characterClass.subclassDefinition.name})`
                : characterClass.definition.name,
            id: characterClass.subclassDefinition && characterClass.subclassDefinition.id
                ? characterClass.subclassDefinition.id
                : characterClass.definition.id,
            level: extractCasterLevel(characterClass, isMultiClassing),
            spellLevelAccess: extractSpellLevelAccess(characterClass, extractCasterLevel(characterClass, isMultiClassing)),
            spells: [],
            classId: characterClass.definition.id,
            subclassId: characterClass.subclassDefinition ? characterClass.subclassDefinition.id : null,
            characterClass: characterClass.definition.name,
            characterSubclass: characterClass.subclassDefinition ? characterClass.subclassDefinition.name : null,
            characterId: data.character.id,
            campaignId: (data.character.campaign) ? data.character.campaign.id : null,
            spellListIds: data.classOptions
                ? data.classOptions
                    .filter((option) => option.spellListIds)
                    .filter((option) => option.spellListIds && option.spellListIds.length > 0
                    && (option.classId == characterClass.definition.id
                        || (characterClass.subclassDefinition && characterClass.subclassDefinition.id == option.classId)))
                    .map((option) => {
                    return option.spellListIds;
                })
                    .flat()
                : [],
        };
    });
};
async function extractExtraSpellsForClass(klassInfo, cobaltId) {
    const cobaltToken = authentication.CACHE_AUTH.exists(cobaltId);
    const knowSpellsClasses = ["Druid", "Cleric", "Paladin", "Artificer"];
    console.log("[ ALWAYS KNOWN SPELLS =========================================== ]");
    const alwaysKnownSpells = cobaltToken && knowSpellsClasses.includes(klassInfo.characterClass)
        ? await extractAlwaysKnownSpells(klassInfo, cobaltId, true, klassInfo.spellListIds)
        : [];
    console.log("[ ALWAYS PREPARED SPELLS ======================================== ]");
    const alwaysPreparedSpells = await extractAlwaysPreparedSpells(klassInfo, klassInfo.spellListIds);
    return {
        alwaysKnownSpells,
        alwaysPreparedSpells,
    };
}
// this is used by the character loader to load class spells
const loadSpellAdditions = (classInfo, cobaltId) => {
    return new Promise((resolve, reject) => {
        Promise.allSettled(classInfo.map((info) => {
            return extractExtraSpellsForClass(info, cobaltId);
        }))
            .then((results) => {
            // combining all resolved results
            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    classInfo[index].spells = result.value.alwaysKnownSpells.concat(result.value.alwaysPreparedSpells);
                }
            });
            resolve(classInfo);
        })
            .catch((error) => reject(error));
    });
};
// this is used by the spell muncher to munch all class spells
const loadSpells = (classInfo, cobaltToken, cantrips) => {
    return new Promise((resolve, reject) => {
        Promise.allSettled(classInfo.map((info) => {
            const knownSpells = extractAlwaysKnownSpells(info, cobaltToken, cantrips);
            const otherSpells = extractSpells(info, cobaltToken); // for cantrips etc
            return Promise.all([knownSpells, otherSpells]);
        }))
            .then((results) => {
            // combining all resolved results
            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    classInfo[index].spells = result.value.flat();
                }
            });
            resolve(classInfo);
        })
            .catch((error) => reject(error));
    });
};
function getSpellAdditions(data, cacheId) {
    return new Promise((resolve) => {
        const classInfo = extractClassIds(data);
        console.log("CLASS INFORMATION FOR SPELL ADDITIONS:");
        console.log(classInfo);
        loadSpellAdditions(classInfo, cacheId).then((classInfo) => {
            // add the always prepared spells to the class' spell list
            data.character.classSpells = data.character.classSpells.map((classSpells) => {
                // find always prepared spells in the results
                const additionalSpells = (classInfo as any[])?.find((classInfo) => classInfo.characterClassId === classSpells.characterClassId);
                if (additionalSpells) {
                    additionalSpells.spells.forEach((spell) => {
                        console.log("Adding spells to character...");
                        console.log(" + Adding spell to character: " + spell.definition.name);
                        classSpells.spells.push(spell);
                    });
                }
                return classSpells;
            });
            console.log("******** ADDITIONAL SPELL LOAD FINISHED ***********");
            resolve(data);
        });
    });
}
function filterHomebrew(data, includeHomebrew) {
    if (includeHomebrew) {
        return data;
    }
    else {
        data.character.classSpells = data.character.classSpells.map((classSpells) => {
            classSpells.spells = classSpells.spells.filter((spell) => !spell.definition.isHomebrew);
            return classSpells;
        });
        data.character.spells.class = data.character.spells.class.filter((spell) => !spell.definition || !spell.definition.isHomebrew);
        data.character.spells.race = data.character.spells.race.filter((spell) => !spell.definition || !spell.definition.isHomebrew);
        data.character.spells.feat = data.character.spells.feat.filter((spell) => !spell.definition || !spell.definition.isHomebrew);
        data.character.spells.item = data.character.spells.item.filter((spell) => !spell.definition || !spell.definition.isHomebrew);
        return data;
    }
}
// Placeholder for actual spell data fetcher
async function getSpells({ cobalt, classFilter, level, name }) {
    // TODO: Implement real fetch/scrape logic
    return [
        // Example spell object
        { id: 1, name: "Magic Missile", level: 1, classes: ["wizard"] },
    ];
}
// POST /spells (bulk)
router.post("/spells", async (req, res) => {
    console.log('[DEBUG] /proxy/spells POST handler reached');
    try {
        const { cobalt } = req.body;
        if (!cobalt) {
            return res.status(400).json({ success: false, message: "Missing cobalt token" });
        }
        // Use the robust internal API approach: fetch all spells for all classes
        const classMap = CONFIG.classMap || [];
        const allSpells = [];
        for (const classInfo of classMap) {
            // Use max spell level for each class (20)
            const classData = {
                name: classInfo.name,
                id: classInfo.id,
                spellLevelAccess: 9, // max spell level
                campaignId: null
            };
            try {
                console.log(`[DEBUG] Fetching spells for class: ${classData.name} (id: ${classData.id}) with cobalt: ${cobalt}`);
                const spells = await extractSpells(classData, cobalt);
                console.log(`[DEBUG] Got ${spells.length} spells for class: ${classData.name}`);
                for (const spell of spells) {
                    // Avoid duplicates by spell id
                    if (!allSpells.some(s => s.definition && spell.definition && s.definition.id === spell.definition.id)) {
                        allSpells.push(spell);
                        console.log(`[DEBUG] Added spell: ${(spell.definition as any)?.name || (spell as any).name} (id: ${(spell.definition as any)?.id || (spell as any).id})`);
                    } else {
                        console.log(`[DEBUG] Duplicate spell skipped: ${(spell.definition as any)?.name || (spell as any).name}`);
                    }
                }
            } catch (err) {
                // Log and continue with other classes
                console.warn(`[ERROR] Failed to fetch spells for class ${classInfo.name}: ${err}`);
            }
        }
        console.log(`[DEBUG] Total unique spells fetched: ${allSpells.length}`);
        return res.json({ success: true, data: allSpells });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[FATAL] Spell import failed: ${message}`);
        return res.status(500).json({ success: false, message });
    }
});
// POST /class/spells
router.post('/class/spells', async (req, res) => {
    const { className, cobaltToken: tokenFromRequest } = req.body;
    console.log('[Spells Route /class/spells] Received request for class:', className);

    if (!className) {
        console.warn('[Spells Route /class/spells] Missing className in request body');
        return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    let cobaltToken = tokenFromRequest;
    let cobaltId;

    if (tokenFromRequest) {
        console.log(`[Spells Route /class/spells] Token from request (length: ${tokenFromRequest?.length}):`, tokenFromRequest?.substring(0, 50) + '...');
        // Fix: CACHE_AUTH.exists() returns an object, not a string
        const existingCache = authentication.CACHE_AUTH.exists(tokenFromRequest);
        console.log(`[Spells Route /class/spells] Cache lookup result:`, existingCache ? 'found' : 'not found');
        if (existingCache) {
            cobaltId = existingCache.id;
            console.log(`[Spells Route /class/spells] Using cached cobaltId: ${cobaltId}`);
        } else {
            cobaltId = tokenFromRequest; // Use token itself as cobaltId
            console.log(`[Spells Route /class/spells] Using token as cobaltId: ${cobaltId?.substring(0, 20)}...`);
        }
        console.log(`[Spells Route /class/spells] Final cobaltId: ${cobaltId}`);
        // Ensure this token is cached if it was sent directly
        if (!authentication.CACHE_AUTH.get(cobaltId)) {
            console.log(`[Spells Route /class/spells] Caching token from request for cobaltId: ${cobaltId}`);
            authentication.CACHE_AUTH.set(cobaltId, tokenFromRequest);
        }
    } else {
        console.warn('[Spells Route /class/spells] No cobaltToken in request body. This route expects it.');
        // Attempt to retrieve cobaltId from session/cookie if applicable (not standard for this app's /auth)
        // For now, we will rely on the token being passed in the body as per the script's implementation.
        // If your /auth sets a cookie that this part of the app should read, that logic would go here.
    }

    // Re-check cache with the derived cobaltId
    if (cobaltId) {
        cobaltToken = authentication.CACHE_AUTH.get(cobaltId);
        if (cobaltToken) {
            console.log(`[Spells Route /class/spells] Successfully retrieved token from cache for cobaltId: ${cobaltId}`);
        } else {
            console.warn(`[Spells Route /class/spells] Token not found in cache for cobaltId: ${cobaltId}, even after explicit set from request or if it was expected from /auth. This is the likely cause of 'No cobalt token' issues if auth was successful.`);
            // Fallback to tokenFromRequest if cache misses but token was in request
            if (tokenFromRequest) {
                console.log('[Spells Route /class/spells] Using token directly from request as fallback.');
                cobaltToken = tokenFromRequest;
            } else {
                return res.status(401).json({ success: false, message: 'No cobalt token found in cache or request after auth.' });
            }
        }
    } else if (!tokenFromRequest) {
        // This case means no token in request and no way to derive cobaltId to check cache.
        console.error('[Spells Route /class/spells] Critical: No token in request and no cobaltId could be generated.');
        return res.status(401).json({ success: false, message: 'Cobalt token is required and was not provided.' });
    }

    // Final check if we have a token to use
    if (!cobaltToken) {
        console.error('[Spells Route /class/spells] Failed to resolve cobaltToken before calling dndBeyondService.');
        return res.status(401).json({ success: false, message: 'No cobalt token available after all checks.' });
    }

    try {
        console.log(`[Spells Route /class/spells] Fetching spells for class '${className}' using resolved token.`);
        
        // Find the class info from CONFIG.classMap
        const classMapEntry = CONFIG.classMap.find(cls => cls.name.toLowerCase() === className.toLowerCase());
        if (!classMapEntry) {
            console.error(`[Spells Route /class/spells] Class '${className}' not found in CONFIG.classMap`);
            return res.status(400).json({ 
                success: false, 
                message: `Class '${className}' is not supported. Available classes: ${CONFIG.classMap.map(c => c.name).join(', ')}` 
            });
        }
        
        // Create ClassInfo object for extractSpells
        const classInfo: ClassInfo = {
            name: classMapEntry.name,
            id: classMapEntry.id,
            spellLevelAccess: 9, // max spell level
            campaignId: null
        };
        
        console.log(`[Spells Route /class/spells] Found class mapping: ${classInfo.name} (id: ${classInfo.id})`);
        const spells = await extractSpells(classInfo, cobaltId);
        console.log(`[Spells Route /class/spells] Successfully retrieved ${spells.length} spells for ${className}`);
        res.json({ success: true, data: spells });
    } catch (error) {
        console.error('[Spells Route /class/spells] Error fetching spells by class:', error.message, error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
});
export default router;
/* global console */
