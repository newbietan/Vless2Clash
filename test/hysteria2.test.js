import { describe, it, expect } from "vitest";
import yaml from "js-yaml";
import {
    parseHysteria2,
    convertHysteria2ForClash,
} from "../src/parsers/protocols/hysteria2Parser.js";
import {
    collectLinks,
    parseProxyNodes,
    normalizeProxyLinks,
} from "../src/parsers/linkParser.js";
import { SimpleClashConfigBuilder } from "../src/builders/SimpleClashConfigBuilder.js";
import { createApp } from "../src/app/createApp.jsx";
import { MemoryKVAdapter } from "../src/adapters/kv/memoryKv.js";

describe("Hysteria 2 Parser", () => {
    it("should parse standard hysteria2 URI correctly", () => {
        const uri =
            "hysteria2://secret-pass@hy2.example.com:8443?sni=sni.example.com&insecure=1&mport=10000-20000&obfs=salamander&obfs-password=obfspass&alpn=h3&fastopen=1#Test-Hy2";
        const proxy = parseHysteria2(uri);

        expect(proxy.type).toBe("hysteria2");
        expect(proxy.tag).toBe("Test-Hy2");
        expect(proxy.server).toBe("hy2.example.com");
        expect(proxy.server_port).toBe(8443);
        expect(proxy.password).toBe("secret-pass");
        expect(proxy.sni).toBe("sni.example.com");
        expect(proxy.skip_cert_verify).toBe(true);
        expect(proxy.ports).toBe("10000-20000");
        expect(proxy.obfs).toBe("salamander");
        expect(proxy.obfs_password).toBe("obfspass");
        expect(proxy.alpn).toEqual(["h3"]);
        expect(proxy.fast_open).toBe(true);
    });

    it("should parse hy2:// alias scheme and default port 443", () => {
        const uri = "hy2://pwd@example.org#Hy2-Alias";
        const proxy = parseHysteria2(uri);

        expect(proxy.type).toBe("hysteria2");
        expect(proxy.tag).toBe("Hy2-Alias");
        expect(proxy.server).toBe("example.org");
        expect(proxy.server_port).toBe(443);
        expect(proxy.password).toBe("pwd");
        expect(proxy.skip_cert_verify).toBe(false);
    });

    it("should convert Hysteria 2 proxy to Clash.Meta format", () => {
        const uri =
            "hysteria2://mypass@server.com:443?sni=server.com&insecure=1&ports=20000-30000&obfs=salamander&obfs-password=xyz#Clash-Node";
        const proxy = parseHysteria2(uri);
        const clash = convertHysteria2ForClash(proxy);

        expect(clash.name).toBe("Clash-Node");
        expect(clash.type).toBe("hysteria2");
        expect(clash.server).toBe("server.com");
        expect(clash.port).toBe(443);
        expect(clash.password).toBe("mypass");
        expect(clash.sni).toBe("server.com");
        expect(clash["skip-cert-verify"]).toBe(true);
        expect(clash.ports).toBe("20000-30000");
        expect(clash.obfs).toBe("salamander");
        expect(clash["obfs-password"]).toBe("xyz");
    });

    it("should throw TypeError on invalid URI protocol", () => {
        expect(() => parseHysteria2("vless://uuid@host:443")).toThrow(
            TypeError,
        );
        expect(() => parseHysteria2("invalid-link")).toThrow(TypeError);
    });
});

describe("Link Dispatcher and Aggregation", () => {
    const mixedInput = `
vless://uuid-1@vless.com:443?security=tls#Vless-Node
hysteria2://pwd-1@hy2.com:8443?sni=hy2.com#Hy2-Node
hy2://pwd-1@hy2.com:8443?sni=hy2.com#Hy2-Dup
unsupported://foo@bar:443
`;

    it("should parse and deduplicate mixed protocol nodes", () => {
        const nodes = parseProxyNodes(mixedInput, { dedup: true });
        expect(nodes.length).toBe(2);
        expect(nodes[0].protocol).toBe("VLESS");
        expect(nodes[0].name).toBe("Vless-Node");
        expect(nodes[1].protocol).toBe("HYSTERIA2");
        expect(nodes[1].name).toBe("Hy2-Node");
    });

    it("should normalize mixed protocol links", () => {
        const normalized = normalizeProxyLinks(mixedInput, { dedup: true });
        const lines = normalized.split("\n");
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain("vless://");
        expect(lines[1]).toContain("hysteria2://");
    });
});

