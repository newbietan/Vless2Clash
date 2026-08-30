import yaml from "js-yaml";
import { deepCopy } from "../utils.js";
import {
    parseVless,
    convertProxyForClash,
} from "../parsers/protocols/vlessParser.js";

const SIMPLE_CLASH_CONFIG = {
    "mixed-port": 7890,
    "allow-lan": true,
    mode: "Rule",
    "log-level": "info",
    "unified-delay": true,
    "tcp-concurrent": true,
    sniffer: {
        enable: true,
        sniff: {
            HTTP: { ports: [80, 8080] },
            TLS: { ports: [443, 8443] },
            QUIC: { ports: [443, 8443] },
        },
        "skip-domain": ["Mijia Cloud"],
    },
    proxies: [],
    "proxy-groups": [],
};

export class SimpleClashConfigBuilder {
    constructor(inputString, userAgent) {
        this.inputString = inputString;
        this.userAgent = userAgent;
        this.config = deepCopy(SIMPLE_CLASH_CONFIG);
        this.proxies = [];
    }

    async build() {
        await this.parseVlessLinks();
        this.addProxyGroups();
        this.addRules();
        return this.formatConfig();
    }

    async parseVlessLinks() {
        const input = this.inputString || "";
        const lines = input.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("vless://")) {
                try {
                    const proxy = parseVless(trimmedLine);
                    if (proxy && proxy.tag) {
                        const converted = this.convertProxy(proxy);
                        if (converted) {
                            this.addProxyWithDedup(converted);
                        }
                    }
                } catch (error) {
                    console.warn("Failed to parse VLESS link:", error.message);
                }
            }
        }
    }

    convertProxy(proxy) {
        return convertProxyForClash(proxy);
    }

    addProxyWithDedup(proxy) {
        const existingIndex = this.config.proxies.findIndex(
            (p) => p.name === proxy.name,
        );
        if (existingIndex >= 0) {
            const { name: _name, ...restOfNew } = proxy;
            const { name: __name, ...restOfExisting } =
                this.config.proxies[existingIndex];
            if (JSON.stringify(restOfNew) !== JSON.stringify(restOfExisting)) {
                let suffix = 2;
                let newName = `${proxy.name}_${suffix}`;
                while (this.config.proxies.some((p) => p.name === newName)) {
                    suffix++;
                    newName = `${proxy.name}_${suffix}`;
                }
                proxy.name = newName;
                this.config.proxies.push(proxy);
            }
        } else {
            this.config.proxies.push(proxy);
        }
    }

    addProxyGroups() {
        const proxyNames = this.config.proxies.map((p) => p.name);

        // Only two selectable groups are needed: one for AI traffic (so it
        // can pin a different node than the default), one for all remaining
        // foreign traffic. Domestic traffic goes to the built-in DIRECT.
        this.config["proxy-groups"].push(
            {
                type: "select",
                name: "PROXY",
                proxies: [...proxyNames, "DIRECT"],
                lazy: false,
            },
            {
                type: "select",
                name: "AI",
                proxies: [...proxyNames, "DIRECT"],
            },
        );
    }

    addRules() {
        // Domestic sites are routed via geosite/geoip CN instead of a
        // hardcoded domain list, which would go stale and is unmaintainable.
        // Only AI domains need explicit rules so AI traffic can be pinned to
        // its own group; everything else falls through to PROXY.
        this.config.rules = [
            "GEOSITE,private,DIRECT",
            "GEOIP,private,DIRECT,no-resolve",
            "GEOSITE,category-ads-all,REJECT",
            "GEOSITE,cn,DIRECT",
            "GEOIP,CN,DIRECT,no-resolve",
            // AI services (separate group so they can use a dedicated node)
            "GEOSITE,openai,AI",
            "DOMAIN-SUFFIX,anthropic.com,AI",
            "DOMAIN-SUFFIX,claude.ai,AI",
            "DOMAIN-SUFFIX,oaistatic.com,AI",
            "DOMAIN-SUFFIX,oaiusercontent.com,AI",
            "DOMAIN-SUFFIX,cursor.sh,AI",
            "DOMAIN-SUFFIX,cursor.com,AI",
            "DOMAIN-SUFFIX,generativelanguage.googleapis.com,AI",
            // All remaining foreign traffic
            "GEOSITE,geolocation-!cn,PROXY",
            "MATCH,PROXY",
        ];
    }

    formatConfig() {
        return yaml.dump(this.config);
    }
}
