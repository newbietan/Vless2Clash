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
        const configId = `${type}_${generateWebPath(8)}`;
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

    async listConfigs(type) {
        const kv = this.ensureKv();
        const indexStr = await kv.get('config_index');
        if (!indexStr) return [];
        
        try {
            const index = JSON.parse(indexStr);
            const configs = [];
            
            for (const item of index) {
                if (type && item.type !== type) continue;
                // Get full meta with nodes
                const fullMeta = await kv.get(`meta:${item.id}`);
                if (fullMeta) {
                    try {
                        configs.push(JSON.parse(fullMeta));
                    } catch {
                        configs.push(item);
                    }
                } else {
                    configs.push(item);
                }
            }
            
            return configs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch {
            return [];
        }
    }

    async addToIndex(configId, meta) {
        const kv = this.ensureKv();
        const indexStr = await kv.get('config_index');
        let index = [];
        
        try {
            index = indexStr ? JSON.parse(indexStr) : [];
        } catch {
            index = [];
        }
        
        index.push(meta);
        await kv.put('config_index', JSON.stringify(index));
    }

    async removeFromIndex(configId) {
        const kv = this.ensureKv();
        const indexStr = await kv.get('config_index');
        if (!indexStr) return;
        
        try {
            let index = JSON.parse(indexStr);
            index = index.filter(item => item.id !== configId);
            await kv.put('config_index', JSON.stringify(index));
        } catch {
            // Ignore
        }
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