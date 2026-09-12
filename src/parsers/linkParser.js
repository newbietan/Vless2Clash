import {
    convertProxyForClash,
    guessRegion,
    parseVless,
} from "./protocols/vlessParser.js";
import {
    convertHysteria2ForClash,
    parseHysteria2,
    parseHysteria2Uri,
} from "./protocols/hysteria2Parser.js";

// Check whether a line represents a known proxy URI
export function isSupportedLink(line) {
    const trimmed = (line || "").trim();
    return (
        trimmed.startsWith("vless://") ||
        trimmed.startsWith("hysteria2://") ||
        trimmed.startsWith("hy2://")
    );
}

// Identify protocol family from raw line
export function detectProtocol(line) {
    const trimmed = (line || "").trim();
    if (trimmed.startsWith("vless://")) return "vless";
    if (trimmed.startsWith("hysteria2://") || trimmed.startsWith("hy2://")) {
        return "hysteria2";
    }
    return null;
}

// Parse a single raw line directly to Clash proxy configuration
export function parseLinkToClash(line) {
    const protocol = detectProtocol(line);
    if (!protocol) return null;

    try {
        if (protocol === "vless") {
            const rawProxy = parseVless(line.trim());
            return convertProxyForClash(rawProxy);
        }
        if (protocol === "hysteria2") {
            const rawProxy = parseHysteria2(line.trim());
            return convertHysteria2ForClash(rawProxy);
        }
    } catch {
        // Silently drop malformed lines
    }
    return null;
}

// Collect and deduplicate links from multiline input
export function collectLinks(input, { dedup = true } = {}) {
    const lines = (input || "").split("\n");
    const entries = [];
    const seen = new Set();

    for (const rawLine of lines) {
        const line = rawLine.trim();
        const protocol = detectProtocol(line);
        if (!protocol) continue;

        try {
            let dedupKey = "";
            let nodeMeta = null;
            let clashProxy = null;

            if (protocol === "vless") {
                const intermediate = parseVless(line);
                clashProxy = convertProxyForClash(intermediate);
                dedupKey = `vless:${intermediate.server}:${intermediate.server_port}:${intermediate.uuid}`;

                const url = new URL(line);
                const params = Object.fromEntries(url.searchParams.entries());
                nodeMeta = {
                    name: intermediate.tag,
                    uuid: intermediate.uuid,
                    server: intermediate.server,
                    port: intermediate.server_port,
                    protocol: "VLESS",
                    transport: params.type || "tcp",
                    security: params.security || "none",
                    sni: params.sni || "",
                    path: params.path || "",
                    host: params.host || "",
                    serviceName: params.serviceName || "",
                    flow: intermediate.flow || "",
                    region: guessRegion(intermediate.server, intermediate.tag),
                    params: Array.from(url.searchParams.entries()),
                };
            } else if (protocol === "hysteria2") {
                const intermediate = parseHysteria2(line);
                clashProxy = convertHysteria2ForClash(intermediate);
                dedupKey = `hysteria2:${intermediate.server}:${intermediate.server_port}:${intermediate.password}`;

                const parsedUri = parseHysteria2Uri(line);
                const insecure = Boolean(intermediate.skip_cert_verify);
                nodeMeta = {
                    name: intermediate.tag,
                    uuid: intermediate.password,
                    server: intermediate.server,
                    port: intermediate.server_port,
                    protocol: "HYSTERIA2",
                    transport: "udp",
                    security: insecure ? "insecure" : "tls",
                    sni: intermediate.sni || "",
                    path: "",
                    host: "",
                    serviceName: "",
                    flow: "",
                    region: guessRegion(intermediate.server, intermediate.tag),
                    params: parsedUri.paramEntries,
                    ports: intermediate.ports || "",
                    obfs: intermediate.obfs || "",
                };
            }

            if (dedup && seen.has(dedupKey)) continue;
            seen.add(dedupKey);

            entries.push({
                raw: line,
                protocol,
                clashProxy,
                nodeMeta,
            });
        } catch {
            // Ignore malformed node lines
        }
    }

    return entries;
}

// Parse multiline string and return node list for UI and metadata storage
export function parseProxyNodes(input, { dedup = true } = {}) {
    return collectLinks(input, { dedup }).map((entry) => entry.nodeMeta);
}

// Normalize multiline string (filter invalid + dedup)
export function normalizeProxyLinks(input, { dedup = true } = {}) {
    return collectLinks(input, { dedup })
        .map((entry) => entry.raw)
        .join("\n");
}
