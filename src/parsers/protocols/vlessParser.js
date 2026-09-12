import {
    createTlsConfig,
    createTransportConfig,
    guessRegion,
    parseArray,
    parseBool,
} from "../../utils.js";

export function parseVless(url) {
    const { uuid, host, port, params, name } = parseVlessUri(url);

    const tls = createTlsConfig(params);
    if (tls.reality) {
        tls.utls = {
            enabled: true,
            fingerprint: params.fp || "chrome",
        };
    }
    const transportType = params.type || "tcp";
    const transport =
        transportType === "tcp"
            ? undefined
            : createTransportConfig({ ...params, type: transportType });

    // `udp` is a Clash-only flag; ClashConfigBuilder reads it, SingboxConfigBuilder strips it.
    const udp = params.udp === undefined ? undefined : parseBool(params.udp);

    return {
        type: "vless",
        tag: name,
        server: host,
        server_port: port,
        uuid,
        tcp_fast_open: false,
        tls,
        transport,
        flow: params.flow ?? undefined,
        alpn: parseArray(params.alpn),
        ...(udp === undefined ? {} : { udp }),
    };
}

export function convertProxyForClash(proxy) {
    const transportType = proxy.transport?.type || "tcp";

    const result = {
        name: proxy.tag,
        type: "vless",
        server: proxy.server,
        port: proxy.server_port,
        uuid: proxy.uuid,
        flow: proxy.flow || undefined,
        tls: proxy.tls?.enabled || false,
        servername: proxy.tls?.server_name || "",
        "client-fingerprint": proxy.tls?.utls?.fingerprint || "chrome",
        network: transportType === "xhttp" ? "xhttp" : transportType,
        ...(proxy.udp === undefined ? {} : { udp: proxy.udp }),
    };

    if (proxy.tls?.reality?.enabled) {
        result["reality-opts"] = {
            "public-key": proxy.tls.reality.public_key,
            "short-id": proxy.tls.reality.short_id,
        };
    }

    if (transportType === "ws") {
        result["ws-opts"] = {
            path: proxy.transport.path || "/",
            headers: proxy.transport.headers || {},
        };
    } else if (transportType === "grpc") {
        result["grpc-opts"] = {
            "grpc-service-name": proxy.transport.service_name || "",
        };
    } else if (transportType === "xhttp") {
        result["xhttp-opts"] = {
            path: proxy.transport.path || "/vless-xhttp",
            mode: proxy.transport.mode || "auto",
        };
    }

    if (proxy.tcp_fast_open) {
        result.tfo = true;
    }
    if (proxy.tls?.insecure) {
        result["skip-cert-verify"] = true;
    }
    if (proxy.alpn && proxy.alpn.length > 0) {
        result.alpn = proxy.alpn;
    }

    return result;
}

export function parseVlessLinks(input, { dedup = true } = {}) {
    return collectVlessLinks(input, { dedup }).map(({ parsed }) => {
        const { uuid, host: server, port, params, name, paramEntries } = parsed;
        return {
            name,
            uuid,
            server,
            port,
            protocol: "VLESS",
            transport: params.type || "tcp",
            security: params.security || "none",
            sni: params.sni || "",
            path: params.path || "",
            host: params.host || "",
            serviceName: params.serviceName || "",
            flow: params.flow || "",
            region: guessRegion(server, name),
            params: paramEntries,
        };
    });
}

export function normalizeVlessLinks(input, { dedup = true } = {}) {
    return collectVlessLinks(input, { dedup })
        .map(({ raw }) => raw)
        .join("\n");
}

function collectVlessLinks(input, { dedup }) {
    const lines = (input || "")
        .split("\n")
        .filter((line) => line.trim().startsWith("vless://"));
    const entries = [];
    const seen = new Set();

    for (const line of lines) {
        try {
            const raw = line.trim();
            const parsed = parseVlessUri(raw);
            const dedupKey = `${parsed.host}:${parsed.port}:${parsed.uuid}`;
            if (dedup && seen.has(dedupKey)) continue;
            seen.add(dedupKey);
            entries.push({ raw, parsed });
        } catch {
            // Invalid lines are excluded from both metadata and stored subscriptions.
        }
    }

    return entries;
}

function parseVlessUri(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new TypeError("Invalid VLESS endpoint");
    }
    if (url.protocol !== "vless:") {
        throw new TypeError("Unsupported protocol");
    }

    const uuid = decodeURIComponent(url.username);
    const host = url.hostname.replace(/^\[(.*)\]$/, "$1");
    const port = Number(url.port || 443);
    if (!uuid || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new TypeError("Invalid VLESS endpoint");
    }

    const paramEntries = Array.from(url.searchParams.entries());
    const params = Object.fromEntries(paramEntries);
    const fallbackName = `${host}:${port}`;
    let name = url.hash.slice(1) || fallbackName;
    try {
        name = decodeURIComponent(name);
    } catch {
        // Preserve malformed labels instead of dropping an otherwise valid node.
    }

    return { uuid, host, port, params, paramEntries, name };
}

export { guessRegion };