describe("SimpleClashConfigBuilder with Hysteria 2", () => {
    it("should build Clash config containing both VLESS and Hysteria 2 nodes", async () => {
        const links = `vless://uuid1@server1.com:443?security=tls&sni=server1.com#Vless-1
hysteria2://pass2@server2.com:8443?sni=server2.com#Hy2-2`;

        const builder = new SimpleClashConfigBuilder(links, "test-agent");
        await builder.build();
        const config = yaml.load(builder.formatConfig());

        expect(config.proxies.length).toBe(2);
        expect(config.proxies[0].type).toBe("vless");
        expect(config.proxies[0].name).toBe("Vless-1");
        expect(config.proxies[1].type).toBe("hysteria2");
        expect(config.proxies[1].name).toBe("Hy2-2");

        const proxyGroup = config["proxy-groups"].find(
            (g) => g.name === "PROXY",
        );
        expect(proxyGroup.proxies).toContain("Vless-1");
        expect(proxyGroup.proxies).toContain("Hy2-2");
        expect(proxyGroup.proxies).toContain("DIRECT");
    });
});

describe("API End-to-End with Hysteria 2", () => {
    function createTestApp() {
        const kv = new MemoryKVAdapter();
        const app = createApp({
            kv,
            config: {
                allowUnauthenticated: true,
                adminPassword: "",
            },
        });
        return { app, kv };
    }

    it("should create, parse and fetch subscription with Hysteria 2 nodes", async () => {
        const { app } = createTestApp();

        const mixedLinks = `vless://uuid@vless.example.com:443?security=tls#Vless-Node
hysteria2://secret@hy2.example.com:443?insecure=1#Hy2-Node`;

        // 1. Test /api/parse-nodes
        const parseRes = await app.request(
            "http://example.com/api/parse-nodes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ links: mixedLinks }),
            },
        );
        expect(parseRes.status).toBe(200);
        const parsedNodes = await parseRes.json();
        expect(parsedNodes.length).toBe(2);
        expect(parsedNodes.some((n) => n.protocol === "HYSTERIA2")).toBe(true);

        // 2. Test /config creation
        const saveRes = await app.request("http://example.com/config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                links: mixedLinks,
                name: "Hy2 Test Sub",
            }),
        });
        expect(saveRes.status).toBe(200);
        const configId = await saveRes.text();
        expect(configId).toBeTruthy();

        // 3. Test /sub retrieval
        const subRes = await app.request(
            `http://example.com/sub?id=${configId}`,
        );
        expect(subRes.status).toBe(200);
        const yamlText = await subRes.text();
        const clashConfig = yaml.load(yamlText);
        expect(clashConfig.proxies.length).toBe(2);
        expect(clashConfig.proxies[1].type).toBe("hysteria2");
        expect(clashConfig.proxies[1].password).toBe("secret");
        expect(clashConfig.proxies[1]["skip-cert-verify"]).toBe(true);

        // 4. Test /api/subscriptions/:id update
        const updatedLinks = `${mixedLinks}\nhysteria2://another-pass@hk.example.com:443#HK-Hy2`;
        const updateRes = await app.request(
            `http://example.com/api/subscriptions/${configId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    links: updatedLinks,
                    name: "Updated Sub",
                }),
            },
        );
        expect(updateRes.status).toBe(200);

        // Verify updated sub
        const updatedSubRes = await app.request(
            `http://example.com/sub?id=${configId}`,
        );
        const updatedYaml = yaml.load(await updatedSubRes.text());
        expect(updatedYaml.proxies.length).toBe(3);
        expect(updatedYaml.proxies[2].name).toBe("HK-Hy2");
    });

    it("should correctly handle IPv6 and ports/obfs parameters", () => {
        const ipv6Uri =
            "hysteria2://pass@[2001:db8::1]:443?mport=20000-30000&obfs=salamander&obfs-password=pwd123#IPv6-Node";
        const proxy = parseHysteria2(ipv6Uri);
        expect(proxy.server).toBe("2001:db8::1");
        expect(proxy.ports).toBe("20000-30000");
        expect(proxy.obfs).toBe("salamander");
        expect(proxy.obfs_password).toBe("pwd123");

        const clash = convertHysteria2ForClash(proxy);
        expect(clash.server).toBe("2001:db8::1");
        expect(clash.ports).toBe("20000-30000");
        expect(clash.obfs).toBe("salamander");
        expect(clash["obfs-password"]).toBe("pwd123");
    });

    it("should infer region correctly for Hysteria 2 nodes", () => {
        const nodes = parseProxyNodes(
            "hysteria2://p@jp.node.com:443#东京-01\nhysteria2://p@us.node.com:443#US-02",
        );
        expect(nodes[0].region).toBe("JP");
        expect(nodes[1].region).toBe("US");
    });
});
