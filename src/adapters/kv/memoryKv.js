/**
 * In-memory KV adapter for testing
 */
export class MemoryKVAdapter {
    constructor() {
        this.store = new Map();
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async put(key, value, options) {
        this.store.set(key, value);
        if (options?.expirationTtl) {
            setTimeout(() => this.store.delete(key), options.expirationTtl * 1000);
        }
    }

    async delete(key) {
        this.store.delete(key);
    }
}