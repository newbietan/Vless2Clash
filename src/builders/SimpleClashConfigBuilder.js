import yaml from "js-yaml";
import { deepCopy } from "../utils.js";
import { parseLinkToClash } from "../parsers/linkParser.js";

const SIMPLE_CLASH_CONFIG = {
    "mixed-port": 7890,
    "allow-lan": true,
    mode: "rule",
    "log-level": "info",
    "unified-delay": true,
    "tcp-concurrent": true,
    "external-controller": "0.0.0.0:9090",
    dns: {
        enable: true,
        listen: "0.0.0.0:1053",
        ipv6: false,
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        nameserver: ["223.5.5.5", "119.29.29.29"],
        fallback: ["8.8.8.8", "1.1.1.1"],
        "fallback-filter": {
            geoip: true,
            "geoip-code": "CN",
        },
    },
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
        await this.parseLinks();
        this.addProxyGroups();
        this.addRules();
        return this.formatConfig();
    }

    async parseLinks() {
        const input = this.inputString || "";
        const lines = input.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
            const trimmedLine = line.trim();
            const converted = parseLinkToClash(trimmedLine);
            if (converted && converted.name) {
                this.addProxyWithDedup(converted);
            }
        }
    }

    // Maintain backward compatibility for callers expecting parseVlessLinks
    async parseVlessLinks() {
        return this.parseLinks();
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

        // Exactly one selectable group containing all parsed nodes and direct fallback.
        this.config["proxy-groups"].push({
            type: "select",
            name: "PROXY",
            proxies:
                proxyNames.length > 0 ? [...proxyNames, "DIRECT"] : ["DIRECT"],
        });
    }

    addRules() {
        // Standard Clash / OpenClash routing: LAN & CN traffic direct, everything else proxies.
        this.config.rules = [
            "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
            "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
            "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
            "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
            "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
            "IP-CIDR6,::1/128,DIRECT,no-resolve",
            "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
            "IP-CIDR6,fe80::/10,DIRECT,no-resolve",
            "IP-CIDR6,fd00::/8,DIRECT,no-resolve",
            "DOMAIN-SUFFIX,cn,DIRECT",
            "GEOIP,CN,DIRECT",
            "MATCH,PROXY",
        ];
    }

    formatConfig() {
        return yaml.dump(this.config);
    }
}
