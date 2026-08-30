import { describe, it, expect } from "vitest";
import yaml from "js-yaml";
import { SimpleClashConfigBuilder } from "../src/builders/SimpleClashConfigBuilder.js";
import { createApp } from "../src/app/createApp.jsx";
import { MemoryKVAdapter } from "../src/adapters/kv/memoryKv.js";
import { parseVlessLinks } from "../src/parsers/protocols/vlessParser.js";

describe("SimpleClashConfigBuilder", () => {
    it("should parse VLESS links and generate simplified Clash config", async () => {
        const vlessLink =
            "vless://uuid@example.com:443?security=tls&sni=example.com&type=ws&path=/ws#Test-Node";

        const builder = new SimpleClashConfigBuilder(vlessLink, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        // Check basic structure
        expect(config).toBeDefined();
        expect(config.proxies).toBeDefined();
        expect(config["proxy-groups"]).toBeDefined();
        expect(config.rules).toBeDefined();

        // Check proxy was added
        expect(config.proxies.length).toBe(1);
        expect(config.proxies[0].name).toBe("Test-Node");
        expect(config.proxies[0].type).toBe("vless");
        expect(config.proxies[0].server).toBe("example.com");
        expect(config.proxies[0].port).toBe(443);
        expect(config.proxies[0]["client-fingerprint"]).toBe("chrome");

        // Check proxy groups
        const proxyGroup = config["proxy-groups"].find(
            (g) => g.name === "PROXY",
        );
        expect(proxyGroup).toBeDefined();
        expect(proxyGroup.proxies).toContain("Test-Node");
        expect(proxyGroup.proxies).toContain("DIRECT");

        const aiGroup = config["proxy-groups"].find((g) => g.name === "AI");
        expect(aiGroup).toBeDefined();
        expect(aiGroup.proxies).toContain("Test-Node");
        expect(aiGroup.proxies).toContain("DIRECT");

        // AI traffic must route to its own group, not PROXY.
        expect(config.rules).toContain("GEOSITE,openai,AI");
        expect(config.rules).toContain("DOMAIN-SUFFIX,anthropic.com,AI");

        // Check rules use GEOSITE/GEOIP
        expect(config.rules).toContain("GEOSITE,cn,DIRECT");
        expect(config.rules).toContain("GEOIP,CN,DIRECT,no-resolve");
        expect(config.rules).toContain("MATCH,PROXY");
    });

    it("should handle multiple VLESS links", async () => {
        const vlessLinks = `vless://uuid1@server1.com:443?security=tls&sni=server1.com#Node-1
vless://uuid2@server2.com:443?security=tls&sni=server2.com#Node-2`;

        const builder = new SimpleClashConfigBuilder(vlessLinks, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies.length).toBe(2);
        expect(config.proxies[0].name).toBe("Node-1");
        expect(config.proxies[1].name).toBe("Node-2");

        const proxyGroup = config["proxy-groups"].find(
            (g) => g.name === "PROXY",
        );
        expect(proxyGroup.proxies).toContain("Node-1");
        expect(proxyGroup.proxies).toContain("Node-2");
        expect(proxyGroup.proxies).toContain("DIRECT");
    });

    it("should handle empty input", async () => {
        const builder = new SimpleClashConfigBuilder("", "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies.length).toBe(0);
        expect(config["proxy-groups"].length).toBe(2);
        expect(config["proxy-groups"].map((g) => g.name)).toEqual([
            "PROXY",
            "AI",
        ]);
        expect(config.rules).toContain("MATCH,PROXY");
    });

    it("should handle non-VLESS links gracefully", async () => {
        const input = `ss://invalid-link
not-a-link
vless://uuid@example.com:443?security=tls#Valid-Node`;

        const builder = new SimpleClashConfigBuilder(input, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies.length).toBe(1);
        expect(config.proxies[0].name).toBe("Valid-Node");
    });

    it("should handle xhttp transport type", async () => {
        const vlessLink =
            "vless://uuid@example.com:443?security=tls&sni=example.com&type=xhttp#XHTTP-Node";

        const builder = new SimpleClashConfigBuilder(vlessLink, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies.length).toBe(1);
        expect(config.proxies[0].network).toBe("xhttp");
        expect(config.proxies[0]["xhttp-opts"]).toBeDefined();
        expect(config.proxies[0]["xhttp-opts"].path).toBe("/vless-xhttp");
        expect(config.proxies[0]["xhttp-opts"].mode).toBe("auto");
    });

    it("should handle reality security", async () => {
        const vlessLink =
            "vless://uuid@example.com:443?security=reality&sni=example.com&pbk=publickey&sid=shortid#Reality-Node";

        const builder = new SimpleClashConfigBuilder(vlessLink, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies.length).toBe(1);
        expect(config.proxies[0]["reality-opts"]).toBeDefined();
        expect(config.proxies[0]["reality-opts"]["public-key"]).toBe(
            "publickey",
        );
        expect(config.proxies[0]["reality-opts"]["short-id"]).toBe("shortid");
    });

    it("should preserve labels when the URI has no query string", async () => {
        const builder = new SimpleClashConfigBuilder(
            "vless://uuid@example.com:443#No-Query",
            "test-agent",
        );
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies).toHaveLength(1);
        expect(config.proxies[0].name).toBe("No-Query");
    });

    it("should parse false boolean flags and emit udp correctly", async () => {
        const link =
            "vless://uuid@example.com:443?security=tls&allowInsecure=false&udp=1#Flags";
        const builder = new SimpleClashConfigBuilder(link, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies[0]["skip-cert-verify"]).toBeUndefined();
        expect(config.proxies[0].udp).toBe(true);
    });

    it("should retain all original VLESS query parameters in node metadata", () => {
        const link =
            "vless://uuid@example.com:443?security=reality&pbk=publickey&sid=shortid&fp=firefox&type=ws&path=%2Fws#Reality";
        const [node] = parseVlessLinks(link);

        expect(Object.fromEntries(node.params)).toMatchObject({
            security: "reality",
            pbk: "publickey",
            sid: "shortid",
            fp: "firefox",
            type: "ws",
            path: "/ws",
        });
    });
});

describe("/sub endpoint integration", () => {
    const runtime = {
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: {
            configTtlSeconds: 60,
            shortLinkTtlSeconds: null,
            adminPassword: "",
            allowUnauthenticated: true,
        },
    };

    const app = createApp(runtime);

    it("should return 400 when id is missing", async () => {
        const res = await app.request("http://example.com/sub");
        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toBe("Missing id parameter");
    });

    it("should return 404 for non-existent config", async () => {
        const res = await app.request("http://example.com/sub?id=nonexistent");
        expect(res.status).toBe(404);
        const text = await res.text();
        expect(text).toBe("Config not found");
    });

    it("should save VLESS links and return valid Clash YAML via /sub", async () => {
        const vlessLinks =
            "vless://uuid@example.com:443?security=tls&sni=example.com&type=ws&path=/ws#Test-Node";

        const saveRes = await app.request("http://example.com/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vlessLinks }),
        });

        expect(saveRes.status).toBe(200);
        const configId = await saveRes.text();
        expect(configId).toBeTruthy();

        const subRes = await app.request(
            `http://example.com/sub?id=${configId}`,
        );
        expect(subRes.status).toBe(200);
        expect(subRes.headers.get("content-type")).toContain("text/yaml");

        const text = await subRes.text();
        const config = yaml.load(text);

        expect(config.proxies).toBeDefined();
        expect(config.proxies.length).toBe(1);
        expect(config.proxies[0].name).toBe("Test-Node");
        expect(config.proxies[0].type).toBe("vless");

        expect(config["proxy-groups"]).toBeDefined();
        expect(config["proxy-groups"].some((g) => g.name === "PROXY")).toBe(
            true,
        );

        expect(config.rules).toBeDefined();
        expect(config.rules).toContain("MATCH,PROXY");
    });

    it("should handle multiple VLESS links", async () => {
        const links = `vless://uuid1@server1.com:443?security=tls&sni=server1.com#Node-1
vless://uuid2@server2.com:443?security=tls&sni=server2.com#Node-2`;

        const saveRes = await app.request("http://example.com/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vlessLinks: links }),
        });
        expect(saveRes.status).toBe(200);
        const configId = await saveRes.text();

        const subRes = await app.request(
            `http://example.com/sub?id=${configId}`,
        );
        expect(subRes.status).toBe(200);

        const text = await subRes.text();
        const config = yaml.load(text);

        expect(config.proxies.length).toBe(2);
    });

    it("should update an existing subscription without changing its id", async () => {
        const saveRes = await app.request("http://example.com/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vlessLinks: "vless://uuid@old.example.com:443#Old",
            }),
        });
        const configId = await saveRes.text();

        const updateRes = await app.request(
            `http://example.com/api/subscriptions/${configId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vlessLinks: "vless://uuid@new.example.com:443#New",
                }),
            },
        );
        const subRes = await app.request(
            `http://example.com/sub?id=${configId}`,
        );
        const config = yaml.load(await subRes.text());

        expect(updateRes.status).toBe(200);
        expect(await updateRes.text()).toBe(configId);
        expect(config.proxies[0].server).toBe("new.example.com");
        expect(config.proxies[0].name).toBe("New");
    });

    it("should keep concurrent index entries independent and hide stale entries", async () => {
        const kv = new MemoryKVAdapter();
        const indexedApp = createApp({
            kv,
            config: { allowUnauthenticated: true, configTtlSeconds: 60 },
        });
        const links = [
            "vless://uuid1@one.example.com:443#One",
            "vless://uuid2@two.example.com:443#Two",
        ];
        const ids = await Promise.all(
            links.map(async (vlessLinks) => {
                const res = await indexedApp.request(
                    "http://example.com/config",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ vlessLinks }),
                    },
                );
                return res.text();
            }),
        );

        const listRes = await indexedApp.request(
            "http://example.com/api/subscriptions",
        );
        expect(await listRes.json()).toHaveLength(2);
        expect(await kv.get("config_index")).toBeNull();

        await kv.delete(ids[0]);
        await kv.delete(`meta:${ids[0]}`);
        const prunedRes = await indexedApp.request(
            "http://example.com/api/subscriptions",
        );
        expect(await prunedRes.json()).toHaveLength(1);
    });
});

describe("Page routes", () => {
    const runtime = {
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: {
            configTtlSeconds: 60,
            shortLinkTtlSeconds: null,
            adminPassword: "",
            allowUnauthenticated: true,
        },
    };

    const app = createApp(runtime);

    it("should render Dashboard page", async () => {
        const res = await app.request("http://example.com/");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("仪表盘");
        expect(html).toContain("输入 VLESS 链接");
    });

    it("should render Subscriptions page", async () => {
        const res = await app.request("http://example.com/subscriptions");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("订阅管理");
        expect(html).toContain("新建订阅");
    });
});
