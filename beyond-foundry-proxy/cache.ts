/**
 * Simple in-memory cache
 */
class Cache {
  items: { id: string; lastUpdate: number; data: any }[];
  name: string;
  expiration: number;

  constructor(name: string, expiration = 24) {
    this.items = [];
    this.name = name;
    this.expiration = expiration; // expiration in hours
  }

  exists(id: string) {
    return this.items.find(cache => cache.id === id && !this.isExpired(cache.lastUpdate));
  }

  isExpired(timestamp: number) {
    return (new Date().valueOf() - timestamp) / (1000 * 60 * 60 * this.expiration) >= 1;
  }

  add(id: string, data: any) {
    const isArray = Array.isArray(data);
    const isString = typeof data === "string" || data instanceof String;
    const isObject = typeof data === "object";
    if (!data || ((isArray || isString) && !data.length) || (!isArray && !isString && !isObject)) return null;
    console.log(`[CACHE ${this.name}] Adding to the Cache (ID: ${id}): ${data.length} items.`);

    const index = this.items.find(cache => cache.id === id);
    if (index) {
      console.log(`[CACHE ${this.name}] Removing expired entry from cache`);
      this.items = this.items.filter(cache => cache.id !== id);
    }

    this.items.push({
      id: id,
      lastUpdate: new Date().valueOf(),
      data: data,
    });
  }
}

export default Cache;
