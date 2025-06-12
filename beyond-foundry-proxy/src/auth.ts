// filepath: /Users/macbook-pro/Documents/Programming/beyond-foundry/beyond-foundry-proxy/src/auth.ts
import * as crypto from "crypto";
import * as fs from "fs";
import Cache from "./cache";
import fetch from "node-fetch";
import CONFIG from "./config";
import { Router, Request, Response, NextFunction } from 'express';

const router: Router = Router();

const CACHE_AUTH = new Cache("AUTH", 0.08);

function isJSON(str: string): boolean {
    try {
        // Ensure JSON.parse is actually working with a string that can be parsed
        // and that the original string was not empty or just whitespace.
        return str.trim() !== '' && typeof JSON.parse(str) === 'object';
    }
    catch (e) {
        return false;
    }
}

function getBearerToken(id: string, cobalt?: string): Promise<string | null> {
    const effectiveCobalt = cobalt && cobalt !== "" ? cobalt : process.env.COBALT_COOKIE;
    return new Promise((resolve) => {
        if (!effectiveCobalt || effectiveCobalt === "") {
            console.log("NO COBALT TOKEN (not provided and not set in env)");
            resolve(null);
            return;
        }
        
        // Add debug logging
        console.log('Attempting to get bearer token for id:', id);
        console.log('Using cobalt cookie:', effectiveCobalt.substring(0, 10) + '...');
        
        // Construct a valid JSON string for the check
        const jsonCheckString = `{ "cobalt": "${effectiveCobalt.replace(/"/g, '\\"')}" }`;
        if (!isJSON(jsonCheckString)) {
            console.log(`Invalid token format for ${id}`);
            resolve(null);
            return;
        }
        
        fetch(CONFIG.urls.authService, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `CobaltSession=${effectiveCobalt}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    console.error(`Auth service response not OK: ${response.status}`);
                    return response.text().then(text => {
                        console.error(`Auth service error body: ${text}`);
                        throw new Error(`Auth service request failed with status ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data: any) => {
                if (!data || !data.token || typeof data.token !== 'string' || data.token.length === 0) {
                    console.log("Invalid or empty token in auth service response");
                    resolve(null);
                    return;
                }
                console.log('Successfully obtained bearer token');
                CACHE_AUTH.add(id, data.token);
                resolve(data.token);
            }).catch(error => {
                console.error("Fetch error in getBearerToken:", error);
                resolve(null);
            });
    });
}

function getCacheId(value: string): string {
    const hash = crypto.createHash("sha256");
    hash.update(value);
    const cacheId = hash.digest("hex");
    return cacheId;
}

// Type the handler explicitly
const handleTokenRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, cobalt } = req.body;
    if (typeof id !== 'string' || !id) { // Added type check for id
        res.status(400).json({ error: 'Missing or invalid id in request body' });
        return;
    }
    try {
        const token = await getBearerToken(id, cobalt as string | undefined); // Ensure cobalt is passed correctly
        if (token) {
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Failed to retrieve bearer token' });
        }
    } catch (error) {
        console.error('Error getting bearer token:', error);
        next(error);
    }
};

router.post('/token', handleTokenRequest);

export { CACHE_AUTH, getBearerToken, getCacheId };
export default router;
//# sourceMappingURL=auth.js.map
