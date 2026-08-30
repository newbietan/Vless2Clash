export class CloudflareKVAdapter {
    constructor(binding) {
        this.binding = binding;
    }

    async get(key) {
        return this.binding.get(key);
    }

    async put(key, value, options = {}) {
        return this.binding.put(key, value, options);
    }

    async delete(key) {
        return this.binding.delete(key);
    }

    async list(prefix) {
        const keys = [];
        let cursor;

        do {
            const page = await this.binding.list({ prefix, cursor });
            keys.push(...page.keys.map((key) => key.name));
            cursor = page.list_complete ? undefined : page.cursor;
        } while (cursor);

        return keys;
    }
}
