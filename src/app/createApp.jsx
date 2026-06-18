/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono';
import { Layout } from '../components/Layout.jsx';
import { LoginPage } from '../components/LoginPage.jsx';
import { DashboardPage } from '../components/DashboardPage.jsx';
import { SubscriptionsPage } from '../components/SubscriptionsPage.jsx';
import { SimpleClashConfigBuilder } from '../builders/SimpleClashConfigBuilder.js';
import { APP_NAME } from '../constants.js';
import { ConfigStorageService } from '../services/configStorageService.js';
import { AuthService } from '../services/authService.js';
import { TurnstileService } from '../services/turnstileService.js';
import { ServiceError, MissingDependencyError } from '../services/errors.js';
import { normalizeRuntime } from '../runtime/runtimeConfig.js';

export function createApp(bindings = {}) {
    const runtime = normalizeRuntime(bindings);
    const adminPassword = runtime.config.adminPassword || process.env.ADMIN_PASSWORD || '';
    
    const services = {
        configStorage: runtime.kv ? new ConfigStorageService(runtime.kv, { configTtlSeconds: runtime.config.configTtlSeconds }) : null,
        auth: new AuthService(runtime.kv, adminPassword),
        turnstile: new TurnstileService(runtime.config.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || '')
    };

    const turnstileSitekey = runtime.config.turnstileSitekey || process.env.TURNSTILE_SITEKEY || '';

    const app = new Hono();

    // Login page
    app.get('/login', (c) => {
        return c.html(<LoginPage turnstileSitekey={turnstileSitekey} />);
    });

    // Login API
    app.post('/api/login', async (c) => {
        try {
            const { password, turnstileToken } = await c.req.json();
            
            // Verify Turnstile if enabled
            if (services.turnstile.isEnabled()) {
                const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';
                const turnstileValid = await services.turnstile.verify(turnstileToken, clientIp);
                if (!turnstileValid) {
                    return c.text('人机验证失败，请重试', 403);
                }
            }
            
            const result = await services.auth.login(password);
            return c.json(result);
        } catch (error) {
            return c.text(error.message, 401);
        }
    });

    // Logout API
    app.post('/api/logout', async (c) => {
        const token = c.req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            await services.auth.logout(token);
        }
        return c.json({ success: true });
    });

    // Auth check middleware for protected pages
    const requireAuth = async (c, next) => {
        // Check cookie or header token
        const token = c.req.header('Authorization')?.replace('Bearer ', '') || 
                      getCookie(c, 'auth_token');
        
        // Also check if token is passed as query param (for simplicity)
        const queryToken = c.req.query('token');
        const finalToken = token || queryToken;
        
        const isValid = await services.auth.verifyToken(finalToken);
        if (!isValid) {
            return c.redirect('/login');
        }
        await next();
    };

    // Protected pages
    app.get('/', requireAuth, (c) => {
        return c.html(
            <Layout title="仪表盘" activePage="仪表盘">
                <DashboardPage />
            </Layout>
        );
    });

    app.get('/subscriptions', requireAuth, (c) => {
        return c.html(
            <Layout title="订阅管理" activePage="订阅管理">
                <SubscriptionsPage />
            </Layout>
        );
    });

    // API: Save VLESS config (requires auth)
    app.post('/config', async (c) => {
        try {
            // Verify auth
            const token = c.req.header('Authorization')?.replace('Bearer ', '') || 
                          getCookie(c, 'auth_token');
            const isValid = await services.auth.verifyToken(token);
            if (!isValid) {
                return c.text('Unauthorized', 401);
            }

            const body = await c.req.json();
            const { vlessLinks, name, nodes } = body;
            if (!vlessLinks || typeof vlessLinks !== 'string') {
                return c.text('Missing vlessLinks parameter', 400);
            }

            const storage = requireConfigStorage(services.configStorage);
            const configId = await storage.saveConfig('vless', vlessLinks, name, nodes);
            return c.text(configId);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return c.text(`Invalid format: ${error.message}`, 400);
            }
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Get subscription (public - link itself is credential)
    app.get('/sub', async (c) => {
        try {
            const configId = c.req.query('id');
            if (!configId) {
                return c.text('Missing id parameter', 400);
            }

            const storage = requireConfigStorage(services.configStorage);
            const vlessLinks = await storage.getConfigById(configId);
            if (!vlessLinks) {
                return c.text('Config not found', 404);
            }

            const ua = getRequestHeader(c.req, 'User-Agent') || 'curl/7.74.0';
            const builder = new SimpleClashConfigBuilder(vlessLinks, ua);
            await builder.build();
            return c.text(builder.formatConfig(), 200, { 'Content-Type': 'text/yaml; charset=utf-8' });
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: List subscriptions (requires auth)
    app.get('/api/subscriptions', async (c) => {
        try {
            const token = c.req.header('Authorization')?.replace('Bearer ', '');
            const isValid = await services.auth.verifyToken(token);
            if (!isValid) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const storage = requireConfigStorage(services.configStorage);
            const configs = await storage.listConfigs('vless');
            return c.json(configs);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Delete subscription (requires auth)
    app.delete('/api/subscriptions/:id', async (c) => {
        try {
            const token = c.req.header('Authorization')?.replace('Bearer ', '');
            const isValid = await services.auth.verifyToken(token);
            if (!isValid) {
                return c.text('Unauthorized', 401);
            }

            const configId = c.req.param('id');
            const storage = requireConfigStorage(services.configStorage);
            await storage.deleteConfig(configId);
            return c.text('Deleted', 200);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Parse VLESS links and return node info (requires auth)
    app.post('/api/parse-nodes', async (c) => {
        try {
            const token = c.req.header('Authorization')?.replace('Bearer ', '');
            const isValid = await services.auth.verifyToken(token);
            if (!isValid) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const { vlessLinks } = await c.req.json();
            if (!vlessLinks) {
                return c.json({ error: 'Missing vlessLinks' }, 400);
            }

            const nodes = parseVlessLinks(vlessLinks);
            return c.json(nodes);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // Favicon
    app.get('/favicon.ico', async (c) => {
        if (!runtime.assetFetcher) {
            return c.notFound();
        }
        try {
            return await runtime.assetFetcher(c.req.raw);
        } catch (error) {
            runtime.logger.warn('Asset fetch failed', error);
            return c.notFound();
        }
    });

    return app;
}

function getCookie(c, name) {
    const cookie = c.req.header('Cookie');
    if (!cookie) return null;
    const match = cookie.match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] : null;
}

function parseVlessLinks(input) {
    const lines = input.split('\n').filter(l => l.trim().startsWith('vless://'));
    const nodes = [];
    const seen = new Set();

    for (const line of lines) {
        try {
            const url = new URL(line.trim());
            const uuid = url.username;
            const server = url.hostname;
            const port = url.port || '443';
            const params = new URLSearchParams(url.search);
            const name = decodeURIComponent(url.hash.slice(1) || `${server}:${port}`);
            
            // Dedup key
            const dedupKey = `${server}:${port}:${uuid}`;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);

            nodes.push({
                name,
                server,
                port: parseInt(port),
                protocol: 'VLESS',
                transport: params.get('type') || 'tcp',
                security: params.get('security') || 'none',
                sni: params.get('sni') || '',
                region: guessRegion(server, name)
            });
        } catch (e) {
            // Skip invalid links
        }
    }

    return nodes;
}

function guessRegion(server, name) {
    const regionPatterns = {
        'US': ['us', 'america', '美国'],
        'JP': ['jp', 'japan', '日本', '东京'],
        'HK': ['hk', 'hongkong', '香港'],
        'SG': ['sg', 'singapore', '新加坡', '狮城'],
        'TW': ['tw', 'taiwan', '台湾', '台北'],
        'KR': ['kr', 'korea', '韩国', '首尔'],
        'DE': ['de', 'germany', '德国'],
        'GB': ['gb', 'uk', '英国', '伦敦'],
    };

    const lowerName = name.toLowerCase();
    const lowerServer = server.toLowerCase();

    for (const [region, patterns] of Object.entries(regionPatterns)) {
        if (patterns.some(p => lowerName.includes(p) || lowerServer.includes(p))) {
            return region;
        }
    }

    return 'OTHER';
}

function getRequestHeader(request, name) {
    if (!request || !name) {
        return undefined;
    }

    try {
        const value = request.header(name);
        if (value !== undefined) {
            return value;
        }
    } catch {
        // Fallback if HonoRequest.header cannot read from the raw request.
    }

    const headers = request.raw?.headers;
    if (!headers) {
        return undefined;
    }

    if (typeof headers.get === 'function') {
        return headers.get(name) ?? headers.get(name.toLowerCase()) ?? undefined;
    }

    if (typeof headers === 'object') {
        const lowerName = name.toLowerCase();
        const headerValue = headers[lowerName] ?? headers[name];
        if (Array.isArray(headerValue)) {
            return headerValue[0];
        }
        return headerValue;
    }

    return undefined;
}

function requireConfigStorage(service) {
    if (!service) {
        throw new MissingDependencyError('Config storage functionality is unavailable');
    }
    return service;
}

function handleError(c, error, logger) {
    if (error instanceof ServiceError) {
        return c.text(error.message, error.status);
    }
    logger.error?.('Unhandled error', error);
    return c.text(`Error: ${error.message}`, 500);
}