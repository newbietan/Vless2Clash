import yaml from 'js-yaml';
import { generateWebPath } from '../utils.js';
import { InvalidPayloadError, MissingDependencyError } from './errors.js';

export class ConfigStorageService {
    constructor(kv, options = {}) {
        this.kv = kv;
        this.options = options;
    }

    ensureKv() {
        if (!this.kv) {
            throw new MissingDependencyError('Config storage requires a KV store');
        }
        return this.kv;
    }

    async getConfigById(configId) {
        const kv = this.ensureKv();
        const stored = await kv.get(configId);
        if (!stored) return null;
        
        // For vless type, return as plain text
        if (configId.startsWith('vless_')) {
            return stored;
        }
        
        try {
            return JSON.parse(stored);
        } catch {
            // If not valid JSON, return as plain text
            return stored;
        }
    }

    async getConfigMeta(configId) {
        const kv = this.ensureKv();
        const metaStr = await kv.get(`meta:${configId}`);
        if (!metaStr) return null;
        try {
            return JSON.parse(metaStr);
        } catch {
            return null;
        }
    }

    async saveConfig(type, content, name = '', nodes = []) {
        if (!type) {
            throw new InvalidPayloadError('Missing config type');
        }

        const kv = this.ensureKv();
        const configId = `${type}_${generateWebPath(16)}`;
        const configString = this.serializeConfig(type, content);

        const ttlSeconds = this.options.configTtlSeconds;
        const putOptions = ttlSeconds ? { expirationTtl: ttlSeconds } : undefined;
        
        // Save config content
        await kv.put(configId, configString, putOptions);
        
        // Count nodes
        const nodeCount = Array.isArray(nodes) ? nodes.length : 
            (type === 'vless' ? content.split('\n').filter(l => l.trim().startsWith('vless://')).length : 0);
        
        // Save metadata with nodes
        const meta = {
            id: configId,
            type,
            name: name || `订阅_${new Date().toLocaleDateString('zh-CN')}`,
            nodeCount,
            nodes: Array.isArray(nodes) ? nodes : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await kv.put(`meta:${configId}`, JSON.stringify(meta), putOptions);
        
        // Update index
        await this.addToIndex(configId, meta);
        
        return configId;
    }

    async deleteConfig(configId) {
        const kv = this.ensureKv();
        await kv.delete(configId);
        await kv.delete(`meta:${configId}`);
        await this.removeFromIndex(configId);
    }

    async getConfig(configId) {
        const kv = this.ensureKv();
        const metaStr = await kv.get(`meta:${configId}`);
        if (!metaStr) return null;

        try {
            const meta = JSON.parse(metaStr);
            if (meta.type === 'vless') {
                const vlessLinks = await kv.get(configId);
                if (!vlessLinks) return null;
                meta.vlessLinks = vlessLinks;
            }
            return meta;
        } catch {
            return null;
        }
    }

    async updateConfig(configId, content, name, nodes) {
        const kv = this.ensureKv();
        const existingMeta = await this.getConfigMeta(configId);
        if (!existingMeta) {
            throw new InvalidPayloadError('Config not found');
        }

        const ttlSeconds = this.options.configTtlSeconds;
        const putOptions = ttlSeconds ? { expirationTtl: ttlSeconds } : undefined;

        const configString = this.serializeConfig(existingMeta.type, content);
        await kv.put(configId, configString, putOptions);

        const nodeCount = Array.isArray(nodes) ? nodes.length :
            (existingMeta.type === 'vless' ? content.split('\n').filter(l => l.trim().startsWith('vless://')).length : existingMeta.nodeCount);

        const meta = {
            ...existingMeta,
            name: name || existingMeta.name,
            nodeCount,
            nodes: Array.isArray(nodes) ? nodes : existingMeta.nodes,
            updatedAt: new Date().toISOString()
        };
        await kv.put(`meta:${configId}`, JSON.stringify(meta), putOptions);

        await this.updateIndexEntry(configId, meta);

        return configId;
    }

    async listConfigs(type) {
        const kv = this.ensureKv();
        const index = await this.getIndexEntries();
        const filtered = type ? index.filter(item => item.type === type) : index;

        const configs = await Promise.all(filtered.map(async (item) => {
            const fullMeta = await kv.get(`meta:${item.id}`);
            if (!fullMeta) return null;

            try {
                const meta = JSON.parse(fullMeta);
                if (item.type === 'vless') {
                    const vlessLinks = await kv.get(item.id);
                    if (!vlessLinks) return null;
                    meta.vlessLinks = vlessLinks;
                }
                return meta;
            } catch {
                return null;
            }
        }));

        return configs
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async addToIndex(configId, meta) {
        const kv = this.ensureKv();
        const summary = this.createIndexSummary(meta);
        await kv.put(`index:${configId}`, JSON.stringify(summary), this.getPutOptions());
    }

    async removeFromIndex(configId) {
        const kv = this.ensureKv();
        await kv.delete(`index:${configId}`);
    }

    async updateIndexEntry(configId, meta) {
        const kv = this.ensureKv();
        const summary = this.createIndexSummary(meta);
        await kv.put(`index:${configId}`, JSON.stringify(summary), this.getPutOptions());
    }

    async getIndexEntries() {
        const kv = this.ensureKv();
        const entries = new Map();

        if (typeof kv.list === 'function') {
            const keys = await kv.list('index:');
            const values = await Promise.all(keys.map(key => kv.get(key)));
            for (const value of values) {
                try {
                    const item = JSON.parse(value);
                    if (item?.id) entries.set(item.id, item);
                } catch {
                    // Invalid entries are ignored because the config metadata remains authoritative.
                }
            }
        }

        const legacyIndex = await kv.get('config_index');
        if (legacyIndex) {
            try {
                for (const item of JSON.parse(legacyIndex)) {
                    if (item?.id && !entries.has(item.id)) entries.set(item.id, item);
                }
            } catch {
                // Legacy index corruption must not hide valid per-config entries.
            }
        }

        return Array.from(entries.values());
    }

    createIndexSummary(meta) {
        const { id, type, name, nodeCount, createdAt } = meta;
        return { id, type, name, nodeCount, createdAt };
    }

    getPutOptions() {
        const ttlSeconds = this.options.configTtlSeconds;
        return ttlSeconds ? { expirationTtl: ttlSeconds } : undefined;
    }

    serializeConfig(type, content) {
        if (type === 'clash') {
            if (typeof content === 'string' && (content.trim().startsWith('-') || content.includes(':'))) {
                const yamlConfig = yaml.load(content);
                return JSON.stringify(yamlConfig);
            }
            return typeof content === 'object' ? JSON.stringify(content) : content;
        }

        // For vless type, store as plain text
        if (type === 'vless') {
            if (typeof content === 'string') {
                return content;
            }
            throw new InvalidPayloadError('VLESS config must be a string');
        }

        if (typeof content === 'object') {
            return JSON.stringify(content);
        }
        if (typeof content === 'string') {
            return content;
        }
        throw new InvalidPayloadError('Unsupported config content type');
    }
}
