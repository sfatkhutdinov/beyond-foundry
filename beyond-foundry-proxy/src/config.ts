/**
 * CONFIG
 */

interface ClassMapEntry {
  name: string;
  spells: string;
  id: number;
}

interface ConfigUrls {
  authService: string;
  baseUrl: string;
  monsterBaseUrl: string;
  characterUrl: (characterId: string) => string;
  spellsAPI: (classId: number, classLevel: number, campaignId?: string) => string;
  alwaysPreparedSpells: (
    classId: number,
    classLevel: number,
    campaignId?: string,
    spellListIds?: number[]
  ) => string;
  alwaysKnownSpells: (
    classId: number,
    classLevel: number,
    campaignId?: string,
    spellListIds?: number[],
    backgroundId?: number | null
  ) => string;
  itemsAPI: (campaignId?: string) => string;
  monstersAPI: (
    skip: number,
    take: number,
    search?: string,
    homebrew?: boolean,
    homebrewOnly?: boolean,
    sources?: number[]
  ) => string;
  monsterIdsAPI: (ids: number[]) => string;
  classOptionsAPI: () => string;
  racialTraitOptionsAPI: () => string;
  campaignsAPI: string;
  configUrl: string;
}

interface Config {
  badImages: string[];
  classMap: ClassMapEntry[];
  urls: ConfigUrls;
}

const CLASS_MAP: ClassMapEntry[] = [
  { name: 'Barbarian', spells: 'SPELLS', id: 2190875 },
  { name: 'Bard', spells: 'SPELLS', id: 2190876 },
  { name: 'Cleric', spells: 'KNOWN', id: 2190877 },
  { name: 'Druid', spells: 'KNOWN', id: 2190878 },
  { name: 'Fighter', spells: 'SPELLS', id: 2190879 },
  { name: 'Monk', spells: 'SPELLS', id: 2190880 },
  { name: 'Paladin', spells: 'KNOWN', id: 2190881 },
  { name: 'Ranger', spells: 'SPELLS', id: 2190882 },
  { name: 'Rogue', spells: 'SPELLS', id: 2190883 },
  { name: 'Sorcerer', spells: 'SPELLS', id: 2190884 },
  { name: 'Warlock', spells: 'SPELLS', id: 2190885 },
  { name: 'Wizard', spells: 'SPELLS', id: 2190886 },
  { name: 'Artificer', spells: 'KNOWN', id: 252717 },
];
const BAD_IMAGES: string[] = [];

const CONFIG: Config = {
  badImages: BAD_IMAGES,
  classMap: CLASS_MAP,
  urls: {
    authService: 'https://auth-service.dndbeyond.com/v1/cobalt-token',
    baseUrl: 'https://character-service.dndbeyond.com/character/v5',
    monsterBaseUrl: 'https://monster-service.dndbeyond.com/v1/Monster',
    characterUrl: (characterId: string) =>
      `${CONFIG.urls.baseUrl}/character/${characterId}?includeCustomItems=true`,
    spellsAPI: (classId: number, classLevel: number, campaignId?: string) => {
      let campaign = '';
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/spells?classId=${classId}&classLevel=${classLevel}&sharingSetting=2${campaign}`;
    },
    alwaysPreparedSpells: (
      classId: number,
      classLevel: number,
      campaignId?: string,
      spellListIds: number[] = []
    ) => {
      let campaign = '';
      let spellLists = '';
      spellListIds.forEach(list => (spellLists += `&spellListIds[]=${list}`));
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/always-prepared-spells?classId=${classId}&classLevel=${classLevel}&sharingSetting=2${campaign}${spellLists}`;
    },
    alwaysKnownSpells: (
      classId: number,
      classLevel: number,
      campaignId?: string,
      spellListIds: number[] = [],
      backgroundId: number | null = null
    ) => {
      let campaign = '';
      let spellLists = '';
      let backgroundIdAdd =
        spellListIds.length === 0 && backgroundId ? `&backgroundId=${backgroundId}` : '';
      spellListIds.forEach(list => (spellLists += `&spellListIds[]=${list}`));
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/always-known-spells?classId=${classId}&classLevel=${classLevel}&sharingSetting=2${campaign}${spellLists}${backgroundIdAdd}`;
    },
    itemsAPI: (campaignId?: string) => {
      let campaign = '';
      if (campaignId) campaign = `&campaignId=${campaignId}`;
      return `${CONFIG.urls.baseUrl}/game-data/items?sharingSetting=2${campaign}`;
    },
    monstersAPI: (
      skip: number,
      take: number,
      search: string = '',
      homebrew: boolean = false,
      homebrewOnly: boolean = false,
      sources: number[] = []
    ) => {
      let sourceSearch = sources.reduce(
        (previous: string, current: number) => previous + `&sources=${current}`,
        ''
      );
      let useHomebrew = homebrew ? '' : '&showHomebrew=f';
      if (homebrewOnly) {
        sourceSearch = '';
        useHomebrew = '&showHomebrew=t';
      }
      const url = `${CONFIG.urls.monsterBaseUrl}?search=${search}&skip=${skip}&take=${take}${useHomebrew}${sourceSearch}`;
      console.log(url);
      return url;
    },
    monsterIdsAPI: (ids: number[]) => {
      const idString = ids.reduce((previous: string, current: number) => {
        const pre = previous === '' ? '?ids=' : '&ids=';
        return previous + `${pre}${current}`;
      }, '');
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
    campaignsAPI: 'https://www.dndbeyond.com/api/campaign/stt/user-campaigns',
    configUrl: 'https://www.dndbeyond.com/api/config/json',
  },
};
export default CONFIG;
