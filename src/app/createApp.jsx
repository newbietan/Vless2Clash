/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Layout } from "../components/Layout.jsx";
import { LoginPage } from "../components/LoginPage.jsx";
import { DashboardPage } from "../components/DashboardPage.jsx";
import { SubscriptionsPage } from "../components/SubscriptionsPage.jsx";
import { SimpleClashConfigBuilder } from "../builders/SimpleClashConfigBuilder.js";
import { normalizeProxyLinks, parseProxyNodes } from "../parsers/linkParser.js";
import { ConfigStorageService } from "../services/configStorageService.js";
import { AuthService } from "../services/authService.js";
import { TurnstileService } from "../services/turnstileService.js";
import { LoginThrottleService } from "../services/loginThrottleService.js";
import {
    ServiceError,
    MissingDependencyError,
    InvalidPayloadError,
} from "../services/errors.js";
import { normalizeRuntime } from "../runtime/runtimeConfig.js";

export function createApp(bindings = {}) {
    const runtime = normalizeRuntime(bindings);
    const adminPassword = runtime.config.adminPassword || "";

    const services = {
        configStorage: runtime.kv
            ? new ConfigStorageService(runtime.kv, {
                  configTtlSeconds: runtime.config.configTtlSeconds,
              })
            : null,
        auth: new AuthService(runtime.kv, adminPassword, {
            allowUnauthenticated: runtime.config.allowUnauthenticated,
        }),
        turnstile: new TurnstileService(
            runtime.config.turnstileSecretKey || "",
        ),
        loginThrottle: runtime.kv ? new LoginThrottleService(runtime.kv) : null,
    };

    const turnstileSitekey = runtime.config.turnstileSitekey || "";

    const app = new Hono();

    // Login page
    app.get("/login", (c) => {
        return c.html(<LoginPage turnstileSitekey={turnstileSitekey} />);
    });

    // Login API
    app.post("/api/login", async (c) => {
        const clientIp = getClientIp(c);
        try {
            const { password, turnstileToken } = await c.req.json();

            // Brute-force protection: reject already-locked IPs up front.
            if (services.loginThrottle?.isEnabled()) {
                const { blocked, retryAfterSeconds } =
                    await services.loginThrottle.isBlocked(clientIp);
                if (blocked) {
                    return c.text(
                        `尝试次数过多，请 ${Math.ceil(retryAfterSeconds / 60)} 分钟后再试`,
                        429,
                    );
                }
            }

            // Verify Turnstile if enabled
            if (services.turnstile.isEnabled()) {
                const turnstileValid = await services.turnstile.verify(
                    turnstileToken,
                    clientIp,
                );
                if (!turnstileValid) {
                    return c.text("人机验证失败，请重试", 403);
                }
            }

            const result = await services.auth.login(password);
            await services.loginThrottle?.recordSuccess(clientIp);
            setCookie(c, "auth_token", result.token, {
                httpOnly: true,
                secure: isHttpsRequest(c),
                sameSite: "Strict",
                path: "/",
                maxAge: 86400,
            });
            return c.json(result);
        } catch (error) {
            // A wrong password surfaces as a plain Error, not a ServiceError;
            // count it toward the lockout. Config/dependency errors (e.g.
            // missing ADMIN_PASSWORD) are not failed attempts.
            if (!(error instanceof ServiceError)) {
                await services.loginThrottle?.recordFailure(clientIp);
            }
            if (error instanceof ServiceError) {
                return handleError(c, error, runtime.logger);
            }
            return c.text(error.message, 401);
        }
    });

    // Logout API
    app.post("/api/logout", async (c) => {
        const token = extractBearerToken(c) || getCookie(c, "auth_token");
        if (token) {
            await services.auth.logout(token);
        }
        deleteCookie(c, "auth_token", {
            secure: isHttpsRequest(c),
            sameSite: "Strict",
            path: "/",
        });
        return c.json({ success: true });
    });

    // Auth check middleware for protected pages
    const requireAuth = async (c, next) => {
        const token = extractBearerToken(c) || getCookie(c, "auth_token");
        const isValid = await services.auth.verifyToken(token);
        if (!isValid) {
            return c.redirect("/login");
        }
        await next();
    };

    // API auth middleware - returns 401 JSON for API endpoints
    const requireApiAuth = async (c, next) => {
        const token = extractBearerToken(c);
        const isValid = await services.auth.verifyToken(token);
        if (!isValid) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        await next();
    };

    // Protected pages
    app.get("/", requireAuth, (c) => {
        return c.html(
            <Layout title="仪表盘" activePage="仪表盘">
                <DashboardPage />
            </Layout>,
        );
    });

    app.get("/subscriptions", requireAuth, (c) => {
        return c.html(
            <Layout title="订阅管理" activePage="订阅管理">
                <SubscriptionsPage />
            </Layout>,
        );
    });

    // API: Save VLESS config (requires auth)
    app.post("/config", requireApiAuth, async (c) => {
        try {
            const { vlessLinks, name, nodes } = parseSubscriptionPayload(
                await c.req.json(),
            );
            const storage = requireConfigStorage(services.configStorage);
            const configId = await storage.saveConfig(
                "vless",
                vlessLinks,
                name,
                nodes,
            );
            return c.text(configId);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return c.text(`Invalid format: ${error.message}`, 400);
            }
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Get subscription (public - link itself is credential)
    app.get("/sub", async (c) => {
        try {
            const configId = c.req.query("id");
            if (!configId) {
                return c.text("Missing id parameter", 400);
            }

            const storage = requireConfigStorage(services.configStorage);
            const vlessLinks = await storage.getConfigById(configId);
            if (!vlessLinks) {
                return c.text("Config not found", 404);
            }

            const meta = await storage.getConfigMeta(configId);
            const rawName = meta?.name || configId;
            const safeAsciiName = `${rawName.replace(/[^\w.-]/g, "_") || "config"}.yaml`;
            const encodedName = `${encodeURIComponent(rawName)}.yaml`;

            const ua = c.req.header("User-Agent") || "curl/7.74.0";
            const builder = new SimpleClashConfigBuilder(vlessLinks, ua);
            await builder.build();
            return c.text(builder.formatConfig(), 200, {
                "Content-Type": "text/yaml; charset=utf-8",
                "Content-Disposition": `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
                "Profile-Update-Interval": "24",
                "Subscription-Userinfo":
                    "upload=0; download=0; total=1073741824000; expire=0",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            });
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: List subscriptions (requires auth)
    app.get("/api/subscriptions", requireApiAuth, async (c) => {
        try {
            const storage = requireConfigStorage(services.configStorage);
            const configs = await storage.listConfigs("vless");
            return c.json(configs);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Delete subscription (requires auth)
    app.delete("/api/subscriptions/:id", requireApiAuth, async (c) => {
        try {
            const configId = c.req.param("id");
            const storage = requireConfigStorage(services.configStorage);
            await storage.deleteConfig(configId);
            return c.text("Deleted", 200);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Get single subscription detail (requires auth)
    app.get("/api/subscriptions/:id", requireApiAuth, async (c) => {
        try {
            const configId = c.req.param("id");
            const storage = requireConfigStorage(services.configStorage);
            const config = await storage.getConfig(configId);
            if (!config) {
                return c.json({ error: "Config not found" }, 404);
            }
            return c.json(config);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Update subscription (requires auth)
    app.put("/api/subscriptions/:id", requireApiAuth, async (c) => {
        try {
            const configId = c.req.param("id");
            const { vlessLinks, name, nodes } = parseSubscriptionPayload(
                await c.req.json(),
            );
            const storage = requireConfigStorage(services.configStorage);
            const updatedId = await storage.updateConfig(
                configId,
                vlessLinks,
                name,
                nodes,
            );
            return c.text(updatedId);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return c.text(`Invalid format: ${error.message}`, 400);
            }
            return handleError(c, error, runtime.logger);
        }
    });

    // API: Parse proxy links and return node info (requires auth)
    app.post("/api/parse-nodes", requireApiAuth, async (c) => {
        try {
            const body = await c.req.json();
            const rawLinks = body?.links || body?.vlessLinks;
            const dedup = body?.dedup ?? true;
            if (!rawLinks) {
                return c.json({ error: "Missing links parameter" }, 400);
            }

            const nodes = parseProxyNodes(rawLinks, { dedup });
            return c.json(nodes);
        } catch (error) {
            return handleError(c, error, runtime.logger);
        }
    });

    // Favicon
    app.get("/favicon.ico", async (c) => {
        if (!runtime.assetFetcher) {
            return c.notFound();
        }
        try {
            return await runtime.assetFetcher(c.req.raw);
        } catch (error) {
            runtime.logger.warn("Asset fetch failed", error);
            return c.notFound();
        }
    });

    return app;
}

function extractBearerToken(c) {
    const authorization = c.req.header("Authorization");
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    return match?.[1].trim() || undefined;
}

function isHttpsRequest(c) {
    try {
        return new URL(c.req.url).protocol === "https:";
    } catch {
        // Malformed request URLs must not break cookie attributes.
        return false;
    }
}

function getClientIp(c) {
    return (
        c.req.header("CF-Connecting-IP") ||
        c.req.header("X-Forwarded-For")?.split(",")[0].trim() ||
        ""
    );
}

function parseSubscriptionPayload(body) {
    const rawLinks = body?.links || body?.vlessLinks;
    const { name, dedup = true } = body ?? {};
    if (!rawLinks || typeof rawLinks !== "string") {
        throw new InvalidPayloadError("Missing links parameter");
    }
    const normalizedLinks = normalizeProxyLinks(rawLinks, { dedup });
    const nodes = parseProxyNodes(normalizedLinks, { dedup: false });
    if (nodes.length === 0) {
        throw new InvalidPayloadError("No valid proxy links found");
    }
    return { vlessLinks: normalizedLinks, links: normalizedLinks, name, nodes };
}

function requireConfigStorage(service) {
    if (!service) {
        throw new MissingDependencyError(
            "Config storage functionality is unavailable",
        );
    }
    return service;
}

function handleError(c, error, logger) {
    if (error instanceof ServiceError) {
        return c.text(error.message, error.status);
    }
    logger.error?.("Unhandled error", error);
    return c.text(`Error: ${error.message}`, 500);
}
