import { CloudflareKVAdapter } from '../adapters/kv/cloudflareKv.js';

export function createCloudflareRuntime(env) {
    return {
        kv: env?.SUBLINK_KV ? new CloudflareKVAdapter(env.SUBLINK_KV) : null,
        assetFetcher: env?.ASSETS ? (request) => env.ASSETS.fetch(request) : null,
        logger: console,
        config: {
            adminPassword: env?.ADMIN_PASSWORD || '',
            turnstileSitekey: env?.TURNSTILE_SITEKEY || '',
            turnstileSecretKey: env?.TURNSTILE_SECRET_KEY || ''
        }
    };
}
