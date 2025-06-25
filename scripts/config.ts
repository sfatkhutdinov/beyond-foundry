export const CHARACTER_ID = '147239148'; // Example Character ID
export const DDB_USER_COBALT_COOKIE = process.env.COBALT_TOKEN || '';
export const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4000'; // Default if not in .env

// Add any other shared configuration needed by test scripts
export const CLASS_CONFIG = {
  BARBARIAN: 'barbarian',
  BARD: 'bard',
  CLERIC: 'cleric',
  DRUID: 'druid',
  FIGHTER: 'fighter',
  MONK: 'monk',
  PALADIN: 'paladin',
  RANGER: 'ranger',
  ROGUE: 'rogue',
  SORCERER: 'sorcerer',
  WARLOCK: 'warlock',
  WIZARD: 'wizard',
  ARTIFICER: 'artificer',
};
