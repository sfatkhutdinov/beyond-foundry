import fetch from "node-fetch";
import CONFIG from "./config.js";
import * as authentication from "./auth.js";
import express from "express";
const router = express.Router();

const isValidData = (data: any): boolean => {
  return data.success === true;
};

const removeCantrips = (data: any[]): any[] => {
  const filteredSpellList = data.filter((spell: any) => {
    return spell.definition.level > 0;
  });
  return filteredSpellList;
};

const filterByLevel = (data: any[], spellLevelAccess: number): any[] => {
  const filteredSpellList = data.filter((spell: any) => {
    return spell.definition.level <= spellLevelAccess;
  });
  return filteredSpellList;
};

const extractSpells = (classInfo: any, cobaltId: string) => {
  return new Promise((resolve, reject) => {
    const { name, id, spellLevelAccess } = classInfo;

    console.log(`Retrieving all spells for ${name} ${cobaltId} (${id}) at spell level ${spellLevelAccess}`);

    const url = CONFIG.urls.spellsAPI(id, 20, classInfo.campaignId);
    const cacheResult = authentication.CACHE_AUTH.exists(cobaltId);
    let headers = {};
    if (cacheResult && cacheResult.data !== null) {
      headers = { headers: { "Authorization": `Bearer ${cacheResult.data}` } };
    }
    fetch(url, headers)
      .then((res: any) => res.json())
      .then((json: any) => {
        // console.log(json.data.map(sp => sp.definition.name).join(", "));
        if (isValidData(json)) {
          const filteredSpells = filterByLevel(json.data, spellLevelAccess).filter((item: any) => {
            if (item.definition.sources && item.definition.sources.some((source: any) => source.sourceId === 39)) {
              return false;
            } else {
              return true;
            }
          });
          console.log(
            `Adding ${filteredSpells.length} of ${json.data.length} spells available to a lvl${spellLevelAccess} ${classInfo.name} caster...`
          );
          resolve(filteredSpells);
        } else {
          console.log("Received no valid spell data, instead:" + json.message);
          reject(json.message);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          reject(err.message);
        } else {
          reject(String(err));
        }
      });
  });
};

const extractAlwaysPreparedSpells = (classInfo: any, spellListIds: string[] = []) => {
  return new Promise((resolve, reject) => {
    const { name, id, spellLevelAccess } = classInfo;
    console.log(`Retrieving always prepared spells for ${name} (${id}) at spell level ${spellLevelAccess}`);

    const url = CONFIG.urls.alwaysPreparedSpells(id, 20, classInfo.campaignId, spellListIds);
    fetch(url)
      .then(res => res.json())
      .then(json => {
        // console.log(json.data.map(sp => sp.definition.name).join(", "));
        if (isValidData(json)) {
          const filteredSpells = filterByLevel(json.data, spellLevelAccess).filter((item: any) => {
            if (item.definition.sources && item.definition.sources.some((source: any) => source.sourceId === 39)) {
              return false;
            } else {
              return true;
            }
          });
          console.log(
            `Adding ${filteredSpells.length} of ${json.data.length} allways prepared spells available to a lvl${spellLevelAccess} ${classInfo.name} caster...`
          );
          resolve(filteredSpells);
        } else {
          console.log("Received no valid spell data, instead:" + json.message);
          reject(json.message);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.log("Error retrieving spells");
          console.log(error.message);
          reject(error.message);
        } else {
          console.log("Error retrieving spells");
          console.log(String(error));
          reject(String(error));
        }
      });
  });
};

const extractAlwaysKnownSpells = (classInfo: any, cobaltId: string, cantrips: boolean, spellListIds: string[] = []) => {
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
          const filteredSpells = filterByLevel(noCantripSpells, spellLevelAccess).filter((item: any) => {
            if (item.definition.sources && item.definition.sources.some((source: any) => source.sourceId === 39)) {
              return false;
            } else {
              return true;
            }
          });
          console.log(
            `Adding ${filteredSpells.length} of ${json.data.length} always known spells available to a lvl${spellLevelAccess} ${classInfo.name} caster...`
          );
          resolve(filteredSpells);
        } else {
          console.log("Received no valid spell data, instead:" + json.message);
          reject(json.message);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.log("Error retrieving spells");
          console.log(error.message);
          reject(error.message);
        } else {
          console.log("Error retrieving spells");
          console.log(String(error));
          reject(String(error));
        }
      });
  });
};

const extractCasterLevel = (cls: any, isMultiClassing: boolean): number => {
  let casterLevel = 0;
  if (isMultiClassing) {
    // get the casting level if the character is a multiclassed spellcaster
    if (cls.definition.spellRules && cls.definition.spellRules.multiClassSpellSlotDivisor) {
      casterLevel = Math.floor(cls.level / cls.definition.spellRules.multiClassSpellSlotDivisor);
    }
  } else {
    casterLevel = cls.level;
  }

  return casterLevel;
};

const extractSpellLevelAccess = (cls: any, casterLevel: number): number => {
  const spellSlots = cls.definition.spellRules.levelSpellSlots[casterLevel];
  const spellLevelAccess = spellSlots.reduce((count: number, numSpellSlots: number) => (numSpellSlots > 0 ? count + 1 : count), 0);
  return spellLevelAccess;
};


