import { guessRegion, parseArray, parseBool } from "../../utils.js";

// Parse hysteria2:// or hy2:// URL into intermediate proxy representation
export function parseHysteria2(url) {
    const { auth, host, port, params, name } = parseHysteria2Uri(url);

    const insecureValue =
        params.insecure ?? params.allowInsecure ?? params["allow-insecure"];
    const insecure =
        insecureValue === undefined ? false : parseBool(insecureValue, false);

    const ports = params.mport || params.ports || undefined;
    const sni = params.sni || params.peer || undefined;
    const obfs = params.obfs || undefined;
    const obfsPassword = params["obfs-password"] || undefined;
    const certSha256 =
        params.pinSHA256 || params["certificate-sha256"] || undefined;
    const alpn = parseArray(params.alpn);
    const rawFastOpen = params.fastopen ?? params["fast-open"];
    const fastOpen =
        rawFastOpen === undefined ? undefined : parseBool(rawFastOpen);
    const fingerprint =
        params.fingerprint ||
        params["client-fingerprint"] ||
        params.fp ||
        undefined;

    return {
        type: "hysteria2",
        tag: name,
        server: host,
        server_port: port,
        password: auth,
        ports,
        sni,
        skip_cert_verify: insecure,
        obfs,
        obfs_password: obfsPassword,
        certificate_sha256: certSha256,
        alpn,
        fast_open: fastOpen,
        fingerprint,
        up: params.up || undefined,
        down: params.down || undefined,
    };
}

// Convert intermediate hysteria2 proxy to Clash.Meta / Mihomo YAML structure
export function convertHysteria2ForClash(proxy) {
    const result = {
        name: proxy.tag || proxy.name,
        type: "hysteria2",
        server: proxy.server,
        port: proxy.server_port || proxy.port,
        password: proxy.password || "",
    };

    if (proxy.ports) {
        result.ports = proxy.ports;
    }
    if (proxy.sni) {
        result.sni = proxy.sni;
    }
    if (proxy.skip_cert_verify || proxy["skip-cert-verify"]) {
        result["skip-cert-verify"] = true;
    }
    if (proxy.fingerprint) {
        result.fingerprint = proxy.fingerprint;
    }
    if (proxy.certificate_sha256 || proxy["certificate-sha256"]) {
        result["certificate-sha256"] =
            proxy.certificate_sha256 || proxy["certificate-sha256"];
    }
    if (proxy.obfs) {
        result.obfs = proxy.obfs;
    }
    if (proxy.obfs_password || proxy["obfs-password"]) {
        result["obfs-password"] = proxy.obfs_password || proxy["obfs-password"];
    }
    if (proxy.alpn && proxy.alpn.length > 0) {
        result.alpn = proxy.alpn;
    }
    if (proxy.fast_open || proxy["fast-open"]) {
        result["fast-open"] = true;
    }
    if (proxy.up) {
        result.up = proxy.up;
    }
    if (proxy.down) {
        result.down = proxy.down;
    }

    return result;
}

// Extract node metadata for UI preview and database storage
export function parseHysteria2Links(input, { dedup = true } = {}) {
    return collectHysteria2Links(input, { dedup }).map(({ parsed }) => {
        const { auth, host: server, port, params, name, paramEntries } = parsed;
        const insecureValue =
            params.insecure ?? params.allowInsecure ?? params["allow-insecure"];
        const insecure =
            insecureValue === undefined
                ? false
                : parseBool(insecureValue, false);

        return {
            name,
            uuid: auth, // Reuse uuid field for generic credential in frontend tables
            server,
            port,
            protocol: "HYSTERIA2",
            transport: "udp",
            security: insecure ? "insecure" : "tls",
            sni: params.sni || params.peer || "",
            path: "",
            host: "",
            serviceName: "",
            flow: "",
            region: guessRegion(server, name),
            params: paramEntries,
            ports: params.mport || params.ports || "",
            obfs: params.obfs || "",
        };
    });
}

export function normalizeHysteria2Links(input, { dedup = true } = {}) {
    return collectHysteria2Links(input, { dedup })
        .map(({ raw }) => raw)
        .join("\n");
}

function collectHysteria2Links(input, { dedup }) {
    const lines = (input || "").split("\n").filter((line) => {
        const trimmed = line.trim();
        return (
            trimmed.startsWith("hysteria2://") || trimmed.startsWith("hy2://")
        );
    });
    const entries = [];
    const seen = new Set();

    for (const line of lines) {
        try {
            const raw = line.trim();
            const parsed = parseHysteria2Uri(raw);
            const dedupKey = `${parsed.host}:${parsed.port}:${parsed.auth}`;
            if (dedup && seen.has(dedupKey)) continue;
            seen.add(dedupKey);
            entries.push({ raw, parsed });
        } catch {
            // Exclude invalid lines from metadata and stored subscriptions
        }
    }

    return entries;
}

export function parseHysteria2Uri(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new TypeError("Invalid Hysteria2 endpoint");
    }

    if (url.protocol !== "hysteria2:" && url.protocol !== "hy2:") {
        throw new TypeError("Unsupported protocol");
    }

    // Passwords may be in username or password slot of the URI
    const auth = decodeURIComponent(url.username || url.password || "");
    const host = url.hostname.replace(/^\[(.*)\]$/, "$1");
    const port = Number(url.port || 443);
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new TypeError("Invalid Hysteria2 endpoint");
    }

    const paramEntries = Array.from(url.searchParams.entries());
    const params = Object.fromEntries(paramEntries);
    const fallbackName = `${host}:${port}`;
    let name = fallbackName;
    try {
        name = decodeURIComponent(url.hash.slice(1)) || fallbackName;
    } catch {
        // Retain unencoded hash as fallback
    }

    return { auth, host, port, params, paramEntries, name };
}
