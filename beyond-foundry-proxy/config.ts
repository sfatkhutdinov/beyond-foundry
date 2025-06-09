/**
 * CONFIG
 */

const CLASS_MAP = [
  { name: "Barbarian", spells: "SPELLS", id: 9 },
  { name: "Bard", spells: "SPELLS", id: 1 },
  { name: "Cleric", spells: "KNOWN", id: 2 },
  { name: "Druid", spells: "KNOWN", id: 3 },
  { name: "Fighter", spells: "SPELLS", id: 10 },
  { name: "Monk", spells: "SPELLS", id: 11 },
  { name: "Paladin", spells: "KNOWN", id: 4 },
  { name: "Ranger", spells: "SPELLS", id: 5 },
  { name: "Rogue", spells: "SPELLS", id: 12 },
  { name: "Sorcerer", spells: "SPELLS", id: 6 },
  { name: "Warlock", spells: "SPELLS", id: 7 },
  { name: "Wizard", spells: "SPELLS", id: 8 },
  { name: "Artificer", spells: "KNOWN", id: 252717 },
  { name: "Blood Hunter", spells: "SPELLS", id: 357975 },
  { name: "Graviturgy", spells: "SPELLS", id: 400661 },
  { name: "Chronurgy", spells: "SPELLS", id: 400659 },
];

const BAD_IMAGES: string[] = [
];

const CONFIG = {
  badImages: BAD_IMAGES,
  classMap: CLASS_MAP,
  urls: {
    authService: "https://auth-service.dndbeyond.com/v1/cobalt-token",
    baseUrl: "https://character-service.dndbeyond.com/character/v5",
    monsterBaseUrl: "https://monster-service.dndbeyond.com/v1/Monster",
    characterUrl: (characterId: string | number) =>
      `${CONFIG.urls.baseUrl}/character/${characterId}?includeCustomItems=true`,
    spellsAPI: (classId: string | number, classLevel: number, campaignId: string | number) => {
      let campaign = "";
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/spells?classId=${classId}&classLevel=${classLevel}&sharingSetting=2${campaign}`;
    },
    alwaysPreparedSpells: (classId: string | number, classLevel: number, campaignId: string | number, spellListIds: (string | number)[] = []) => {
      let campaign = "";
      let spellLists = "";
      spellListIds.forEach(list => spellLists += `&spellListIds[]=${list}`);
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/always-prepared-spells?classId=${classId}&classLevel=${classLevel}&sharingSetting=2${campaign}${spellLists}`;
    },
    alwaysKnownSpells: (classId: string | number, classLevel: number, campaignId: string | number, spellListIds: (string | number)[] = [], backgroundId: string | number | null = null) => {
      let campaign = "";
      let spellLists = "";
      let backgroundIdAdd = spellListIds.length === 0 && backgroundId ? `&backgroundId=${backgroundId}` : "";
      spellListIds.forEach((list) => (spellLists += `&spellListIds[]=${list}`));
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/always-known-spells?classId=${classId}&classLevel=${classLevel}&sharingSetting=2${campaign}${spellLists}${backgroundIdAdd}`;
    },
    itemsAPI: (campaignId: string | number) => {
      let campaign = "";
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/items?sharingSetting=2${campaign}`;
    },
    monstersAPI: (skip: number, take: number, search: string = "", homebrew: boolean = false, homebrewOnly: boolean = false, sources: (string | number)[] = []) => {
      let sourceSearch = sources.reduce((previous: string, current: string | number) => previous + `&sources=${current}`, "");
      let useHomebrew = (homebrew) ? "" : "&showHomebrew=f";
      if (homebrewOnly) {
        sourceSearch = "";
        useHomebrew = "&showHomebrew=t";
      }
      const url = `${CONFIG.urls.monsterBaseUrl}?search=${search}&skip=${skip}&take=${take}${useHomebrew}${sourceSearch}`;
      console.log(url);
      return url;
    },
    monsterIdsAPI: (ids: (string | number)[]) => {
      const idString = ids.reduce((previous: string, current: string | number) => {
        const pre = previous === "" ? "?ids=" : "&ids=";
        return previous + `${pre}${current}`;
      }, "");
      const url = `${CONFIG.urls.monsterBaseUrl}${idString}`;
      console.log(url);
      return url;
    },
    classOptionsAPI: () => {
      return `${CONFIG.urls.baseUrl}/game-data/class-feature/collection`;
    },
    racialTraitOptionsAPI: () => {
      return `${CONFIG.urls.baseUrl}/game-data/racial-trait/collection`;
    },
    campaignsAPI: "https://www.dndbeyond.com/api/campaign/stt/user-campaigns",
    configUrl: "https://www.dndbeyond.com/api/config/json",
  },

};

export default CONFIG;