const extractClassIds = (data: any) => {
  const isMultiClassing = data.character.classes.length > 1;
  return data.character.classes.map((characterClass: any) => {
    return {
      characterClassId: characterClass.id,
      backgroundId: data.character.background.definition && data.character.background.definition.id ? data.character.background.definition.id : null,
      name:
        characterClass.subclassDefinition && characterClass.subclassDefinition.name
          ? characterClass.definition.name + ` (${characterClass.subclassDefinition.name})`
          : characterClass.definition.name,
      id:
        characterClass.subclassDefinition && characterClass.subclassDefinition.id
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
          .filter((option: any) => option.spellListIds)
          .filter((option: any) =>
            option.spellListIds && option.spellListIds.length > 0
            && (option.classId == characterClass.definition.id
            || (characterClass.subclassDefinition && characterClass.subclassDefinition.id == option.classId))
          )
          .map((option: any) => {
            return option.spellListIds;
          })
          .flat()
        : [],
    };
  });
};

async function extractExtraSpellsForClass(klassInfo: any, cobaltId: string) {
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
const loadSpellAdditions = (classInfo: any, cobaltId: string) => {
  return new Promise((resolve, reject) => {
    Promise.allSettled(classInfo.map((info: any) => {
      return extractExtraSpellsForClass(info, cobaltId);
    }))
      .then((results: PromiseSettledResult<any>[]) => {
        // combining all resolved results
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            classInfo[index].spells = (result as PromiseFulfilledResult<any>).value.alwaysKnownSpells.concat((result as PromiseFulfilledResult<any>).value.alwaysPreparedSpells);
          }
        });
        resolve(classInfo);
      })
      .catch((error: unknown) => reject(error));
  });
};

// this is used by the spell muncher to munch all class spells
const loadSpells = (classInfo: any, cobaltToken: string, cantrips: boolean) => {
  return new Promise((resolve, reject) => {
    Promise.allSettled(classInfo.map((info: any) => {
      const knownSpells = extractAlwaysKnownSpells(info, cobaltToken, cantrips);
      const otherSpells = extractSpells(info, cobaltToken); // for cantrips etc
      return Promise.all([knownSpells, otherSpells]);
    }))
      .then((results: PromiseSettledResult<any>[]) => {
        // combining all resolved results
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            classInfo[index].spells = (result as PromiseFulfilledResult<any>).value.flat();
          }
        });
        resolve(classInfo);
      })
      .catch((error: unknown) => reject(error));
  });
};

function getSpellAdditions(data: any, cacheId: string) {
  return new Promise((resolve) => {
    const classInfo = extractClassIds(data);
    console.log("CLASS INFORMATION FOR SPELL ADDITIONS:");
    console.log(classInfo);

    loadSpellAdditions(classInfo, cacheId).then((classInfo: any) => {
      // add the always prepared spells to the class' spell list
      data.character.classSpells = data.character.classSpells.map((classSpells: any) => {
        // find always prepared spells in the results
        const additionalSpells = (classInfo as any[]).find((classInfo: any) => classInfo.characterClassId === classSpells.characterClassId);

        if (additionalSpells) {
          additionalSpells.spells.forEach((spell: any) => {
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

function filterHomebrew(data: any, includeHomebrew: boolean) {
  if (includeHomebrew) {
    return data;
  } else {
    data.character.classSpells = data.character.classSpells.map((classSpells: any) => {
      classSpells.spells = classSpells.spells.filter((spell: any) => !spell.definition.isHomebrew);
      return classSpells;
    });
    data.character.spells.class = data.character.spells.class.filter((spell: any) => !spell.definition || !spell.definition.isHomebrew);
    data.character.spells.race = data.character.spells.race.filter((spell: any) => !spell.definition || !spell.definition.isHomebrew);
    data.character.spells.feat = data.character.spells.feat.filter((spell: any) => !spell.definition || !spell.definition.isHomebrew);
    data.character.spells.item = data.character.spells.item.filter((spell: any) => !spell.definition || !spell.definition.isHomebrew);
    return data;
  }
}

// Placeholder for actual spell data fetcher
async function getSpells({ cobalt, classFilter, level, name }: { cobalt: string, classFilter?: string, level?: number, name?: string }) {
  // TODO: Implement real fetch/scrape logic
  return [
    // Example spell object
    { id: 1, name: "Magic Missile", level: 1, classes: ["wizard"] },
  ];
}

router.post("/proxy/spells", async (req, res) => {
  const { cobalt, class: classFilter, level, name } = req.body;
  if (!cobalt) {
    return res.json({ success: false, message: "Missing cobalt token" });
  }
  try {
    const data = await getSpells({ cobalt, classFilter, level, name });
    return res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.json({ success: false, message: err.message });
    } else {
      return res.json({ success: false, message: String(err) });
    }
  }
});

export default {
  // Export all needed functions and router as default for compatibility
  router,
  isValidData,
  removeCantrips,
  filterByLevel,
  extractSpells,
  extractAlwaysPreparedSpells,
  extractAlwaysKnownSpells,
  extractCasterLevel,
  extractSpellLevelAccess,
  extractClassIds,
  extractExtraSpellsForClass,
  loadSpellAdditions,
  loadSpells,
  getSpellAdditions,
  filterHomebrew,
};
