/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Layout } from '../components/Layout.jsx';
import { LoginPage } from '../components/LoginPage.jsx';
import { DashboardPage } from '../components/DashboardPage.jsx';
import { SubscriptionsPage } from '../components/SubscriptionsPage.jsx';
import { SimpleClashConfigBuilder } from '../builders/SimpleClashConfigBuilder.js';
import { normalizeVlessLinks, parseVlessLinks } from '../parsers/protocols/vlessParser.js';
import { APP_NAME } from '../constants.js';
import { ConfigStorageService } from '../services/configStorageService.js';
import { AuthService } from '../services/authService.js';
import { TurnstileService } from '../services/turnstileService.js';
import { ServiceError, MissingDependencyError } from '../services/errors.js';
import { normalizeRuntime } from '../runtime/runtimeConfig.js';

export function createApp(bindings = {}) {
    const runtime = normalizeRuntime(bindings);
    const adminPassword = runtime.config.adminPassword || '';

    const services = {
        configStorage: runtime.kv ? new ConfigStorageService(runtime.kv, { configTtlSeconds: runtime.config.configTtlSeconds }) : null,
        auth: new AuthService(runtime.kv, adminPassword, {
            allowUnauthenticated: runtime.config.allowUnauthenticated
        }),
        turnstile: new TurnstileService(runtime.config.turnstileSecretKey || '')
    };

    const turnstileSitekey = runtime.config.turnstileSitekey || '';

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
            setCookie(c, 'auth_token', result.token, {
                httpOnly: true,
                secure: isHttpsRequest(c),
                sameSite: 'Strict',
                path: '/',
                maxAge: 86400
            });
            return c.json(result);
        } catch (error) {
            if (error instanceof ServiceError) {
                return handleError(c, error, runtime.logger);
            }
            return c.text(error.message, 401);
        }
    });

    // Logout API
    app.post('/api/logout', async (c) => {
        const token = extractBearerToken(c) || getCookie(c, 'auth_token');
        if (token) {
            await services.auth.logout(token);
        }
        deleteCookie(c, 'auth_token', {
            secure: isHttpsRequest(c),
            sameSite: 'Strict',
            path: '/'
        });
        return c.json({ success: true });
    });

    // Auth check middleware for protected pages
    const requireAuth = async (c, next) => {
        const token = extractBearerToken(c) || getCookie(c, 'auth_token');
        const isValid = await services.auth.verifyToken(token);
        if (!isValid) {
            return c.redirect('/login');
        }
        await next();
    };

    // API auth middleware - returns 401 JSON for API endpoints
    const requireApiAuth = async (c, next) => {
        const token = extractBearerToken(c);
        const isValid = await services.auth.verifyToken(token);
        if (!isValid) {
            return c.json({ error: 'Unauthorized' }, 401);
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
    app.post('/config', requireApiAuth, async (c) => {
        try {
            const body = await c.req.json();
            const { vlessLinks, name, dedup = true } = body;
            if (!vlessLinks || typeof vlessLinks !== 'string') {
                return c.text('Missing vlessLinks parameter', 400);
            }

            const normalizedLinks = normalizeVlessLinks(vlessLinks, { dedup });
            const nodes = parseVlessLinks(normalizedLinks, { dedup: false });
            if (nodes.length === 0) {
                return c.text('No valid VLESS links found', 400);
            }

            const storage = requireConfigStorage(services.configStorage);
            const configId = await storage.saveConfig('vless', normalizedLinks, name, nodes);
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
    app.get('/api/subscriptions', requireApiAuth, async (c) => {
        try {
            const storage = requireConfigStorage(services.configStorage);
            const configs = await storage.listConfigs('vless');
            return c.json(configs);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Delete subscription (requires auth)
    app.delete('/api/subscriptions/:id', requireApiAuth, async (c) => {
        try {
            const configId = c.req.param('id');
            const storage = requireConfigStorage(services.configStorage);
            await storage.deleteConfig(configId);
            return c.text('Deleted', 200);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Get single subscription detail (requires auth)
    app.get('/api/subscriptions/:id', requireApiAuth, async (c) => {
        try {
            const configId = c.req.param('id');
            const storage = requireConfigStorage(services.configStorage);
            const config = await storage.getConfig(configId);
            if (!config) {
                return c.json({ error: 'Config not found' }, 404);
            }
            return c.json(config);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Update subscription (requires auth)
    app.put('/api/subscriptions/:id', requireApiAuth, async (c) => {
        try {
            const configId = c.req.param('id');
            const body = await c.req.json();
            const { vlessLinks, name, dedup = true } = body;
            if (!vlessLinks || typeof vlessLinks !== 'string') {
                return c.text('Missing vlessLinks parameter', 400);
            }

            const normalizedLinks = normalizeVlessLinks(vlessLinks, { dedup });
            const nodes = parseVlessLinks(normalizedLinks, { dedup: false });
            if (nodes.length === 0) {
                return c.text('No valid VLESS links found', 400);
            }

            const storage = requireConfigStorage(services.configStorage);
            const updatedId = await storage.updateConfig(configId, normalizedLinks, name, nodes);
            return c.text(updatedId);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return c.text(`Invalid format: ${error.message}`, 400);
            }
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Parse VLESS links and return node info (requires auth)
    app.post('/api/parse-nodes', requireApiAuth, async (c) => {
        try {
            const { vlessLinks, dedup = true } = await c.req.json();
            if (!vlessLinks) {
                return c.json({ error: 'Missing vlessLinks' }, 400);
            }

            const nodes = parseVlessLinks(vlessLinks, { dedup });
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

function extractBearerToken(c) {
    const authorization = c.req.header('Authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    return match?.[1].trim() || undefined;
}

function isHttpsRequest(c) {
    return new URL(c.req.url).protocol === 'https:';
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
