import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const runtime = {
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: {
        configTtlSeconds: 60,
        shortLinkTtlSeconds: null,
        allowUnauthenticated: true
    }
};

const app = createApp(runtime);

describe('Worker', () => {
    it('responds with HTML on root path', async () => {
        const res = await app.request('http://example.com/');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        const text = await res.text();
        expect(text).toContain('<html');
    });

    it('responds with 404 for unknown paths', async () => {
        const res = await app.request('http://example.com/unknown-path');
        expect(res.status).toBe(404);
    });

    it('renders syntactically valid dashboard JavaScript', async () => {
        const res = await app.request('http://example.com/');
        const html = await res.text();
        const scripts = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g));
        const dashboardScript = scripts.find(([, source]) => source.includes('let nodes = []'))?.[1];

        expect(dashboardScript).toBeTruthy();
        expect(() => new Function(dashboardScript)).not.toThrow();
    });
});

describe('Authentication', () => {
    it('rejects the no-auth token when a password is configured', async () => {
        const app = createApp({
            kv: new MemoryKVAdapter(),
            config: { adminPassword: 'secret' }
        });

        const res = await app.request('http://example.com/api/subscriptions', {
            headers: { Authorization: 'Bearer no-auth' }
        });

        expect(res.status).toBe(401);
    });

    it('creates a secure session cookie and requires a bearer token for APIs', async () => {
        const app = createApp({
            kv: new MemoryKVAdapter(),
            config: { adminPassword: 'secret' }
        });
        const loginRes = await app.request('https://example.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'secret' })
        });
        const { token } = await loginRes.json();
        const cookie = loginRes.headers.get('set-cookie');

        expect(loginRes.status).toBe(200);
        expect(token).toMatch(/^[A-Za-z0-9]{32}$/);
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('Secure');
        expect(cookie).toContain('SameSite=Strict');

        const cookieOnlyRes = await app.request('https://example.com/api/subscriptions', {
            headers: { Cookie: `auth_token=${token}` }
        });
        expect(cookieOnlyRes.status).toBe(401);

        const bearerRes = await app.request('https://example.com/api/subscriptions', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(bearerRes.status).toBe(200);
    });

    it('fails closed when neither a password nor explicit opt-out is configured', async () => {
        const app = createApp({ kv: new MemoryKVAdapter() });
        const res = await app.request('http://example.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: '' })
        });

        expect(res.status).toBe(501);
        expect(await res.text()).toBe('ADMIN_PASSWORD is not configured');
    });
});
