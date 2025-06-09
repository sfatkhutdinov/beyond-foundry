import fetch from "node-fetch";
import CONFIG from "./config.js";
import Cache from "./cache.js";

const CACHE_CONFIG = new Cache("CONFIG", 1);

const getConfig = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    console.log("Retrieving ddb config");

    const cache = CACHE_CONFIG.exists("DDB_CONFIG");
    console.warn(cache);
    if (cache !== undefined) {
      console.log("CONFIG API CACHE_CONFIG HIT!");
      return resolve(cache.data);
    }

    const url = CONFIG.urls.configUrl;
    const options: import('node-fetch').RequestInit = {
      headers: {
        "User-Agent": "Foundry VTT Character Integrator",
        "Accept": "*/*",
      },
      method: "GET",
      redirect: "follow",
    };

    fetch(url, options)
      .then(res => res.json())
      .then(json => {
        if (json && json.sources) {
          CACHE_CONFIG.add("DDB_CONFIG", json);
          console.log(
            "Adding CACHE_CONFIG to cache..."
          );
          resolve(json);
        } else {
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

export { getConfig };
