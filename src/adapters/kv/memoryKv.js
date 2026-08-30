/**
 * In-memory KV adapter for testing
 */
export class MemoryKVAdapter {
    constructor() {
        this.store = new Map();
        this.expirations = new Map();
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async put(key, value, options) {
        const previousTimer = this.expirations.get(key);
        if (previousTimer) {
            clearTimeout(previousTimer);
            this.expirations.delete(key);
        }
        this.store.set(key, value);
        if (options?.expirationTtl) {
            const timer = setTimeout(() => {
                this.store.delete(key);
                this.expirations.delete(key);
            }, options.expirationTtl * 1000);
            this.expirations.set(key, timer);
        }
    }

    async delete(key) {
        this.store.delete(key);
        const timer = this.expirations.get(key);
        if (timer) clearTimeout(timer);
        this.expirations.delete(key);
    }

    async list(prefix) {
        return Array.from(this.store.keys()).filter((key) =>
            key.startsWith(prefix),
        );
    }
}
