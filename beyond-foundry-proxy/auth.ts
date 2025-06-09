import crypto from "crypto";
import Cache from "./cache.js";
import fetch from "node-fetch";
import CONFIG from "./config.js";

const CACHE_AUTH = new Cache("AUTH", 0.08);

function isJSON(str: string): boolean {
  try {
    return (JSON.parse(str) && !!str);
  } catch (e) {
    return false;
  }
}

function getBearerToken(id: string, cobalt: string): Promise<string | null> {
  // If no cobalt provided, try to use the baked-in environment variable
  const effectiveCobalt = cobalt && cobalt !== "" ? cobalt : process.env.COBALT_COOKIE;
  return new Promise((resolve) => {
    if (!effectiveCobalt || effectiveCobalt === "") {
      console.log("NO COBALT TOKEN (not provided and not set in env)");
      resolve(null);
      return;
    }
    if (!isJSON(`{ "cobalt": "${effectiveCobalt}" }`)) {
      console.log(`Invalid token for ${id}`);
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
      .then((response) => response.json())
      .then((data) => {
        if (!data.token || !data.token.length) resolve(null);
        CACHE_AUTH.add(id, data.token);
        resolve(data.token);
      });
  });
}

function getCacheId(value: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(value);
  const cacheId = hash.digest("hex");
  return cacheId;
}

export { CACHE_AUTH, getBearerToken, getCacheId };
