import { describe, it, expect } from "vitest";
import dashboardSource from "../public/dashboard.js?raw";
import { createApp } from "../src/app/createApp.jsx";
import { MemoryKVAdapter } from "../src/adapters/kv/memoryKv.js";

const runtime = {
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: {
        configTtlSeconds: 60,
        shortLinkTtlSeconds: null,
        allowUnauthenticated: true,
    },
};

const app = createApp(runtime);

describe("Worker", () => {
    it("responds with HTML on root path", async () => {
        const res = await app.request("http://example.com/");
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/html");
        const text = await res.text();
        expect(text).toContain("<html");
    });

    it("responds with 404 for unknown paths", async () => {
        const res = await app.request("http://example.com/unknown-path");
        expect(res.status).toBe(404);
    });

    it("references an external dashboard script with valid syntax", async () => {
        const res = await app.request("http://example.com/");
        const html = await res.text();
        // Hono JSX renders the boolean `defer` attribute as defer="".
        expect(html).toMatch(
            /<script src="\/dashboard\.js" defer="?"?>?<\/script>/,
        );

        // ?raw inlines the file at build time, so no sandbox FS access is
        // needed inside the Workers test pool.
        expect(dashboardSource.length).toBeGreaterThan(1000);
        expect(() => new Function(dashboardSource)).not.toThrow();
    });
});

describe("Authentication", () => {
    it("rejects the no-auth token when a password is configured", async () => {
        const app = createApp({
            kv: new MemoryKVAdapter(),
            config: { adminPassword: "secret" },
        });

        const res = await app.request("http://example.com/api/subscriptions", {
            headers: { Authorization: "Bearer no-auth" },
        });

        expect(res.status).toBe(401);
    });

    it("creates a secure session cookie and requires a bearer token for APIs", async () => {
        const app = createApp({
            kv: new MemoryKVAdapter(),
            config: { adminPassword: "secret" },
        });
        const loginRes = await app.request("https://example.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: "secret" }),
        });
        const { token } = await loginRes.json();
        const cookie = loginRes.headers.get("set-cookie");

        expect(loginRes.status).toBe(200);
        expect(token).toMatch(/^[A-Za-z0-9]{32}$/);
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Secure");
        expect(cookie).toContain("SameSite=Strict");

        const cookieOnlyRes = await app.request(
            "https://example.com/api/subscriptions",
            {
                headers: { Cookie: `auth_token=${token}` },
            },
        );
        expect(cookieOnlyRes.status).toBe(401);

        const bearerRes = await app.request(
            "https://example.com/api/subscriptions",
            {
                headers: { Authorization: `Bearer ${token}` },
            },
        );
        expect(bearerRes.status).toBe(200);
    });

    it("fails closed when neither a password nor explicit opt-out is configured", async () => {
        const app = createApp({ kv: new MemoryKVAdapter() });
        const res = await app.request("http://example.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: "" }),
        });

        expect(res.status).toBe(501);
        expect(await res.text()).toBe("ADMIN_PASSWORD is not configured");
    });
});
