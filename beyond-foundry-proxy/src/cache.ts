/**
 * Simple in-memory cache
 */

interface CacheItem<T = any> {
    id: string;
    lastUpdate: number;
    data: T;
}

class Cache<T = any> {
    private items: CacheItem<T>[] = [];
    private name: string;
    private expiration: number; // expiration in hours

    constructor(name: string, expiration: number = 24) {
        this.items = [];
        this.name = name;
        this.expiration = expiration; // expiration in hours
    }

    exists(id: string): CacheItem<T> | undefined {
        return this.items.find(cache => cache.id === id && !this.isExpired(cache.lastUpdate));
    }

    get(id: string): T | undefined {
        const item = this.exists(id);
        return item ? item.data : undefined;
    }

    set(id: string, data: T): void {
        this.add(id, data);
    }

    isExpired(timestamp: number): boolean {
        return (new Date().valueOf() - timestamp) / (1000 * 60 * 60 * this.expiration) >= 1;
    }

    add(id: string, data: T): CacheItem<T> | null {
        const isArray = Array.isArray(data);
        const isString = typeof data === "string" || data instanceof String;
        const isObject = typeof data === "object";
        if (!data || ((isArray || isString) && !(data as any).length) || (!isArray && !isString && !isObject))
            return null;
        
        console.log(`[CACHE ${this.name}] Adding to the Cache (ID: ${id}): ${(data as any).length || 'N/A'} items.`);
        const index = this.items.find(cache => cache.id === id);
        if (index) {
            console.log(`[CACHE ${this.name}] Removing expired entry from cache`);
            this.items = this.items.filter(cache => cache.id !== id);
        }
        
        const newItem: CacheItem<T> = {
            id: id,
            lastUpdate: new Date().valueOf(),
            data: data,
        };
        this.items.push(newItem);
        return newItem;
    }
}

export default Cache;
