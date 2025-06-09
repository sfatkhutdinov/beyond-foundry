import fetch from "node-fetch";
import CONFIG from "./config.js";
import * as authentication from "./auth.js";
import express, { Request, Response } from "express";
const router = express.Router();

function getMonsterCount(cobaltId: string, searchTerm="", homebrew?: boolean, homebrewOnly?: boolean, sources?: string[]) {
  return new Promise<number>((resolve, reject) => {
    const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
    const headers = (cacheResult && cacheResult.data !== null) ? {headers: {"Authorization": `Bearer ${cacheResult.data}`}} : {};
    const url = CONFIG.urls.monstersAPI(0,1, searchTerm, homebrew, homebrewOnly, sources);
    fetch(url, headers)
      .then(res => res.json())
      .then(json => {
        resolve(json.pagination.total);
      })
      .catch(error => {
        console.log("Error retrieving monsters");
        console.log(error);
        reject(error);
      });
  });

}

function imageFiddleMonsters(monsters: any[]) {
  const imageFiddledMonsters = monsters.map((monster) => {
    const imageResizeRegEx = /\/thumbnails\/(\d*)\/(\d*)\/(\d*)\/(\d*)\/(\d*)\.(jpg|png|jpeg|webp|gif)/;
    if (monster.largeAvatarUrl) {
      const original = monster.largeAvatarUrl.replace(".com.com/", ".com/");
      monster.largeAvatarUrl = original.replace(imageResizeRegEx, "/thumbnails/$1/$2/1000/1000/$5.$6");
    }
    if (monster.basicAvatarUrl) {
      const original = monster.basicAvatarUrl.replace(".com.com/", ".com/");
      monster.basicAvatarUrl = original.replace(imageResizeRegEx, "/thumbnails/$1/$2/1000/1000/$5.$6");
    }
    return monster;
  });
  return imageFiddledMonsters;
}

const extractMonsters = (cobaltId: string, searchTerm="", homebrew?: boolean, homebrewOnly?: boolean, sources?: string[]) => {
  return new Promise<any[]>((resolve, reject) => {
    console.log(`Retrieving monsters for ${cobaltId}`);

    let monsters: any[] = [];
    const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
    const headers = (cacheResult && typeof cacheResult.data === 'string' && cacheResult.data !== null) ? {headers: {"Authorization": `Bearer ${cacheResult.data}`}} : {};
    let count = 0;
    // fetch 100 monsters at a time - api limit
    let take = 100;
    getMonsterCount(cobaltId, searchTerm, homebrew, homebrewOnly, sources).then(async (total) => {
      console.log(`Total monsters ${total}`);
      const hardTotal = total;
      while (total >= count && hardTotal >= count) {
        console.log(`Fetching monsters ${count}`);
        const url = CONFIG.urls.monstersAPI(count,take,searchTerm, homebrew, homebrewOnly, sources);
        await fetch(url, headers)
          .then(res => res.json())
          .then(json => {
            const availableMonsters = json.data.filter((monster: any) => {
              const isHomebrew = (homebrew) ? monster.isHomebrew === true : false;
              const available = monster.isReleased === true || isHomebrew;
              return available;
            });
            const imageFiddledMonsters = imageFiddleMonsters(availableMonsters);
            monsters.push(...imageFiddledMonsters);
          })
          .catch(error => {
            console.log(`Error retrieving monsters at ${count}`);
            console.log(error);
            reject(error);
          });
        count += take;
      }
      return monsters;
    }).then((data) => {
      console.log(`Monster count: ${data.length}.`);
      resolve(data);
    }).catch(error => {
      console.log("Error retrieving monsters");
      console.log(error);
      reject(error);
    });
  });
};


async function getIdCount(ids: any[]) {
  return new Promise<number>((resolve) => {
    resolve(ids.length);
  });
}

function extractMonstersById (cobaltId: string, ids: string[]) {
  return new Promise<any[]>((resolve, reject) => {
    console.log(`Retrieving monsters for ${cobaltId} and ${ids}`);

    let monsters: any[] = [];
    let count = 0;
    let take = 100;

    getIdCount(ids).then(async (total) => {
      const hardTotal = total;
      while (total >= count && hardTotal >= count) {
        const idSelection = ids.slice(count, count + take);
        const cacheResult2 = authentication.CACHE_AUTH.exists(cobaltId);
        const headers2 = (cacheResult2 && typeof cacheResult2.data === 'string' && cacheResult2.data !== null) ? {headers: {"Authorization": `Bearer ${cacheResult2.data}`}} : {};
        const url = CONFIG.urls.monsterIdsAPI(idSelection);
        await fetch(url, headers2)
          .then((res) => res.json())
          .then((json) => {
            // console.log(json.data);
            const availableMonsters = json.data.filter((monster: any) => monster.isReleased === true || monster.isHomebrew);
            const imageFiddledMonsters = imageFiddleMonsters(availableMonsters);
            monsters.push(...imageFiddledMonsters);
          })
          .catch((error) => {
            console.log("Error retrieving monsters by id");
            console.log(error);
            reject(error);
          });
        count += take;
      }
      return monsters;
    }).then((data) => {
      console.log(`Monster count: ${data.length}.`);
      resolve(data);
    });

  });
}

router.get('/monsters', async (req: Request, res: Response) => {
  const { cobaltId, searchTerm, homebrew, homebrewOnly, sources } = req.query;
  try {
    const monsters = await extractMonsters(cobaltId as string, searchTerm as string, homebrew as unknown as boolean, homebrewOnly as unknown as boolean, sources as unknown as string[]);
    res.json(monsters);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching monsters.' });
  }
});

router.get('/monstersById', async (req: Request, res: Response) => {
  const { cobaltId, ids } = req.query;
  try {
    let idArray: string[] = [];
    if (Array.isArray(ids)) {
      idArray = (ids as any[]).filter((id): id is string => typeof id === 'string');
    } else if (typeof ids === 'string') {
      idArray = [ids];
    }
    const monsters = await extractMonstersById(cobaltId as string, idArray);
    res.json(monsters);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching monsters by ID.' });
  }
});

export { extractMonsters, extractMonstersById };
export default router;
