import fetch, { Response as FetchResponse } from "node-fetch"; // Added FetchResponse
import CONFIG from "./config"; // Removed .js
import * as authentication from "./auth"; // Removed .js
import express, { Router, Request, Response, NextFunction } from "express"; // Added Router, Request, Response, NextFunction

const router: Router = express.Router();

interface ValidatedData {
    success: boolean;
    message?: string;
    data?: any; // Consider defining a more specific type for data if possible
}

const isValidData = (data: any): data is ValidatedData => { // Type guard
    return typeof data === 'object' && data !== null && typeof data.success === 'boolean';
};

interface ClassOption {
    sources?: { sourceId: number }[];
    // Add other properties of class options here
}

interface RacialTraitOption {
    sources?: { sourceId: number }[];
    // Add other properties of racial trait options here
}

interface CharacterData {
    // Define the structure of character data
    classOptions?: ClassOption[];
    originOptions?: RacialTraitOption[];
    // Add other properties of character data
}


const extractClassOptions = (cobaltId: string, optionIds: string[] = [], campaignId: string | null = null): Promise<ClassOption[]> => {
    console.log(optionIds);
    return new Promise((resolve, reject) => {
        console.log(`Retrieving class options for ${cobaltId}`);
        const url = CONFIG.urls.classOptionsAPI();
        const body = JSON.stringify({
            "campaignId": campaignId,
            "sharingSetting": 2,
            "ids": optionIds,
        });
        const auth = authentication.CACHE_AUTH.exists(cobaltId);
        let headers: Record<string, string> = {}; // Typed headers
        if (auth && auth.data) {
            headers["Authorization"] = String(auth.data); // Ensure string
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = body.length.toString();
        }
        const options = {
            method: "POST",
            headers: headers,
            body: body
        };
        fetch(url, options)
            .then(res => res.json())
            .then((json: any) => { // Typed json
            if (isValidData(json) && json.data && json.data.definitionData) {
                const filteredItems = json.data.definitionData.filter((option: ClassOption) => option.sources && (option.sources.length === 0 || option.sources.some((source) => source.sourceId != 39)));
                resolve(filteredItems);
            }
            else {
                const message = isValidData(json) && json.message ? json.message : "Received no valid class option data";
                console.log(message);
                reject(new Error(message)); // Reject with an Error object
            }
        })
            .catch(error => {
            console.log("Error retrieving class options");
            console.log(error);
            reject(error);
        });
    });
};

const extractRacialTraitsOptions = (cobaltId: string, optionIds: string[] = [], campaignId: string | null = null): Promise<RacialTraitOption[]> => {
    console.log(optionIds);
    return new Promise((resolve, reject) => {
        console.log(`Retrieving origin options for ${cobaltId}`);
        const url = CONFIG.urls.racialTraitOptionsAPI();
        const body = JSON.stringify({
            "campaignId": campaignId,
            "sharingSetting": 2,
            "ids": optionIds,
        });
        const auth = authentication.CACHE_AUTH.exists(cobaltId);
        let headers: Record<string, string> = {}; // Typed headers
        if (auth && auth.data) {
            headers["Authorization"] = String(auth.data); // Ensure string
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = body.length.toString();
        }
        const options = {
            method: "POST",
            headers: headers,
            body: body
        };
        fetch(url, options)
            .then(res => res.json())
            .then((json: any) => { // Typed json
            if (isValidData(json) && json.data && json.data.definitionData) {
                const filteredItems = json.data.definitionData.filter((option: RacialTraitOption) => option.sources && (option.sources.length === 0 || option.sources.some((source) => source.sourceId != 39)));
                resolve(filteredItems);
            }
            else {
                const message = isValidData(json) && json.message ? json.message : "Received no valid origin option data";
                console.log(message);
                reject(new Error(message)); // Reject with an Error object
            }
        })
            .catch(error => {
            console.log("Error retrieving origin options");
            console.log(error);
            reject(error);
        });
    });
};

const checkStatus = (res: FetchResponse): FetchResponse => { // Typed res
    if (res.ok) {
        // res.status >= 200 && res.status < 300
        return res;
    }
    else {
        throw new Error(res.statusText); // Throw an Error object
    }
};

const extractCharacterData = (cobaltId: string, characterId: string): Promise<CharacterData> => {
    return new Promise((resolve, reject) => {
        console.log(`Retrieving character id ${characterId}`);
        const auth = authentication.CACHE_AUTH.exists(cobaltId);
        const headers = (auth && auth.data) ? { headers: { "Authorization": `Bearer ${auth.data}` } } : {};
        const characterUrl = CONFIG.urls.characterUrl(characterId);
        fetch(characterUrl, headers)
            .then(checkStatus)
            .then(res => res.json())
            .then((json: any) => { // Typed json
            if (isValidData(json) && json.data) {
                resolve(json.data as CharacterData); // Type assertion
            }
            else {
                const message = isValidData(json) && json.message ? json.message : "Received no valid character data";
                reject(new Error(message)); // Reject with an Error object
            }
        })
            .catch(error => {
            console.log(`loadCharacterData(${characterId}): ${error}`);
            reject(error);
        });
    });
};

const getOptionalClassFeatures = (data: CharacterData, optionIds: string[], campaignId: string | null, cobaltId: string): Promise<CharacterData> => {
    const cacheId = authentication.CACHE_AUTH.exists(cobaltId);
    return new Promise((resolve, reject) => { // Added reject
        if (cacheId && cacheId.data) { // Check if cacheId.data exists
            console.log("CLASS Optional Features:");
            extractClassOptions(cobaltId, optionIds, campaignId)
                .then(options => {
                data.classOptions = options;
                resolve(data);
            })
            .catch(error => reject(error)); // Propagate error
        }
        else {
            resolve(data);
        }
    });
};

const getOptionalOrigins = (data: CharacterData, optionIds: string[], campaignId: string | null, cobaltId: string): Promise<CharacterData> => {
    const cacheId = authentication.CACHE_AUTH.exists(cobaltId);
    return new Promise((resolve, reject) => { // Added reject
        if (cacheId && cacheId.data) { // Check if cacheId.data exists
            console.log("ORIGIN Optional Features:");
            extractRacialTraitsOptions(cobaltId, optionIds, campaignId)
                .then(options => {
                data.originOptions = options;
                resolve(data);
            })
            .catch(error => reject(error)); // Propagate error
        }
        else {
            resolve(data);
        }
    });
};

// Example route (assuming you'll add routes to this router)
router.get('/:characterId', async (req: Request, res: Response, next: NextFunction) => {
    const { characterId } = req.params;
    const cobaltId = req.headers['x-cobalt-id'] as string; // Assuming cobaltId is passed in headers

    if (!cobaltId) {
        return res.status(400).json({ error: 'Missing x-cobalt-id header' });
    }

    try {
        const charData = await extractCharacterData(cobaltId, characterId);
        // Potentially fetch optional features if needed, e.g., based on query params or charData
        // const finalData = await getOptionalClassFeatures(charData, [], null, cobaltId);
        // const evenMoreFinalData = await getOptionalOrigins(finalData, [], null, cobaltId);
        res.json(charData);
    } catch (error) {
        next(error);
    }
});


export { extractClassOptions, extractCharacterData, getOptionalClassFeatures, getOptionalOrigins };
export default router;
